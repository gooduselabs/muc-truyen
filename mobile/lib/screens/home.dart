import 'package:flutter/material.dart';
import '../main.dart';
import '../state.dart';
import '../theme.dart';
import '../widgets.dart';
import 'reader.dart';
import 'account.dart';

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
                  const Logo(),
                  const Spacer(),
                  if (app.loggedIn) CoinBadge(app.coins),
                  IconButton(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                    icon: Badge(isLabelVisible: app.unread > 0, label: Text('${app.unread}'), child: const Icon(Icons.notifications_none_rounded)),
                  ),
                ]),
              ),
              _Hero(stories: (home['featured'] as List)),
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

class _Hero extends StatefulWidget {
  final List stories;
  const _Hero({required this.stories});
  @override
  State<_Hero> createState() => _HeroState();
}

class _HeroState extends State<_Hero> {
  final pc = PageController(viewportFraction: .9);
  int page = 0;
  @override
  Widget build(BuildContext context) => Column(children: [
        SizedBox(
          height: 230,
          child: PageView.builder(
            controller: pc,
            itemCount: widget.stories.length,
            onPageChanged: (p) => setState(() => page = p),
            itemBuilder: (c, i) {
              final s = widget.stories[i];
              final seed = (s['coverSeed'] ?? 1) as int;
              final hue = ((seed * 47) % 360).toDouble();
              return GestureDetector(
                onTap: () => openStory(context, s),
                child: AnimatedScale(
                  duration: const Duration(milliseconds: 300),
                  scale: i == page ? 1 : .94,
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(26),
                      gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [
                        HSLColor.fromAHSL(1, hue, .45, .30).toColor(),
                        HSLColor.fromAHSL(1, (hue + 50) % 360, .45, .12).toColor(),
                      ]),
                      boxShadow: [BoxShadow(color: HSLColor.fromAHSL(.4, hue, .5, .3).toColor(), blurRadius: 20, offset: const Offset(0, 10))],
                    ),
                    child: Row(children: [
                      Cover(story: s, width: 106),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Pill('NỔI BẬT', color: Color(0xFFFFC870), icon: Icons.auto_awesome),
                          const SizedBox(height: 10),
                          Text(s['title'], maxLines: 2, style: const TextStyle(fontFamily: 'Lora', color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700, height: 1.2)),
                          const SizedBox(height: 6),
                          Text(s['synopsis'] ?? '', maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white70, fontSize: 12.5, height: 1.45)),
                          const SizedBox(height: 10),
                          Text('${s['author']['name']} · ${s['genre']}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
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
          for (var i = 0; i < widget.stories.length; i++)
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.all(3),
              width: i == page ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(color: i == page ? Brand.seal : context.muted.withValues(alpha: .3), borderRadius: BorderRadius.circular(9)),
            ),
        ]),
      ]);
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
          height: 236,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(width: 14),
            itemBuilder: (c, i) => StoryTile(story: items[i]),
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
