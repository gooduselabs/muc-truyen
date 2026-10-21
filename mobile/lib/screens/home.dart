import 'package:flutter/material.dart';
import '../main.dart';
import '../state.dart';
import '../theme.dart';
import '../widgets.dart';
import 'reader.dart';
import 'account.dart';
import '../motion.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Key k = UniqueKey();
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return SafeArea(
      bottom: false,
      child: Loader<List>(
        key: ValueKey('${app.api.server}-${app.loggedIn}-$k'),
        load: () async => [
          await app.api.get('/discover/home'),
          app.loggedIn ? await app.api.get('/me/history').catchError((_) => []) : [],
          app.loggedIn ? await app.api.get('/discover/recommend').catchError((_) => []) : [],
        ],
        builder: (context, d, reload) {
          final home = d[0] as Map;
          final history = (d[1] as List).take(6).toList();
          final rec = d[2] is List ? d[2] as List : ((d[2] as Map)['items'] as List? ?? []);
          return RefreshIndicator(
            color: Brand.seal,
            onRefresh: reload,
            child: ListView(padding: const EdgeInsets.only(bottom: 30), children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 12, 4),
                child: Row(children: [
                  const Logo(size: 34, tagline: true),
                  const Spacer(),
                  if (app.loggedIn) CoinBadge(app.coins),
                  IconButton(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                    icon: Badge(isLabelVisible: app.unread > 0, label: Text('${app.unread}'), child: const Icon(Icons.notifications_none_rounded)),
                  ),
                ]),
              ),
              _Hero(banners: _banners(home)),
              if (history.isNotEmpty) ...[
                const SectionTitle('Đọc tiếp', sub: 'Tiến độ được đồng bộ với web'),
                SizedBox(
                  height: 112,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: history.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 12),
                    itemBuilder: (c, i) => _ContinueCard(history[i]),
                  ),
                ),
              ],
              for (final sec in (home['sections'] as List? ?? []).take(1)) sec['style'] == 'spotlight' ? _Spotlight(sec) : _Shelf(sec['title'], sec['stories'], sub: sec['subtitle']),
              _Shelf('Đang thịnh hành', home['trending'], sub: 'Được đọc nhiều nhất tuần này'),
              if (rec.isNotEmpty) _Shelf('Dành cho bạn', rec, sub: 'Gợi ý theo thể loại bạn hay đọc'),
              const SectionTitle('Thể loại'),
              SizedBox(
                height: 40,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  children: [
                    for (final g in (home['genres'] as List))
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ActionChip(
                          label: Text(g),
                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => Scaffold(appBar: AppBar(title: Text(g)), body: SearchResults(genre: g)))),
                        ),
                      ),
                  ],
                ),
              ),
              for (final sec in (home['sections'] as List? ?? []).skip(1)) sec['style'] == 'spotlight' ? _Spotlight(sec) : _Shelf(sec['title'], sec['stories'], sub: sec['subtitle']),
              _Shelf('Mới cập nhật', home['updated']),
              _Shelf('Đã hoàn thành', home['completed'], sub: 'Đọc một mạch không phải chờ'),
              _Shelf('Được yêu thích', home['topLiked']),
            ]),
          );
        },
      ),
    );
  }
}

List<Map> _banners(Map home) {
  final b = (home['banners'] as List? ?? []).cast<Map>();
  if (b.isNotEmpty) return b;
  return (home['featured'] as List).map<Map>((s) => {'id': s['id'], 'title': s['title'], 'subtitle': s['synopsis'], 'kicker': 'Nổi bật', 'hue': ((s['coverSeed'] ?? 1) * 47) % 360, 'story': s}).toList();
}

/// Admin-curated hero carousel with parallax: cover and text move at different speeds while swiping.
class _Hero extends StatefulWidget {
  final List<Map> banners;
  const _Hero({required this.banners});
  @override
  State<_Hero> createState() => _HeroState();
}

class _HeroState extends State<_Hero> {
  final pc = PageController(viewportFraction: .9);
  double page = 0;
  @override
  void initState() {
    super.initState();
    pc.addListener(() => setState(() => page = pc.page ?? 0));
  }

  @override
  void dispose() {
    pc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(children: [
        SizedBox(
          height: 250,
          child: PageView.builder(
            controller: pc,
            itemCount: widget.banners.length,
            itemBuilder: (c, i) {
              final b = widget.banners[i];
              final s = b['story'] as Map?;
              final hue = ((b['hue'] ?? 12) as num).toDouble();
              final d = (page - i).clamp(-1.0, 1.0);
              return GestureDetector(
                onTap: () => s != null ? openStory(context, s) : null,
                child: Transform.scale(
                  scale: 1 - d.abs() * .06,
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(28),
                      gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [
                        HSLColor.fromAHSL(1, hue, .55, .32).toColor(),
                        HSLColor.fromAHSL(1, (hue + 40) % 360, .45, .12).toColor(),
                      ]),
                      boxShadow: [BoxShadow(color: HSLColor.fromAHSL(.45, hue, .5, .25).toColor(), blurRadius: 22, offset: const Offset(0, 12))],
                    ),
                    child: Stack(children: [
                      // far layer: big italic watermark, moves slowest
                      Positioned(
                        right: -30 + d * 60,
                        bottom: -40,
                        child: Text('Mực', style: TextStyle(fontFamily: display, fontStyle: FontStyle.italic, fontWeight: FontWeight.w900, fontSize: 150, color: Colors.white.withValues(alpha: .06))),
                      ),
                      Positioned(top: -60, right: -40, child: Container(width: 200, height: 200, decoration: BoxDecoration(shape: BoxShape.circle, gradient: RadialGradient(colors: [const Color(0xFFFFB86B).withValues(alpha: .35), Colors.transparent])))),
                      Padding(
                        padding: const EdgeInsets.all(18),
                        child: Row(children: [
                          // near layer: cover moves faster than the card
                          Transform.translate(
                            offset: Offset(d * -46, 0),
                            child: s != null
                                ? Transform(alignment: Alignment.center, transform: Matrix4.identity()..setEntry(3, 2, .0015)..rotateY(-.18 + d * .4), child: Cover(story: s, width: 112))
                                : SizedBox(width: 112, child: Center(child: Icon(Icons.local_fire_department_rounded, size: 72, color: const Color(0xFFFFC870).withValues(alpha: .9)))),
                          ),
                          const SizedBox(width: 18),
                          Expanded(
                            child: Transform.translate(
                              offset: Offset(d * 24, 0),
                              child: Opacity(
                                opacity: (1 - d.abs() * 1.4).clamp(0, 1),
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                                  Pill((b['kicker'] ?? 'Nổi bật').toString().toUpperCase(), color: const Color(0xFFFFC870), icon: Icons.auto_awesome),
                                  const SizedBox(height: 10),
                                  Text(b['title'], maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontFamily: display, color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, height: 1.1)),
                                  const SizedBox(height: 6),
                                  Text((b['subtitle'] ?? '').toString(), maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(fontFamily: 'Lora', color: Colors.white70, fontSize: 12.5, height: 1.45)),
                                  if (s != null) ...[
                                    const SizedBox(height: 10),
                                    Text('${s['author']['name']} · ${s['genre']}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                                  ],
                                ]),
                              ),
                            ),
                          ),
                        ]),
                      ),
                    ]),
                  ),
                ),
              );
            },
          ),
        ),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          for (var i = 0; i < widget.banners.length; i++)
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.all(3),
              width: (page.round() == i) ? 22 : 6,
              height: 6,
              decoration: BoxDecoration(color: page.round() == i ? context.accent : context.muted.withValues(alpha: .3), borderRadius: BorderRadius.circular(9)),
            ),
        ]),
      ]);
}

/// Editor's-pick spotlight on a night-ink panel.
class _Spotlight extends StatelessWidget {
  final Map sec;
  const _Spotlight(this.sec);
  @override
  Widget build(BuildContext context) {
    final items = (sec['stories'] as List);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 26, 16, 0),
      child: StaggerIn(
        index: 0,
        child: Container(
          padding: const EdgeInsets.fromLTRB(18, 20, 0, 20),
          decoration: BoxDecoration(gradient: Brand.nightGradient, borderRadius: BorderRadius.circular(28), boxShadow: [BoxShadow(color: Brand.ink.withValues(alpha: .35), blurRadius: 20, offset: const Offset(0, 10))]),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Transform.rotate(
              angle: -.08,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(border: Border.all(color: const Color(0xFFFF9B73), width: 1.6), borderRadius: BorderRadius.circular(5)),
                child: const Text('TUYỂN CHỌN', style: TextStyle(fontFamily: display, color: Color(0xFFFF9B73), fontWeight: FontWeight.w800, fontSize: 10, letterSpacing: 1.5)),
              ),
            ),
            const SizedBox(height: 10),
            Text(sec['title'], style: const TextStyle(fontFamily: display, fontSize: 26, color: Color(0xFFF2E8D5), fontWeight: FontWeight.w900)),
            Text(sec['subtitle'] ?? '', style: const TextStyle(fontFamily: 'Lora', fontStyle: FontStyle.italic, color: Colors.white60)),
            const SizedBox(height: 16),
            SizedBox(
              height: 210,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(right: 18),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(width: 14),
                itemBuilder: (c, i) => StaggerIn(
                  index: i + 1,
                  child: GestureDetector(
                    onTap: () => openStory(context, items[i]),
                    child: SizedBox(
                      width: 112,
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Tilt3D(child: Cover(story: items[i], width: 112)),
                        const SizedBox(height: 6),
                        Text(items[i]['author']['name'], style: const TextStyle(color: Colors.white60, fontSize: 11.5)),
                      ]),
                    ),
                  ),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

class _ContinueCard extends StatelessWidget {
  final Map s;
  const _ContinueCard(this.s);
  @override
  Widget build(BuildContext context) {
    final p = s['progress'] ?? {};
    final total = (s['_count']?['chapters'] ?? 1) as int;
    final n = (p['chapterNo'] ?? 1) as int;
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ReaderScreen(slug: s['slug'], number: n))),
      child: Container(
        width: 270,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Theme.of(context).cardTheme.color,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: context.isDark ? Colors.white10 : const Color(0xFFEDE6DA)),
        ),
        child: Row(children: [
          Cover(story: s, width: 60, radius: 8, showTitle: false),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
              Text(s['title'], maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontFamily: 'Lora', fontWeight: FontWeight.w700, fontSize: 15)),
              const SizedBox(height: 3),
              Text('Chương $n / $total', style: TextStyle(fontSize: 12, color: context.muted)),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(9),
                child: LinearProgressIndicator(value: (n / total).clamp(0, 1), minHeight: 5, color: Brand.seal, backgroundColor: Brand.seal.withValues(alpha: .12)),
              ),
              const SizedBox(height: 6),
              const Text('Đọc tiếp →', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Brand.seal)),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _Shelf extends StatelessWidget {
  final String title;
  final String? sub;
  final List items;
  const _Shelf(this.title, this.items, {this.sub});
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SectionTitle(title, sub: sub),
        SizedBox(
          height: 252,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(width: 14),
            itemBuilder: (c, i) => StaggerIn(index: i, child: StoryTile(story: items[i])),
          ),
        ),
      ]);
}

/// Shared list used by genre pages.
class SearchResults extends StatelessWidget {
  final String? genre;
  final String? q;
  const SearchResults({super.key, this.genre, this.q});
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Loader<dynamic>(
      key: ValueKey('$genre-$q'),
      load: () => app.api.get('/discover/search', {'q': q ?? '', 'genre': ?genre}),
      builder: (c, d, _) {
        final items = (d is Map ? d['items'] : d) as List;
        if (items.isEmpty) return Center(child: Text('Không tìm thấy truyện nào', style: TextStyle(color: c.muted)));
        return ListView.builder(padding: const EdgeInsets.all(16), itemCount: items.length, itemBuilder: (c, i) => StoryRow(story: items[i]));
      },
    );
  }
}
