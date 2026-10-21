import 'package:flutter/material.dart';
import '../api.dart';
import '../state.dart';
import '../theme.dart';
import '../widgets.dart';
import 'account.dart';
import '../motion.dart';
import 'reader.dart';

class StoryScreen extends StatefulWidget {
  final String slug;
  final Map? preview;
  const StoryScreen({super.key, required this.slug, this.preview});
  @override
  State<StoryScreen> createState() => _StoryScreenState();
}

class _StoryScreenState extends State<StoryScreen> {
  Map? s;
  Object? err;
  bool offlineMode = false;
  double? dl;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    final app = AppScope.read(context);
    try {
      final r = await app.api.get('/stories/${widget.slug}');
      setState(() {
        s = r;
        err = null;
        offlineMode = false;
      });
    } catch (e) {
      final off = app.offline?.story(widget.slug);
      setState(() {
        if (off != null) {
          s = off;
          offlineMode = true;
        } else {
          err = e;
        }
      });
    }
  }

  Future<void> download() async {
    final app = AppScope.read(context);
    final chs = (s!['chapters'] as List);
    var saved = 0;
    setState(() => dl = 0);
    await app.offline!.saveStory(Map.from(s!)..remove('reviews'));
    for (var i = 0; i < chs.length; i++) {
      try {
        final d = await app.api.get('/stories/${widget.slug}/chapters/${chs[i]['number']}');
        if (d['access']['canRead'] == true) {
          await app.offline!.saveChapter(widget.slug, chs[i]['number'], d);
          saved++;
        }
      } catch (_) {}
      if (mounted) setState(() => dl = (i + 1) / chs.length);
    }
    if (mounted) {
      setState(() => dl = null);
      context.toast('Đã tải $saved/${chs.length} chương để đọc ngoại tuyến${saved < chs.length ? ' (chương khoá cần mở trước)' : ''}');
    }
  }

  Future<void> toggleLibrary() async {
    final app = AppScope.read(context);
    if (!app.loggedIn) return _login();
    final inLib = s!['mine']?['inLibrary'] == true;
    try {
      inLib ? await app.api.delete('/me/library/${s!['id']}') : await app.api.post('/me/library/${s!['id']}');
      if (mounted) context.toast(inLib ? 'Đã bỏ khỏi tủ sách' : 'Đã thêm vào tủ sách');
      load();
    } catch (e) {
      if (mounted) context.toast('$e');
    }
  }

  void _login() => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())).then((_) => load());

  Future<void> tip() async {
    final app = AppScope.read(context);
    if (!app.loggedIn) return _login();
    final coins = await showModalBottomSheet<int>(
      context: context,
      showDragHandle: true,
      builder: (c) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Ủng hộ tác giả', style: TextStyle(fontFamily: 'Lora', fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('90% số xu được chuyển thẳng cho ${s!['author']['name']}. Số dư: ${app.coins} xu', style: TextStyle(color: c.muted)),
            const SizedBox(height: 16),
            Wrap(spacing: 10, runSpacing: 10, children: [
              for (final v in [10, 20, 50, 100])
                ActionChip(
                  avatar: const Icon(Icons.toll_rounded, color: Brand.gold, size: 18),
                  label: Text('$v xu', style: const TextStyle(fontWeight: FontWeight.w700)),
                  onPressed: () => Navigator.pop(c, v),
                ),
            ]),
          ]),
        ),
      ),
    );
    if (coins == null) return;
    try {
      await app.api.post('/wallet/tip/${s!['id']}', {'coins': coins});
      await app.refreshMe();
      if (mounted) context.toast('Cảm ơn bạn đã ủng hộ $coins xu 💛');
    } catch (e) {
      if (mounted) context.toast(e is ApiError ? e.message : '$e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    if (err != null) return Scaffold(appBar: AppBar(), body: ErrorView(err!, load));
    final st = s ?? widget.preview;
    if (st == null) return const Scaffold(body: Loading());
    final seed = (st['coverSeed'] ?? 1) as int;
    final hue = ((seed * 47) % 360).toDouble();
    final chs = (s?['chapters'] as List?) ?? [];
    final mine = s?['mine'];
    final unlocked = ((mine?['unlocked'] as List?) ?? []).toSet();
    final progress = mine?['progress'];
    final c = st['_count'] ?? {};
    final rating = s?['rating'];
    final offlineNums = app.offline?.chapterNumbers(widget.slug).toSet() ?? {};

    return Scaffold(
      body: CustomScrollView(slivers: [
        SliverAppBar(
          pinned: true,
          expandedHeight: 330,
          foregroundColor: Colors.white,
          backgroundColor: HSLColor.fromAHSL(1, hue, .4, .16).toColor(),
          actions: [
            if (offlineMode) const Padding(padding: EdgeInsets.only(right: 8), child: Center(child: Pill('Ngoại tuyến', color: Colors.white))),
            IconButton(
              tooltip: 'Tải để đọc ngoại tuyến',
              onPressed: s == null || offlineMode || dl != null ? null : download,
              icon: dl != null
                  ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(value: dl, strokeWidth: 2.4, color: Colors.white))
                  : Icon(offlineNums.isNotEmpty ? Icons.download_done_rounded : Icons.download_rounded),
            ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [
                  HSLColor.fromAHSL(1, hue, .45, .32).toColor(),
                  HSLColor.fromAHSL(1, (hue + 40) % 360, .4, .12).toColor(),
                ]),
              ),
              padding: const EdgeInsets.fromLTRB(20, 90, 20, 20),
              child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Tilt3D(child: Cover(story: st, width: 128)),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.end, children: [
                    Wrap(spacing: 6, runSpacing: 6, children: [
                      Pill(st['genre'] ?? '', color: Colors.white),
                      Pill(statusLabel(st['status']), color: const Color(0xFFFFC870)),
                      if (st['ageRating'] != null && st['ageRating'] != 'ALL') Pill('${st['ageRating'].toString().replaceAll('T', '')}+', color: const Color(0xFFFF8A73)),
                    ]),
                    const SizedBox(height: 10),
                    Text(st['title'], style: const TextStyle(fontFamily: 'Lora', fontSize: 23, height: 1.15, color: Colors.white, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Text('bởi ${st['author']?['name'] ?? ''}', style: const TextStyle(color: Colors.white70)),
                  ]),
                ),
              ]),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                _Stat(fmtNum(st['views'] ?? 0), 'lượt đọc'),
                _Stat('${c['chapters'] ?? chs.length}', 'chương'),
                _Stat(rating == null ? '–' : (rating['avg'] as num).toStringAsFixed(1), '${rating?['count'] ?? 0} đánh giá'),
                _Stat('${c['library'] ?? 0}', 'theo dõi'),
              ]),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: chs.isEmpty && !offlineMode
                        ? null
                        : () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => ReaderScreen(slug: widget.slug, number: progress?['chapterNo'] ?? (offlineMode && offlineNums.isNotEmpty ? offlineNums.first : 1))),
                            ).then((_) => load()),
                    icon: const Icon(Icons.menu_book_rounded),
                    label: Text(progress != null ? 'Đọc tiếp chương ${progress['chapterNo']}' : 'Đọc từ đầu'),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filledTonal(
                  onPressed: offlineMode ? null : toggleLibrary,
                  icon: Icon(mine?['inLibrary'] == true ? Icons.bookmark_rounded : Icons.bookmark_add_outlined, color: Brand.seal),
                ),
                const SizedBox(width: 4),
                IconButton.filledTonal(onPressed: offlineMode ? null : tip, icon: const Icon(Icons.card_giftcard_rounded, color: Brand.gold)),
              ]),
              if (st['waitFreeHours'] != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Brand.gold.withValues(alpha: .1), borderRadius: BorderRadius.circular(14)),
                  child: Row(children: [
                    const Icon(Icons.hourglass_bottom_rounded, color: Brand.gold, size: 20),
                    const SizedBox(width: 8),
                    Expanded(child: Text('Chờ là miễn phí: cứ ${st['waitFreeHours']} giờ bạn được mở 1 chương trả phí.', style: const TextStyle(fontSize: 13))),
                  ]),
                ),
              ],
              const SizedBox(height: 16),
              Text(st['synopsis'] ?? '', style: TextStyle(fontFamily: 'Lora', fontSize: 15.5, height: 1.65, color: context.fg.withValues(alpha: .85))),
              const SizedBox(height: 12),
              Wrap(spacing: 6, runSpacing: 6, children: [for (final t in (st['tags'] as List? ?? [])) Pill('#$t')]),
              const SizedBox(height: 22),
              Row(children: [
                const Text('Mục lục', style: TextStyle(fontFamily: 'Lora', fontSize: 21, fontWeight: FontWeight.w700)),
                const Spacer(),
                Text('${chs.length} chương', style: TextStyle(color: context.muted)),
              ]),
              const SizedBox(height: 6),
            ]),
          ),
        ),
        SliverList.builder(
          itemCount: chs.length,
          itemBuilder: (context, i) {
            final ch = chs[i];
            final price = (ch['price'] ?? 0) as int;
            final open = price == 0 || unlocked.contains(ch['id']) || mine?['isAuthor'] == true;
            final current = progress?['chapterNo'] == ch['number'];
            return ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 20),
              leading: Text((ch['number'] as int).toString().padLeft(2, '0'),
                  style: TextStyle(fontFamily: 'Lora', fontSize: 18, fontWeight: FontWeight.w700, color: current ? Brand.seal : context.muted.withValues(alpha: .6))),
              title: Text(ch['title'], style: TextStyle(fontWeight: FontWeight.w600, color: current ? Brand.seal : null)),
              subtitle: Text('${ch['wordCount'] ?? 0} chữ · ${ago(ch['publishedAt'])}', style: TextStyle(fontSize: 12, color: context.muted)),
              trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                if (offlineNums.contains(ch['number'])) Padding(padding: const EdgeInsets.only(right: 6), child: Icon(Icons.offline_pin_rounded, size: 18, color: Colors.green.shade600)),
                open
                    ? (price > 0 ? const Pill('Đã mở', color: Colors.green, icon: Icons.lock_open_rounded) : const Pill('Miễn phí'))
                    : Pill('$price xu', color: Brand.gold, icon: Icons.lock_rounded),
              ]),
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ReaderScreen(slug: widget.slug, number: ch['number']))).then((_) => load()),
            );
          },
        ),
        if ((s?['reviews'] as List?)?.isNotEmpty == true)
          SliverToBoxAdapter(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const SectionTitle('Đánh giá'),
              for (final r in (s!['reviews'] as List).take(3))
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                  child: Card(
                    margin: EdgeInsets.zero,
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Avatar(r['user'], size: 30),
                          const SizedBox(width: 10),
                          Expanded(child: Text(r['user']?['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600))),
                          for (var k = 0; k < 5; k++) Icon(k < (r['rating'] ?? 0) ? Icons.star_rounded : Icons.star_outline_rounded, size: 16, color: Brand.gold),
                        ]),
                        const SizedBox(height: 8),
                        Text(r['body'] ?? '', style: const TextStyle(fontFamily: 'Lora', height: 1.55)),
                      ]),
                    ),
                  ),
                ),
            ]),
          ),
        const SliverToBoxAdapter(child: SizedBox(height: 40)),
      ]),
    );
  }
}

class _Stat extends StatelessWidget {
  final String v, l;
  const _Stat(this.v, this.l);
  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(children: [
          Text(v, style: const TextStyle(fontFamily: 'Lora', fontSize: 20, fontWeight: FontWeight.w700)),
          Text(l, style: TextStyle(fontSize: 11.5, color: context.muted)),
        ]),
      );
}
