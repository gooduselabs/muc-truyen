import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'state.dart';
import 'theme.dart';
import 'screens/story.dart';

String fmtNum(num n) => n >= 1000000
    ? '${(n / 1000000).toStringAsFixed(1)}M'
    : n >= 1000
        ? '${(n / 1000).toStringAsFixed(1)}K'
        : '$n';

String statusLabel(String? s) => switch (s) { 'COMPLETED' => 'Hoàn thành', 'HIATUS' => 'Tạm dừng', _ => 'Đang ra' };

String ago(String? iso) {
  if (iso == null) return '';
  final d = DateTime.now().difference(DateTime.parse(iso).toLocal());
  if (d.inMinutes < 1) return 'vừa xong';
  if (d.inHours < 1) return '${d.inMinutes} phút trước';
  if (d.inDays < 1) return '${d.inHours} giờ trước';
  if (d.inDays < 30) return '${d.inDays} ngày trước';
  return '${(d.inDays / 30).floor()} tháng trước';
}

/// Deterministic gradient cover generated from `coverSeed` (same idea as the web cover).
class Cover extends StatelessWidget {
  final Map story;
  final double width;
  final double radius;
  final bool showTitle;
  const Cover({super.key, required this.story, this.width = 120, this.radius = 14, this.showTitle = true});

  @override
  Widget build(BuildContext context) {
    final seed = (story['coverSeed'] ?? story['title'].hashCode) as int;
    final h1 = (seed * 47) % 360;
    final h2 = (h1 + 40 + seed % 60) % 360;
    final c1 = HSLColor.fromAHSL(1, h1.toDouble(), .55, .42).toColor();
    final c2 = HSLColor.fromAHSL(1, h2.toDouble(), .5, .18).toColor();
    final title = story['title'] as String? ?? '';
    final url = story['coverUrl'] as String?;
    final h = width * 1.45;
    return Container(
      width: width,
      height: h,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        boxShadow: [BoxShadow(color: c2.withValues(alpha: .35), blurRadius: 16, offset: const Offset(0, 8))],
      ),
      clipBehavior: Clip.antiAlias,
      child: url != null
          ? Image.network(AppScope.read(context).api.asset(url), fit: BoxFit.cover, errorBuilder: (_, _, _) => const SizedBox())
          : Stack(children: [
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [c1, c2])),
                ),
              ),
              Positioned.fill(child: CustomPaint(painter: _Rings(seed))),
              Positioned(
                left: -width * .06,
                top: -width * .12,
                child: Text(title.isEmpty ? '' : title.characters.first,
                    style: TextStyle(fontFamily: 'Lora', fontSize: width * .95, color: Colors.white.withValues(alpha: .1), fontWeight: FontWeight.w700)),
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: width * .14,
                  height: width * .14,
                  decoration: BoxDecoration(color: Brand.seal, borderRadius: BorderRadius.circular(4)),
                  alignment: Alignment.center,
                  child: Text('M', style: TextStyle(color: Colors.white, fontSize: width * .08, fontWeight: FontWeight.w700, fontFamily: 'Lora')),
                ),
              ),
              if (showTitle)
                Positioned(
                  left: width * .09,
                  right: width * .09,
                  bottom: width * .1,
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text((story['genre'] ?? '').toString().toUpperCase(),
                        style: TextStyle(color: Colors.white70, fontSize: math.max(7, width * .062), letterSpacing: 1.4, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 3),
                    Text(title,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontFamily: 'Lora', color: Colors.white, fontSize: math.max(10, width * .11), height: 1.15, fontWeight: FontWeight.w700)),
                  ]),
                ),
            ]),
    );
  }
}

class _Rings extends CustomPainter {
  final int seed;
  _Rings(this.seed);
  @override
  void paint(Canvas canvas, Size s) {
    final p = Paint()
      ..style = PaintingStyle.stroke
      ..color = Colors.white.withValues(alpha: .09)
      ..strokeWidth = 1;
    final c = Offset(s.width * (.3 + (seed % 5) / 10), s.height * (.25 + (seed % 3) / 10));
    for (var i = 1; i < 6; i++) {
      canvas.drawCircle(c, s.width * .16 * i, p);
    }
    final g = Paint()
      ..shader = const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Color(0xAA000000)])
          .createShader(Rect.fromLTWH(0, s.height * .4, s.width, s.height * .6));
    canvas.drawRect(Rect.fromLTWH(0, s.height * .4, s.width, s.height * .6), g);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

void openStory(BuildContext context, Map s) =>
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => StoryScreen(slug: s['slug'], preview: s)));

class StoryTile extends StatelessWidget {
  final Map story;
  final double width;
  final String? subtitle;
  const StoryTile({super.key, required this.story, this.width = 118, this.subtitle});
  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: () => openStory(context, story),
        child: SizedBox(
          width: width,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Hero(tag: 'cover-${story['slug']}-$hashCode', child: Cover(story: story, width: width)),
            const SizedBox(height: 8),
            Text(story['title'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5, height: 1.25)),
            const SizedBox(height: 2),
            Text(subtitle ?? story['author']?['name'] ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: context.muted)),
          ]),
        ),
      );
}

class StoryRow extends StatelessWidget {
  final Map story;
  final Widget? trailing;
  final String? extra;
  final int? rank;
  const StoryRow({super.key, required this.story, this.trailing, this.extra, this.rank});
  @override
  Widget build(BuildContext context) {
    final c = story['_count'] ?? {};
    return InkWell(
      onTap: () => openStory(context, story),
      borderRadius: BorderRadius.circular(18),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (rank != null)
            SizedBox(
              width: 34,
              child: Text('$rank',
                  style: TextStyle(fontFamily: 'Lora', fontSize: 26, fontWeight: FontWeight.w700, color: rank! <= 3 ? Brand.seal : context.muted.withValues(alpha: .5))),
            ),
          Cover(story: story, width: 74, radius: 10, showTitle: false),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(story['title'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontFamily: 'Lora', fontWeight: FontWeight.w700, fontSize: 16.5, height: 1.2)),
              const SizedBox(height: 4),
              Text('${story['author']?['name'] ?? ''} · ${story['genre'] ?? ''}', style: TextStyle(fontSize: 12.5, color: context.muted)),
              const SizedBox(height: 6),
              Text(story['synopsis'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12.5, height: 1.4, color: context.fg.withValues(alpha: .75))),
              const SizedBox(height: 6),
              Row(children: [
                _Meta(Icons.visibility_outlined, fmtNum(story['views'] ?? 0)),
                _Meta(Icons.menu_book_outlined, '${c['chapters'] ?? 0} ch'),
                _Meta(Icons.favorite_border, '${c['likes'] ?? 0}'),
                if (extra != null) Flexible(child: Text(extra!, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11.5, color: Brand.seal, fontWeight: FontWeight.w600))),
              ]),
            ]),
          ),
          ?trailing,
        ]),
      ),
    );
  }
}

class _Meta extends StatelessWidget {
  final IconData i;
  final String t;
  const _Meta(this.i, this.t);
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(right: 12),
        child: Row(children: [Icon(i, size: 13, color: context.muted), const SizedBox(width: 3), Text(t, style: TextStyle(fontSize: 11.5, color: context.muted))]),
      );
}

class SectionTitle extends StatelessWidget {
  final String title;
  final String? sub;
  final VoidCallback? onMore;
  const SectionTitle(this.title, {super.key, this.sub, this.onMore});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 26, 12, 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: const TextStyle(fontFamily: 'Lora', fontSize: 21, fontWeight: FontWeight.w700)),
              if (sub != null) Text(sub!, style: TextStyle(fontSize: 12.5, color: context.muted)),
            ]),
          ),
          if (onMore != null) TextButton(onPressed: onMore, child: const Text('Xem thêm')),
        ]),
      );
}

class Pill extends StatelessWidget {
  final String text;
  final Color? color;
  final IconData? icon;
  const Pill(this.text, {super.key, this.color, this.icon});
  @override
  Widget build(BuildContext context) {
    final c = color ?? context.muted;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: c.withValues(alpha: .12), borderRadius: BorderRadius.circular(99)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 12, color: c), const SizedBox(width: 4)],
        Text(text, style: TextStyle(fontSize: 11.5, color: c, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}

class Avatar extends StatelessWidget {
  final Map? user;
  final double size;
  const Avatar(this.user, {super.key, this.size = 36});
  @override
  Widget build(BuildContext context) {
    final n = (user?['name'] ?? '?') as String;
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(shape: BoxShape.circle, gradient: LinearGradient(colors: [Color(0xFFE2553A), Color(0xFFC08A2B)])),
      alignment: Alignment.center,
      child: Text(n.isEmpty ? '?' : n.characters.first.toUpperCase(), style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: size * .42)),
    );
  }
}

class Loading extends StatelessWidget {
  const Loading({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: Brand.seal, strokeWidth: 2.4)));
}

class ErrorView extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;
  const ErrorView(this.error, this.onRetry, {super.key});
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.cloud_off_rounded, size: 52, color: context.muted),
            const SizedBox(height: 12),
            const Text('Không kết nối được máy chủ', style: TextStyle(fontFamily: 'Lora', fontSize: 19, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text('Kiểm tra mạng hoặc địa chỉ máy chủ trong Cài đặt.\nTruyện đã tải vẫn đọc được trong Tủ sách.',
                textAlign: TextAlign.center, style: TextStyle(color: context.muted, height: 1.5)),
            const SizedBox(height: 16),
            FilledButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh), label: const Text('Thử lại')),
          ]),
        ),
      );
}

class CoinBadge extends StatelessWidget {
  final int coins;
  const CoinBadge(this.coins, {super.key});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: Brand.gold.withValues(alpha: .15), borderRadius: BorderRadius.circular(99)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.toll_rounded, size: 15, color: Brand.gold),
          const SizedBox(width: 4),
          Text('$coins', style: const TextStyle(fontWeight: FontWeight.w700, color: Brand.gold, fontSize: 13)),
        ]),
      );
}

/// Simple async loader with retry.
class Loader<T> extends StatefulWidget {
  final Future<T> Function() load;
  final Widget Function(BuildContext, T, Future<void> Function() reload) builder;
  const Loader({super.key, required this.load, required this.builder});
  @override
  State<Loader<T>> createState() => _LoaderState<T>();
}

class _LoaderState<T> extends State<Loader<T>> {
  late Future<T> f = widget.load();
  Future<void> reload() async {
    final nf = widget.load();
    setState(() => f = nf);
    await nf.catchError((_) => null as dynamic);
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<T>(
        future: f,
        builder: (c, s) {
          if (s.hasError) return ErrorView(s.error!, reload);
          if (!s.hasData) return const Loading();
          return widget.builder(c, s.data as T, reload);
        },
      );
}
