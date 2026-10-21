import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../api.dart';
import '../state.dart';
import '../theme.dart';
import '../widgets.dart';
import 'account.dart';

class ReaderPalette {
  final Color bg, fg, muted, card;
  const ReaderPalette(this.bg, this.fg, this.muted, this.card);
  static ReaderPalette of(ReaderTheme t) => switch (t) {
        ReaderTheme.light => const ReaderPalette(Color(0xFFFFFFFF), Color(0xFF221E33), Color(0xFF8A8499), Color(0xFFF6F3EE)),
        ReaderTheme.sepia => const ReaderPalette(Color(0xFFF4ECD8), Color(0xFF433422), Color(0xFF8E7A5E), Color(0xFFEBE0C6)),
        ReaderTheme.dark => const ReaderPalette(Color(0xFF14121C), Color(0xFFD9D4E4), Color(0xFF7E7890), Color(0xFF1F1C2B)),
      };
}

class ReaderScreen extends StatefulWidget {
  final String slug;
  final int number;
  const ReaderScreen({super.key, required this.slug, required this.number});
  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  late int number = widget.number;
  Map? d;
  Object? err;
  bool offline = false, chrome = true, busy = false;
  final sc = ScrollController();
  final keys = <int, GlobalKey>{};
  int maxPara = 0, lastSent = -1;
  String? readId;
  Timer? beat;
  FlutterTts? tts;
  int? speaking;

  AppState get app => AppScope.read(context);
  List get paras => (d?['chapter']?['paragraphs'] as List?) ?? [];

  @override
  void initState() {
    super.initState();
    sc.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => load());
    beat = Timer.periodic(const Duration(seconds: 8), (_) => _sync());
  }

  @override
  void dispose() {
    _sync();
    beat?.cancel();
    tts?.stop();
    sc.dispose();
    super.dispose();
  }

  Future<void> load() async {
    setState(() {
      d = null;
      err = null;
      maxPara = 0;
      lastSent = -1;
      readId = null;
      keys.clear();
    });
    try {
      final r = await app.api.get('/stories/${widget.slug}/chapters/$number');
      offline = false;
      if (r['access']['canRead'] == true && app.offline?.story(widget.slug) != null) {
        app.offline!.saveChapter(widget.slug, number, r);
      }
      setState(() => d = r);
      _sync(force: true);
    } catch (e) {
      final c = app.offline?.chapter(widget.slug, number);
      setState(() {
        if (c != null) {
          d = c;
          offline = true;
        } else {
          err = e;
        }
      });
    }
    if (sc.hasClients) sc.jumpTo(0);
  }

  void _onScroll() {
    if (!sc.hasClients || paras.isEmpty) return;
    final f = sc.position.maxScrollExtent <= 0 ? 1.0 : (sc.offset / sc.position.maxScrollExtent).clamp(0.0, 1.0);
    final p = (f * (paras.length - 1)).round();
    if (p > maxPara) maxPara = p;
    final down = sc.position.userScrollDirection.name == 'reverse';
    if (chrome && down && sc.offset > 80) setState(() => chrome = false);
  }

  Future<void> _sync({bool force = false}) async {
    final ch = d?['chapter'];
    if (ch == null || offline || d?['access']?['canRead'] != true) return;
    if (!force && maxPara == lastSent) return;
    lastSent = maxPara;
    try {
      final r = await app.api.post('/reads', {'chapterId': ch['id'], 'maxParagraph': maxPara, 'readId': ?readId});
      readId = r['readId'];
      if (app.loggedIn) await app.api.post('/me/progress', {'chapterId': ch['id'], 'paragraph': maxPara});
    } catch (_) {}
  }

  void go(int n) {
    _sync();
    tts?.stop();
    setState(() {
      number = n;
      speaking = null;
      chrome = true;
    });
    load();
  }

  Future<void> unlock(String mode) async {
    if (!app.loggedIn) {
      await Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return load();
    }
    setState(() => busy = true);
    try {
      await app.api.post('/wallet/unlock/${d!['chapter']['id']}', {'mode': mode});
      await app.refreshMe();
      if (mounted) context.toast(mode == 'rent' ? 'Đã thuê chương trong 48 giờ' : mode == 'wait' ? 'Đã dùng vé chờ miễn phí' : 'Đã mở khoá vĩnh viễn');
      await load();
    } catch (e) {
      if (mounted) context.toast(e is ApiError ? e.message : '$e');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> toggleTts() async {
    if (speaking != null) {
      await tts?.stop();
      setState(() => speaking = null);
      return;
    }
    tts ??= FlutterTts();
    await tts!.setLanguage('vi-VN');
    await tts!.setSpeechRate(app.ttsRate);
    tts!.setCompletionHandler(() {
      if (!mounted || speaking == null) return;
      final next = speaking! + 1;
      if (next >= paras.length) {
        setState(() => speaking = null);
      } else {
        _speak(next);
      }
    });
    _speak((maxPara > 0 ? maxPara - 1 : 0).clamp(0, paras.length - 1));
  }

  void _speak(int i) {
    setState(() => speaking = i);
    if (i > maxPara) maxPara = i;
    final k = keys[i]?.currentContext;
    if (k != null) Scrollable.ensureVisible(k, duration: const Duration(milliseconds: 400), alignment: .3);
    tts!.speak(paras[i]['text'] ?? '');
  }

  void openComments(int? paragraph) {
    final ch = d?['chapter'];
    if (ch == null) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      useSafeArea: true,
      builder: (_) => CommentsSheet(chapterId: ch['id'], paragraph: paragraph, quote: paragraph == null ? null : paras[paragraph]['text']),
    ).then((_) => load());
  }

  void openSettings() => showModalBottomSheet(
        context: context,
        showDragHandle: true,
        builder: (_) => SafeArea(child: Padding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 20), child: ReaderSettings(app: AppScope.of(context)))),
      );

  @override
  Widget build(BuildContext context) {
    final a = AppScope.of(context);
    final pal = ReaderPalette.of(a.readerTheme);
    final ch = d?['chapter'];
    final access = d?['access'];
    final counts = (d?['commentCounts'] as Map?) ?? {};
    final locked = access != null && access['canRead'] != true;

    return Theme(
      data: Theme.of(context).copyWith(scaffoldBackgroundColor: pal.bg),
      child: Scaffold(
        body: err != null
            ? ErrorView(err!, load)
            : d == null
                ? const Loading()
                : Stack(children: [
                    GestureDetector(
                      onTap: () => setState(() => chrome = !chrome),
                      child: CustomScrollView(controller: sc, slivers: [
                        SliverToBoxAdapter(
                          child: SafeArea(
                            bottom: false,
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(24, 70, 24, 10),
                              child: Column(children: [
                                Text('CHƯƠNG ${ch['number']}', style: TextStyle(letterSpacing: 3, fontSize: 12, color: Brand.seal, fontWeight: FontWeight.w700)),
                                const SizedBox(height: 10),
                                Text(ch['title'], textAlign: TextAlign.center, style: TextStyle(fontFamily: 'Lora', fontSize: 27, height: 1.25, fontWeight: FontWeight.w700, color: pal.fg)),
                                const SizedBox(height: 8),
                                Text('${d!['story']['title']} · ${ch['wordCount'] ?? 0} chữ${offline ? ' · ngoại tuyến' : ''}',
                                    textAlign: TextAlign.center, style: TextStyle(fontSize: 12.5, color: pal.muted)),
                                const SizedBox(height: 18),
                                Container(width: 40, height: 2, color: Brand.seal.withValues(alpha: .5)),
                              ]),
                            ),
                          ),
                        ),
                        SliverPadding(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          sliver: SliverList.builder(
                            itemCount: paras.length,
                            itemBuilder: (c, i) => _Para(
                              key: keys.putIfAbsent(i, () => GlobalKey()),
                              p: paras[i],
                              pal: pal,
                              size: a.fontSize,
                              height: a.lineHeight,
                              comments: (counts['$i'] ?? 0) as int,
                              speaking: speaking == i,
                              faded: locked && i == paras.length - 1,
                              onComment: locked || offline ? null : () => openComments(i),
                            ),
                          ),
                        ),
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
                            child: Column(children: [
                              if (locked) _Unlock(access: access, total: ch['totalParagraphs'] ?? 0, shown: paras.length, coins: a.coins, busy: busy, pal: pal, onUnlock: unlock),
                              if (!locked) ...[
                                Text('— Hết chương ${ch['number']} —', style: TextStyle(fontFamily: 'Lora', fontStyle: FontStyle.italic, color: pal.muted)),
                                const SizedBox(height: 16),
                                if (!offline)
                                  OutlinedButton.icon(
                                    onPressed: () => openComments(null),
                                    icon: const Icon(Icons.forum_outlined),
                                    label: const Text('Bình luận chương'),
                                    style: OutlinedButton.styleFrom(foregroundColor: pal.fg),
                                  ),
                              ],
                              const SizedBox(height: 20),
                              Row(children: [
                                if (d!['prev'] != null)
                                  Expanded(child: _NavCard('Chương trước', d!['prev']['title'], pal, () => go(d!['prev']['number']), alignEnd: false)),
                                if (d!['prev'] != null && d!['next'] != null) const SizedBox(width: 10),
                                if (d!['next'] != null)
                                  Expanded(child: _NavCard('Chương sau${(d!['next']['price'] ?? 0) > 0 ? ' 🔒' : ''}', d!['next']['title'], pal, () => go(d!['next']['number']), alignEnd: true)),
                              ]),
                            ]),
                          ),
                        ),
                      ]),
                    ),
                    // Top bar
                    AnimatedPositioned(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeOut,
                      top: chrome ? 0 : -110,
                      left: 0,
                      right: 0,
                      child: Container(
                        color: pal.bg.withValues(alpha: .96),
                        child: SafeArea(
                          bottom: false,
                          child: Row(children: [
                            IconButton(icon: Icon(Icons.arrow_back_rounded, color: pal.fg), onPressed: () => Navigator.pop(context)),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(d!['story']['title'], maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w700, color: pal.fg, fontSize: 14)),
                                Text('Chương ${ch['number']} · ${ch['title']}', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: pal.muted, fontSize: 12)),
                              ]),
                            ),
                            if (offline) Icon(Icons.cloud_off_rounded, color: pal.muted, size: 18),
                            IconButton(icon: Icon(Icons.text_fields_rounded, color: pal.fg), onPressed: openSettings),
                          ]),
                        ),
                      ),
                    ),
                    // Bottom bar
                    AnimatedPositioned(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeOut,
                      bottom: chrome ? 16 : -100,
                      left: 16,
                      right: 16,
                      child: SafeArea(
                        top: false,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          decoration: BoxDecoration(
                            color: pal.card,
                            borderRadius: BorderRadius.circular(22),
                            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .15), blurRadius: 20, offset: const Offset(0, 6))],
                          ),
                          child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                            IconButton(onPressed: d!['prev'] == null ? null : () => go(d!['prev']['number']), icon: Icon(Icons.chevron_left_rounded, color: pal.fg)),
                            IconButton(onPressed: locked || offline ? null : () => openComments(null), icon: Icon(Icons.chat_bubble_outline_rounded, color: pal.fg)),
                            GestureDetector(
                              onTap: locked ? null : toggleTts,
                              child: Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(gradient: Brand.sealGradient, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Brand.seal.withValues(alpha: .4), blurRadius: 12)]),
                                child: Icon(speaking != null ? Icons.stop_rounded : Icons.headphones_rounded, color: Colors.white),
                              ),
                            ),
                            IconButton(onPressed: openSettings, icon: Icon(Icons.palette_outlined, color: pal.fg)),
                            IconButton(onPressed: d!['next'] == null ? null : () => go(d!['next']['number']), icon: Icon(Icons.chevron_right_rounded, color: pal.fg)),
                          ]),
                        ),
                      ),
                    ),
                  ]),
      ),
    );
  }
}

class _Para extends StatelessWidget {
  final Map p;
  final ReaderPalette pal;
  final double size, height;
  final int comments;
  final bool speaking, faded;
  final VoidCallback? onComment;
  const _Para({super.key, required this.p, required this.pal, required this.size, required this.height, required this.comments, required this.speaking, required this.faded, this.onComment});
  @override
  Widget build(BuildContext context) {
    final type = p['type'];
    if (type == 'hr') {
      return Padding(padding: const EdgeInsets.symmetric(vertical: 18), child: Center(child: Text('⁂', style: TextStyle(color: pal.muted, fontSize: 20))));
    }
    final style = TextStyle(
      fontFamily: 'Lora',
      fontSize: type == 'h' ? size * 1.2 : size,
      height: height,
      color: pal.fg,
      fontWeight: type == 'h' ? FontWeight.w700 : FontWeight.w400,
      fontStyle: type == 'quote' ? FontStyle.italic : FontStyle.normal,
    );
    Widget text = Text(p['text'] ?? '', style: style);
    if (type == 'quote') {
      text = Container(padding: const EdgeInsets.only(left: 14), decoration: const BoxDecoration(border: Border(left: BorderSide(color: Brand.seal, width: 3))), child: text);
    }
    if (faded) {
      text = ShaderMask(
        shaderCallback: (r) => LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [pal.fg, pal.fg.withValues(alpha: 0)]).createShader(r),
        blendMode: BlendMode.dstIn,
        child: text,
      );
    }
    return GestureDetector(
      onLongPress: onComment,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        margin: const EdgeInsets.only(bottom: 14),
        padding: EdgeInsets.symmetric(horizontal: speaking ? 8 : 0, vertical: speaking ? 6 : 0),
        decoration: BoxDecoration(color: speaking ? Brand.gold.withValues(alpha: .16) : Colors.transparent, borderRadius: BorderRadius.circular(10)),
        child: Stack(clipBehavior: Clip.none, children: [
          text,
          if (comments > 0 && onComment != null)
            Positioned(
              right: -18,
              top: 2,
              child: GestureDetector(
                onTap: onComment,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: Brand.seal, borderRadius: BorderRadius.circular(99)),
                  child: Text('$comments', style: const TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w700, fontFamily: 'BeVietnamPro')),
                ),
              ),
            ),
        ]),
      ),
    );
  }
}

class _NavCard extends StatelessWidget {
  final String label, title;
  final ReaderPalette pal;
  final VoidCallback onTap;
  final bool alignEnd;
  const _NavCard(this.label, this.title, this.pal, this.onTap, {required this.alignEnd});
  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: pal.card, borderRadius: BorderRadius.circular(16)),
          child: Column(crossAxisAlignment: alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start, children: [
            Text(label, style: TextStyle(fontSize: 11.5, color: pal.muted)),
            const SizedBox(height: 3),
            Text(title, maxLines: 2, textAlign: alignEnd ? TextAlign.end : TextAlign.start, style: TextStyle(fontWeight: FontWeight.w600, color: pal.fg, fontSize: 13.5)),
          ]),
        ),
      );
}

class _Unlock extends StatelessWidget {
  final Map access;
  final int total, shown, coins;
  final bool busy;
  final ReaderPalette pal;
  final void Function(String) onUnlock;
  const _Unlock({required this.access, required this.total, required this.shown, required this.coins, required this.busy, required this.pal, required this.onUnlock});

  @override
  Widget build(BuildContext context) {
    final wf = access['waitFree'] ?? {};
    final avail = wf['availableAt'] == null ? null : DateTime.parse(wf['availableAt']).toLocal();
    final waitReady = wf['enabled'] == true && (avail == null || !avail.isAfter(DateTime.now()));
    String waitSub = 'Không áp dụng';
    if (wf['enabled'] == true) {
      if (waitReady) {
        waitSub = 'Vé sẵn sàng · miễn phí';
      } else {
        final left = avail!.difference(DateTime.now());
        waitSub = 'Còn ${left.inHours}g ${left.inMinutes % 60}p';
      }
    }
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: pal.card,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: Brand.seal.withValues(alpha: .15)),
      ),
      child: Column(children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(gradient: Brand.sealGradient, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Brand.seal.withValues(alpha: .35), blurRadius: 14)]),
          child: const Icon(Icons.lock_rounded, color: Colors.white),
        ),
        const SizedBox(height: 12),
        Text('Chương này cần mở khoá', style: TextStyle(fontFamily: 'Lora', fontSize: 21, fontWeight: FontWeight.w700, color: pal.fg)),
        const SizedBox(height: 4),
        Text('Còn ${total - shown} đoạn nữa · 70% số xu đến tay tác giả', textAlign: TextAlign.center, style: TextStyle(fontSize: 12.5, color: pal.muted)),
        const SizedBox(height: 16),
        _Opt(Icons.hourglass_bottom_rounded, 'Chờ là miễn phí', waitSub, Colors.teal, pal, busy || !waitReady ? null : () => onUnlock('wait')),
        _Opt(Icons.schedule_rounded, 'Thuê 48 giờ', '${access['rentPrice']} xu · đọc lại thoải mái trong 2 ngày', Colors.blue, pal, busy ? null : () => onUnlock('rent')),
        _Opt(Icons.toll_rounded, 'Mua vĩnh viễn', '${access['price']} xu · mở khoá mãi mãi', Brand.gold, pal, busy ? null : () => onUnlock('buy'), highlight: true),
        const SizedBox(height: 8),
        Text('Số dư: $coins xu', style: TextStyle(color: pal.muted, fontSize: 12.5)),
      ]),
    );
  }
}

class _Opt extends StatelessWidget {
  final IconData icon;
  final String title, sub;
  final Color color;
  final ReaderPalette pal;
  final VoidCallback? onTap;
  final bool highlight;
  const _Opt(this.icon, this.title, this.sub, this.color, this.pal, this.onTap, {this.highlight = false});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Opacity(
          opacity: onTap == null ? .5 : 1,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: pal.bg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: highlight ? Brand.gold : pal.muted.withValues(alpha: .2), width: highlight ? 1.6 : 1),
              ),
              child: Row(children: [
                Icon(icon, color: color),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(title, style: TextStyle(fontWeight: FontWeight.w700, color: pal.fg)),
                    Text(sub, style: TextStyle(fontSize: 12, color: pal.muted)),
                  ]),
                ),
                Icon(Icons.chevron_right_rounded, color: pal.muted),
              ]),
            ),
          ),
        ),
      );
}

class ReaderSettings extends StatelessWidget {
  final AppState app;
  const ReaderSettings({super.key, required this.app});
  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: app,
        builder: (context, _) => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            for (final t in ReaderTheme.values)
              Expanded(
                child: GestureDetector(
                  onTap: () => app.setReader(theme: t),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    height: 64,
                    decoration: BoxDecoration(
                      color: ReaderPalette.of(t).bg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: app.readerTheme == t ? Brand.seal : Colors.black12, width: app.readerTheme == t ? 2 : 1),
                    ),
                    alignment: Alignment.center,
                    child: Text(const {'light': 'Sáng', 'sepia': 'Giấy', 'dark': 'Tối'}[t.name]!,
                        style: TextStyle(fontFamily: 'Lora', fontWeight: FontWeight.w700, color: ReaderPalette.of(t).fg)),
                  ),
                ),
              ),
          ]),
          const SizedBox(height: 14),
          _Slider('Cỡ chữ', app.fontSize, 14, 28, (v) => app.setReader(size: v), label: '${app.fontSize.round()}'),
          _Slider('Giãn dòng', app.lineHeight, 1.3, 2.2, (v) => app.setReader(height: v), label: app.lineHeight.toStringAsFixed(1)),
          _Slider('Tốc độ đọc to', app.ttsRate, .2, .9, (v) => app.setReader(rate: v), label: '${(app.ttsRate * 2).toStringAsFixed(1)}×'),
        ]),
      );
}

class _Slider extends StatelessWidget {
  final String title, label;
  final double v, min, max;
  final ValueChanged<double> on;
  const _Slider(this.title, this.v, this.min, this.max, this.on, {required this.label});
  @override
  Widget build(BuildContext context) => Row(children: [
        SizedBox(width: 108, child: Text(title, style: const TextStyle(fontWeight: FontWeight.w600))),
        Expanded(child: Slider(value: v.clamp(min, max), min: min, max: max, activeColor: Brand.seal, onChanged: on)),
        SizedBox(width: 36, child: Text(label, textAlign: TextAlign.end)),
      ]);
}

class CommentsSheet extends StatefulWidget {
  final String chapterId;
  final int? paragraph;
  final String? quote;
  const CommentsSheet({super.key, required this.chapterId, this.paragraph, this.quote});
  @override
  State<CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends State<CommentsSheet> {
  final ctl = TextEditingController();
  int bump = 0;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * .7,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Text(widget.paragraph == null ? 'Bình luận chương' : 'Bình luận đoạn ${widget.paragraph! + 1}',
                style: const TextStyle(fontFamily: 'Lora', fontSize: 20, fontWeight: FontWeight.w700)),
          ),
          if (widget.quote != null)
            Container(
              margin: const EdgeInsets.fromLTRB(20, 0, 20, 8),
              padding: const EdgeInsets.only(left: 12),
              decoration: const BoxDecoration(border: Border(left: BorderSide(color: Brand.seal, width: 3))),
              child: Text(widget.quote!, maxLines: 3, overflow: TextOverflow.ellipsis, style: TextStyle(fontFamily: 'Lora', fontStyle: FontStyle.italic, color: context.muted)),
            ),
          Expanded(
            child: Loader<dynamic>(
              key: ValueKey(bump),
              load: () => app.api.get('/chapters/${widget.chapterId}/comments', {'paragraph': widget.paragraph?.toString() ?? 'chapter'}),
              builder: (c, d, _) {
                final items = d as List;
                if (items.isEmpty) return Center(child: Text('Hãy là người đầu tiên bình luận', style: TextStyle(color: c.muted)));
                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: items.length,
                  itemBuilder: (c, i) {
                    final m = items[i];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Avatar(m['user']),
                      title: Text('${m['user']['name']}  ·  ${ago(m['createdAt'])}', style: TextStyle(fontSize: 12.5, color: c.muted)),
                      subtitle: Text(m['body'], style: TextStyle(fontSize: 14.5, color: c.fg, height: 1.45)),
                    );
                  },
                );
              },
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 8, 8),
              child: app.loggedIn
                  ? Row(children: [
                      Expanded(child: TextField(controller: ctl, decoration: const InputDecoration(hintText: 'Viết bình luận…'))),
                      IconButton(
                        icon: const Icon(Icons.send_rounded, color: Brand.seal),
                        onPressed: () async {
                          if (ctl.text.trim().isEmpty) return;
                          try {
                            await app.api.post('/chapters/${widget.chapterId}/comments', {'body': ctl.text, 'paragraph': widget.paragraph});
                            ctl.clear();
                            setState(() => bump++);
                          } catch (e) {
                            if (context.mounted) context.toast('$e');
                          }
                        },
                      ),
                    ])
                  : const Text('Đăng nhập để bình luận'),
            ),
          ),
        ]),
      ),
    );
  }
}
