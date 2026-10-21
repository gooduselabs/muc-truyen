import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'theme.dart';

/// Fade + rise in, delayed by [index] — use in lists/grids for staggered reveals.
class StaggerIn extends StatelessWidget {
  final int index;
  final Widget child;
  final double dy;
  const StaggerIn({super.key, required this.index, required this.child, this.dy = 24});
  @override
  Widget build(BuildContext context) {
    if (context.reduceMotion) return child;
    final delay = (index.clamp(0, 10)) * 70;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 520 + delay),
      curve: Interval(delay / (520 + delay), 1, curve: Curves.easeOutCubic),
      builder: (_, t, c) => Opacity(opacity: t, child: Transform.translate(offset: Offset(0, (1 - t) * dy), child: c)),
      child: child,
    );
  }
}

/// 3D tilt that follows the finger (book covers). Springs back on release.
class Tilt3D extends StatefulWidget {
  final Widget child;
  final double max;
  const Tilt3D({super.key, required this.child, this.max = .22});
  @override
  State<Tilt3D> createState() => _Tilt3DState();
}

class _Tilt3DState extends State<Tilt3D> with SingleTickerProviderStateMixin {
  Offset tilt = Offset.zero;
  late final AnimationController back = AnimationController(vsync: this, duration: const Duration(milliseconds: 450));
  Offset from = Offset.zero;
  @override
  void initState() {
    super.initState();
    back.addListener(() => setState(() => tilt = Offset.lerp(from, Offset.zero, Curves.elasticOut.transform(back.value))!));
  }

  @override
  void dispose() {
    back.dispose();
    super.dispose();
  }

  void _move(Offset local, Size size) {
    back.stop();
    setState(() => tilt = Offset((local.dx / size.width - .5) * 2, (local.dy / size.height - .5) * 2));
  }

  void _release() {
    from = tilt;
    back.forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
    if (context.reduceMotion) return widget.child;
    return LayoutBuilder(
      builder: (context, c) => Listener(
        onPointerDown: (e) => _move(e.localPosition, c.biggest),
        onPointerMove: (e) => _move(e.localPosition, c.biggest),
        onPointerUp: (_) => _release(),
        onPointerCancel: (_) => _release(),
        child: Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..setEntry(3, 2, .0012)
            ..rotateX(-tilt.dy * widget.max)
            ..rotateY(tilt.dx * widget.max),
          child: Stack(children: [
            widget.child,
            if (tilt != Offset.zero)
              Positioned.fill(
                child: IgnorePointer(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: LinearGradient(
                        begin: Alignment(-1 + tilt.dx, -1 + tilt.dy),
                        end: Alignment(1 + tilt.dx, 1 + tilt.dy),
                        colors: [Colors.white.withValues(alpha: .0), Colors.white.withValues(alpha: .22), Colors.white.withValues(alpha: .0)],
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

/// Particle burst (hearts or coins). Trigger by changing [trigger].
class Burst extends StatefulWidget {
  final int trigger;
  final bool coins;
  final Widget child;
  const Burst({super.key, required this.trigger, required this.child, this.coins = false});
  @override
  State<Burst> createState() => _BurstState();
}

class _BurstState extends State<Burst> with SingleTickerProviderStateMixin {
  late final AnimationController c = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
  @override
  void didUpdateWidget(covariant Burst old) {
    super.didUpdateWidget(old);
    if (old.trigger != widget.trigger && !context.reduceMotion) c.forward(from: 0);
  }

  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Stack(clipBehavior: Clip.none, alignment: Alignment.center, children: [
        widget.child,
        AnimatedBuilder(
          animation: c,
          builder: (context, _) {
            if (!c.isAnimating) return const SizedBox.shrink();
            final t = Curves.easeOut.transform(c.value);
            return IgnorePointer(
              child: Stack(clipBehavior: Clip.none, alignment: Alignment.center, children: [
                Container(
                  width: 40 + 60 * t,
                  height: 40 + 60 * t,
                  decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: (widget.coins ? Brand.goldLight : context.accent).withValues(alpha: 1 - t), width: 2)),
                ),
                for (var i = 0; i < 12; i++)
                  Transform.translate(
                    offset: Offset(math.cos(i / 12 * math.pi * 2) * (20 + 44 * t), math.sin(i / 12 * math.pi * 2) * (20 + 44 * t) - 10 * t),
                    child: Opacity(
                      opacity: (1 - t).clamp(0, 1),
                      child: Transform.scale(
                        scale: .5 + t,
                        child: widget.coins
                            ? Container(width: 9, height: 9, decoration: const BoxDecoration(shape: BoxShape.circle, gradient: Brand.goldGradient))
                            : Icon(Icons.favorite, size: 11, color: context.accent),
                      ),
                    ),
                  ),
              ]),
            );
          },
        ),
      ]);
}

/// Full-screen coin shower after an unlock.
Future<void> showCoinCelebration(BuildContext context, String label) async {
  if (context.reduceMotion) return;
  final overlay = Overlay.of(context);
  late OverlayEntry e;
  e = OverlayEntry(builder: (_) => _CoinShower(label: label, onDone: () => e.remove()));
  overlay.insert(e);
}

class _CoinShower extends StatefulWidget {
  final String label;
  final VoidCallback onDone;
  const _CoinShower({required this.label, required this.onDone});
  @override
  State<_CoinShower> createState() => _CoinShowerState();
}

class _CoinShowerState extends State<_CoinShower> with SingleTickerProviderStateMixin {
  late final AnimationController c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800))
    ..forward().whenComplete(widget.onDone);
  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => IgnorePointer(
        child: AnimatedBuilder(
          animation: c,
          builder: (context, _) {
            final t = c.value;
            final size = MediaQuery.of(context).size;
            final fade = t < .8 ? 1.0 : (1 - (t - .8) / .2);
            return Opacity(
              opacity: fade.clamp(0, 1),
              child: Stack(children: [
                Positioned.fill(child: DecoratedBox(decoration: BoxDecoration(gradient: RadialGradient(colors: [Brand.goldLight.withValues(alpha: .3 * fade), Colors.transparent])))),
                for (var i = 0; i < 22; i++)
                  Builder(builder: (_) {
                    final a = i / 22 * math.pi * 2;
                    final d = (120 + (i % 4) * 40) * Curves.easeOutCubic.transform(t);
                    return Positioned(
                      left: size.width / 2 + math.cos(a) * d - 14,
                      top: size.height / 2 + math.sin(a) * d - 14 + 180 * t * t,
                      child: Transform(
                        alignment: Alignment.center,
                        transform: Matrix4.identity()..rotateY(t * 12 + i),
                        child: Container(
                          width: 28,
                          height: 28,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(shape: BoxShape.circle, gradient: Brand.goldGradient, border: Border.all(color: const Color(0xFF8A5A12), width: 2)),
                          child: const Text('xu', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Color(0xFF6B420A))),
                        ),
                      ),
                    );
                  }),
                Center(
                  child: Transform.scale(
                    scale: Curves.elasticOut.transform((t * 2).clamp(0, 1)),
                    child: Material(
                      color: Colors.transparent,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 18),
                        decoration: BoxDecoration(color: context.card, borderRadius: BorderRadius.circular(24), border: Border.all(color: Brand.goldLight.withValues(alpha: .6)), boxShadow: const [BoxShadow(blurRadius: 30, color: Colors.black26)]),
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.lock_open_rounded, color: Brand.gold, size: 34),
                          const SizedBox(height: 6),
                          Text(widget.label, style: TextStyle(fontFamily: display, fontWeight: FontWeight.w800, fontSize: 19, color: context.fg)),
                        ]),
                      ),
                    ),
                  ),
                ),
              ]),
            );
          },
        ),
      );
}

/// Shimmering placeholder block.
class Shimmer extends StatefulWidget {
  final double width, height, radius;
  const Shimmer({super.key, this.width = double.infinity, required this.height, this.radius = 14});
  @override
  State<Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1300))..repeat();
  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final base = context.isDark ? const Color(0xFF1B2140) : const Color(0xFFEAE0CC);
    final hi = context.isDark ? const Color(0xFF283058) : const Color(0xFFF8F2E6);
    return AnimatedBuilder(
      animation: c,
      builder: (_, _) => Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(widget.radius),
          gradient: LinearGradient(begin: Alignment(-1.5 + c.value * 3, 0), end: Alignment(-.5 + c.value * 3, 0), colors: [base, hi, base]),
        ),
      ),
    );
  }
}

/// Skeleton for a home/list screen while loading.
class SkeletonList extends StatelessWidget {
  const SkeletonList({super.key});
  @override
  Widget build(BuildContext context) => ListView(padding: const EdgeInsets.all(20), physics: const NeverScrollableScrollPhysics(), children: [
        const Shimmer(height: 210, radius: 26),
        const SizedBox(height: 26),
        const Shimmer(height: 22, width: 180),
        const SizedBox(height: 14),
        Row(children: [for (var i = 0; i < 3; i++) const Expanded(child: Padding(padding: EdgeInsets.only(right: 12), child: Shimmer(height: 160)))]),
        const SizedBox(height: 26),
        for (var i = 0; i < 3; i++)
          const Padding(
            padding: EdgeInsets.only(bottom: 14),
            child: Row(children: [Shimmer(width: 70, height: 100), SizedBox(width: 14), Expanded(child: Column(children: [Shimmer(height: 18), SizedBox(height: 10), Shimmer(height: 12), SizedBox(height: 8), Shimmer(height: 12)]))]),
          ),
      ]);
}

/// Page-turn: the new chapter swings in around the spine.
class PageTurnSwitcher extends StatelessWidget {
  final Widget child;
  final int direction;
  const PageTurnSwitcher({super.key, required this.child, this.direction = 1});
  @override
  Widget build(BuildContext context) {
    if (context.reduceMotion) return child;
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 650),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      layoutBuilder: (cur, prev) => Stack(alignment: Alignment.topCenter, children: [...prev, ?cur]),
      transitionBuilder: (child, anim) => AnimatedBuilder(
        animation: anim,
        child: child,
        builder: (context, c) {
          final incoming = child.key == this.child.key;
          final t = 1 - anim.value;
          final angle = (incoming ? 1 : -1) * direction * t * math.pi / 2.4;
          return Transform(
            alignment: direction > 0 ? Alignment.centerLeft : Alignment.centerRight,
            transform: Matrix4.identity()
              ..setEntry(3, 2, .0011)
              ..rotateY(angle),
            child: Stack(children: [
              Opacity(opacity: anim.value.clamp(0, 1), child: c),
              Positioned.fill(child: IgnorePointer(child: ColoredBox(color: Colors.black.withValues(alpha: .25 * t)))),
            ]),
          );
        },
      ),
      child: child,
    );
  }
}
