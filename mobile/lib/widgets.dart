import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'state.dart';
import 'theme.dart';
import 'screens/story.dart';
import 'motion.dart';

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

const _palettes = [
  [Color(0xFF1A1733), Color(0xFF3B2F6B), Color(0xFFF1B84B)], [Color(0xFF0F3B3A), Color(0xFF1F6B5E), Color(0xFFF2D38A)],
  [Color(0xFF3A0F1E), Color(0xFF8F2A3E), Color(0xFFFFD6A5)], [Color(0xFF14213D), Color(0xFF2B3A67), Color(0xFFF4A259)],
  [Color(0xFF2B1D0E), Color(0xFF7A4F25), Color(0xFFF6E7CB)], [Color(0xFF0B2027), Color(0xFF2F6F80), Color(0xFFE4ECD8)],
  [Color(0xFF2D1240), Color(0xFF62307A), Color(0xFFF7B2BD)], [Color(0xFF122A1C), Color(0xFF355F42), Color(0xFFE9F5DB)],
  [Color(0xFF3D0C02), Color(0xFFA8321F), Color(0xFFF9E79F)], [Color(0xFF1B1B3A), Color(0xFF5A2F5A), Color(0xFFFF9FB2)],
  [Color(0xFF082A33), Color(0xFF1E6F93), Color(0xFFFDF6E3)], [Color(0xFF2D1E2F), Color(0xFF9A4E2F), Color(0xFFF2E9E4)],
];

/// Cloth-bound book cover generated from `coverSeed` — same palettes & motifs as the web.
class Cover extends StatelessWidget {
  final Map story;
  final double width;
  final double radius;
  final bool showTitle;
  const Cover({super.key, required this.story, this.width = 120, this.radius = 12, this.showTitle = true});

  @override
  Widget build(BuildContext context) {
    final seed = (story['coverSeed'] ?? story['title'].hashCode) as int;
    final p = _palettes[seed.abs() % _palettes.length];
    final title = story['title'] as String? ?? '';
    final url = story['coverUrl'] as String?;
    final h = width * 1.5;
    final r = BorderRadius.only(topLeft: Radius.circular(radius * .4), bottomLeft: Radius.circular(radius * .4), topRight: Radius.circular(radius), bottomRight: Radius.circular(radius));
    return Container(
      width: width,
      height: h,
      decoration: BoxDecoration(borderRadius: r, boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .35), blurRadius: 18, offset: const Offset(4, 10))]),
      clipBehavior: Clip.antiAlias,
      child: url != null
          ? Image.network(AppScope.read(context).api.asset(url), fit: BoxFit.cover, errorBuilder: (_, _, _) => const SizedBox())
          : Stack(children: [
              Positioned.fill(child: DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [p[1], p[0]])))),
              Positioned.fill(child: CustomPaint(painter: _Motif(seed % 5, p[2], p[0]))),
              // spine
              Positioned(left: 0, top: 0, bottom: 0, width: width * .06, child: const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(colors: [Color(0x66000000), Color(0x22FFFFFF), Colors.transparent])))),
              const Positioned.fill(child: DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, stops: [.35, 1], colors: [Colors.transparent, Color(0xCC000000)])))),
              if (showTitle && width > 80) Positioned.fill(child: Padding(padding: EdgeInsets.all(width * .05), child: DecoratedBox(decoration: BoxDecoration(border: Border.all(color: p[2].withValues(alpha: .35)), borderRadius: BorderRadius.circular(radius * .7))))),
              Positioned(
                right: width * .07,
                top: width * .07,
                child: Container(
                  width: width * .15,
                  height: width * .15,
                  decoration: BoxDecoration(color: Brand.seal, borderRadius: BorderRadius.circular(3), border: Border.all(color: const Color(0x66FBF3E4))),
                  alignment: Alignment.center,
                  child: Text('M', style: TextStyle(color: const Color(0xFFFBF3E4), fontSize: width * .08, fontWeight: FontWeight.w800, fontFamily: display)),
                ),
              ),
              if (showTitle)
                Positioned(
                  left: width * .11,
                  right: width * .11,
                  bottom: width * .12,
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text((story['genre'] ?? '').toString().toUpperCase(),
                        style: TextStyle(color: p[2], fontSize: math.max(6.5, width * .055), letterSpacing: 1.6, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 3),
                    Text(title,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontFamily: display, color: const Color(0xFFFBF3E4), fontSize: math.max(10, width * .12), height: 1.08, fontWeight: FontWeight.w800)),
                  ]),
                ),
            ]),
    );
  }
}

class _Motif extends CustomPainter {
  final int kind;
  final Color c, a;
  _Motif(this.kind, this.c, this.a);
  @override
  void paint(Canvas canvas, Size s) {
    final w = s.width, h = s.height;
    final fill = Paint()..color = c.withValues(alpha: .9);
    final soft = Paint()..color = a.withValues(alpha: .55);
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..color = c.withValues(alpha: .45);
    switch (kind) {
      case 0: // moon over waves
        canvas.drawCircle(Offset(w * .69, h * .29), w * .17, fill);
        final path = Path()..moveTo(0, h * .71);
        for (var i = 0; i < 4; i++) {
          path.relativeQuadraticBezierTo(w * .125, -h * .05, w * .25, 0);
        }
        path
          ..lineTo(w, h)
          ..lineTo(0, h)
          ..close();
        canvas.drawPath(path, soft);
      case 1: // mountains
        canvas.drawPath(Path()..moveTo(-w * .05, h * .77)..lineTo(w * .26, h * .4)..lineTo(w * .46, h * .6)..lineTo(w * .65, h * .37)..lineTo(w * 1.07, h * .79)..close(), soft);
        canvas.drawCircle(Offset(w * .28, h * .23), w * .07, fill);
      case 2: // lotus
        canvas.save();
        canvas.translate(w * .5, h * .5);
        for (final r in [-60, -30, 0, 30, 60]) {
          canvas.save();
          canvas.rotate(r * math.pi / 180);
          canvas.drawPath(Path()..moveTo(0, 0)..cubicTo(-w * .07, -h * .08, -w * .06, -h * .17, 0, -h * .23)..cubicTo(w * .06, -h * .17, w * .07, -h * .08, 0, 0), Paint()..color = c.withValues(alpha: r == 0 ? .9 : .55));
          canvas.restore();
        }
        canvas.restore();
      case 3: // ripples
        for (var i = 0; i < 5; i++) {
          canvas.drawCircle(Offset(w * .5, h * .4), w * (.13 + i * .11), stroke..color = c.withValues(alpha: .55 - i * .1));
        }
        canvas.drawCircle(Offset(w * .5, h * .4), w * .06, fill);
      default: // bamboo
        final b = Paint()
          ..color = c.withValues(alpha: .7)
          ..strokeWidth = w * .025
          ..strokeCap = StrokeCap.round;
        for (final x in [.2, .35, .8]) {
          canvas.drawLine(Offset(w * x, h), Offset(w * x + w * .03, h * .1), b);
        }
    }
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
            Tilt3D(child: Cover(story: story, width: width)),
            const SizedBox(height: 8),
            Text(story['title'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontFamily: display, fontWeight: FontWeight.w800, fontSize: 15, height: 1.2)),
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
                  style: TextStyle(fontFamily: display, fontStyle: FontStyle.italic, fontSize: 28, fontWeight: FontWeight.w900, color: rank! <= 3 ? context.accent : context.muted.withValues(alpha: .5))),
            ),
          Cover(story: story, width: 74, radius: 10, showTitle: false),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(story['title'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontFamily: display, fontWeight: FontWeight.w800, fontSize: 17.5, height: 1.15)),
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
              IntrinsicWidth(
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Text(title, style: const TextStyle(fontFamily: display, fontSize: 24, fontWeight: FontWeight.w800, height: 1.1)),
                  SizedBox(height: 9, child: CustomPaint(painter: BrushPainter(context.accent))),
                ]),
              ),
              if (sub != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text(sub!, style: TextStyle(fontSize: 12.5, color: context.muted, fontStyle: FontStyle.italic))),
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
          if (!s.hasData) return const SkeletonList();
          return widget.builder(c, s.data as T, reload);
        },
      );
}

/// Hand-drawn brush underline.
class BrushPainter extends CustomPainter {
  final Color color;
  BrushPainter(this.color);
  @override
  void paint(Canvas canvas, Size s) {
    final p = Paint()
      ..color = color.withValues(alpha: .85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.4
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(Path()..moveTo(0, s.height * .65)..quadraticBezierTo(s.width * .45, s.height * .15, s.width, s.height * .45), p);
    canvas.drawPath(
        Path()..moveTo(s.width * .12, s.height * .95)..quadraticBezierTo(s.width * .6, s.height * .6, s.width * .9, s.height * .85),
        p
          ..strokeWidth = 1.4
          ..color = color.withValues(alpha: .4));
  }

  @override
  bool shouldRepaint(covariant BrushPainter o) => o.color != color;
}
