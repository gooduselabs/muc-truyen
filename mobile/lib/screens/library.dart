import 'package:flutter/material.dart';
import '../state.dart';
import '../theme.dart';
import '../widgets.dart';
import 'account.dart';
import 'reader.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});
  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  int tab = 0;
  int bump = 0;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return SafeArea(
      bottom: false,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 12, 8),
          child: Row(children: [
            const Expanded(child: Text('Tủ sách', style: TextStyle(fontFamily: 'Lora', fontSize: 28, fontWeight: FontWeight.w700))),
            IconButton(onPressed: () => setState(() => bump++), icon: const Icon(Icons.refresh_rounded)),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 0, label: Text('Đang theo dõi'), icon: Icon(Icons.bookmark_rounded)),
              ButtonSegment(value: 1, label: Text('Đã tải'), icon: Icon(Icons.download_done_rounded)),
            ],
            selected: {tab},
            showSelectedIcon: false,
            onSelectionChanged: (s) => setState(() => tab = s.first),
          ),
        ),
        const SizedBox(height: 8),
        Expanded(child: tab == 0 ? _online(app) : _offline(app)),
      ]),
    );
  }

  Widget _online(AppState app) {
    if (!app.loggedIn) {
      return _Empty(
        icon: Icons.lock_outline_rounded,
        title: 'Đăng nhập để đồng bộ tủ sách',
        body: 'Tủ sách và tiến độ đọc được lưu trên máy chủ, đọc tiếp được trên cả web lẫn điện thoại.',
        action: FilledButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())), child: const Text('Đăng nhập')),
      );
    }
    return Loader<dynamic>(
      key: ValueKey('lib-$bump'),
      load: () => app.api.get('/me/library'),
      builder: (c, d, reload) {
        final items = d as List;
        if (items.isEmpty) return const _Empty(icon: Icons.bookmark_add_outlined, title: 'Tủ sách trống', body: 'Nhấn “Thêm vào tủ” ở trang truyện để theo dõi chương mới.');
        return RefreshIndicator(
          onRefresh: reload,
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            itemCount: items.length,
            itemBuilder: (c, i) {
              final s = items[i];
              final p = s['progress'];
              final total = s['_count']?['chapters'] ?? 0;
              return StoryRow(
                story: s,
                extra: p == null ? 'Chưa đọc' : 'Đang ở chương ${p['chapterNo']}/$total',
                trailing: p == null
                    ? null
                    : IconButton.filledTonal(
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ReaderScreen(slug: s['slug'], number: p['chapterNo']))),
                        icon: const Icon(Icons.play_arrow_rounded, color: Brand.seal),
                      ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _offline(AppState app) {
    final off = app.offline;
    final stories = off?.stories() ?? [];
    if (stories.isEmpty) {
      return const _Empty(icon: Icons.cloud_download_outlined, title: 'Chưa tải truyện nào', body: 'Nhấn biểu tượng tải xuống ở trang truyện để đọc khi không có mạng.');
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: stories.length,
      itemBuilder: (c, i) {
        final s = stories[i];
        final chs = off!.chapterNumbers(s['slug']);
        return StoryRow(
          story: s,
          extra: '${chs.length} chương ngoại tuyến',
          trailing: PopupMenuButton<String>(
            onSelected: (v) async {
              if (v == 'read' && chs.isNotEmpty) {
                Navigator.push(context, MaterialPageRoute(builder: (_) => ReaderScreen(slug: s['slug'], number: chs.first)));
              } else if (v == 'del') {
                await off.remove(s['slug']);
                setState(() {});
              }
            },
            itemBuilder: (_) => const [
              PopupMenuItem(value: 'read', child: Text('Đọc ngoại tuyến')),
              PopupMenuItem(value: 'del', child: Text('Xoá bản tải')),
            ],
          ),
        );
      },
    );
  }
}

class _Empty extends StatelessWidget {
  final IconData icon;
  final String title, body;
  final Widget? action;
  const _Empty({required this.icon, required this.title, required this.body, this.action});
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(36),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(shape: BoxShape.circle, color: Brand.seal.withValues(alpha: .08)),
              child: Icon(icon, size: 40, color: Brand.seal),
            ),
            const SizedBox(height: 16),
            Text(title, textAlign: TextAlign.center, style: const TextStyle(fontFamily: 'Lora', fontSize: 19, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text(body, textAlign: TextAlign.center, style: TextStyle(color: context.muted, height: 1.5)),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ]),
        ),
      );
}
