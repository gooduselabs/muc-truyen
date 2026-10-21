import 'package:flutter/material.dart';

/// Mực brand: "giấy dó & mực tàu" (light) and "đêm đèn lồng" (dark).
class Brand {
  static const seal = Color(0xFFC23B22); // son — màu triện
  static const lantern = Color(0xFFFF7A4D);
  static const gold = Color(0xFFB5832A);
  static const goldLight = Color(0xFFF1B84B);
  static const ink = Color(0xFF1A1733);
  static const jade = Color(0xFF2E7B6A);
  static const indigo = Color(0xFF2B3A67);
  static const paper = Color(0xFFF4EDE0);
  static const paperCard = Color(0xFFFBF6EC);
  static const paperLine = Color(0xFFDCCFB6);
  static const night = Color(0xFF0D0F1E);
  static const nightCard = Color(0xFF151A30);
  static const nightLine = Color(0xFF262C4A);
  static const sealGradient = LinearGradient(colors: [Color(0xFFD9532F), Color(0xFFA92B17)], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const goldGradient = LinearGradient(colors: [Color(0xFFE2B354), Color(0xFFA9741E)], begin: Alignment.topLeft, end: Alignment.bottomRight);
  static const nightGradient = LinearGradient(colors: [Color(0xFF221D45), Color(0xFF12102A)], begin: Alignment.topLeft, end: Alignment.bottomRight);
}

const display = 'Playfair';

ThemeData buildTheme(Brightness b) {
  final dark = b == Brightness.dark;
  final accent = dark ? Brand.lantern : Brand.seal;
  final scheme = ColorScheme.fromSeed(
    seedColor: Brand.seal,
    brightness: b,
    primary: accent,
    secondary: dark ? Brand.goldLight : Brand.gold,
    surface: dark ? Brand.nightCard : Brand.paperCard,
  );
  final fg = dark ? const Color(0xFFF2E8D5) : Brand.ink;
  final base = ThemeData(useMaterial3: true, colorScheme: scheme, fontFamily: 'BeVietnamPro', brightness: b);
  return base.copyWith(
    scaffoldBackgroundColor: Colors.transparent,
    canvasColor: dark ? Brand.night : Brand.paper,
    textTheme: base.textTheme.apply(bodyColor: fg, displayColor: fg),
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: InkPageTransitionsBuilder(),
      TargetPlatform.iOS: InkPageTransitionsBuilder(),
    }),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      foregroundColor: fg,
      titleTextStyle: TextStyle(fontFamily: display, fontSize: 24, fontWeight: FontWeight.w800, color: fg),
    ),
    cardTheme: CardThemeData(
      color: dark ? Brand.nightCard : Brand.paperCard,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: dark ? Brand.nightLine : Brand.paperLine)),
    ),
    bottomSheetTheme: BottomSheetThemeData(backgroundColor: dark ? Brand.nightCard : Brand.paperCard, surfaceTintColor: Colors.transparent),
    dialogTheme: DialogThemeData(backgroundColor: dark ? Brand.nightCard : Brand.paperCard, surfaceTintColor: Colors.transparent),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: (dark ? Brand.nightCard : Brand.paperCard).withValues(alpha: .96),
      surfaceTintColor: Colors.transparent,
      indicatorColor: accent.withValues(alpha: .14),
      labelTextStyle: WidgetStateProperty.all(TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: fg)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: dark ? Brand.nightCard : Brand.paperCard,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: dark ? Brand.nightLine : Brand.paperLine)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: dark ? Brand.nightLine : Brand.paperLine)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: accent,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(99)),
        textStyle: const TextStyle(fontFamily: 'BeVietnamPro', fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(
      shape: StadiumBorder(side: BorderSide(color: dark ? Brand.nightLine : Brand.paperLine)),
      backgroundColor: dark ? Brand.nightCard : Brand.paperCard,
    ),
  );
}

/// Page transition: fade + slight rise + un-blur, like ink settling on paper.
class InkPageTransitionsBuilder extends PageTransitionsBuilder {
  const InkPageTransitionsBuilder();
  @override
  Widget buildTransitions<T>(PageRoute<T> route, BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation, Widget child) {
    final a = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic, reverseCurve: Curves.easeInCubic);
    return FadeTransition(
      opacity: a,
      child: SlideTransition(
        position: Tween(begin: const Offset(0, .045), end: Offset.zero).animate(a),
        child: FadeTransition(opacity: Tween(begin: 1.0, end: .6).animate(secondaryAnimation), child: child),
      ),
    );
  }
}

/// Paper (light) or night-sky (dark) textured background behind every screen.
class PaperBackground extends StatelessWidget {
  final Widget child;
  const PaperBackground({super.key, required this.child});
  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 500),
      decoration: BoxDecoration(
        color: dark ? Brand.night : Brand.paper,
        image: DecorationImage(image: AssetImage(dark ? 'assets/brand/night.png' : 'assets/brand/paper.png'), repeat: ImageRepeat.repeat, opacity: dark ? .9 : 1),
      ),
      child: Stack(children: [
        Positioned(
          top: -120,
          right: -100,
          child: IgnorePointer(
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(shape: BoxShape.circle, gradient: RadialGradient(colors: [(dark ? Brand.lantern : Brand.seal).withValues(alpha: dark ? .22 : .10), Colors.transparent])),
            ),
          ),
        ),
        if (dark) const Positioned.fill(child: IgnorePointer(child: CustomPaint(painter: _Stars()))),
        Positioned.fill(child: child),
      ]),
    );
  }
}

class _Stars extends CustomPainter {
  const _Stars();
  @override
  void paint(Canvas c, Size s) {
    final p = Paint()..color = Colors.white.withValues(alpha: .5);
    for (var i = 0; i < 40; i++) {
      final x = ((i * 97) % 389) / 389 * s.width, y = ((i * 53) % 211) / 211 * s.height * .45;
      c.drawCircle(Offset(x, y), (i % 3 == 0) ? 1.1 : .7, p);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter o) => false;
}

extension Ctx on BuildContext {
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
  Color get muted => isDark ? const Color(0xFFA39A87) : const Color(0xFF6F6656);
  Color get fg => isDark ? const Color(0xFFF2E8D5) : Brand.ink;
  Color get accent => isDark ? Brand.lantern : Brand.seal;
  Color get line => isDark ? Brand.nightLine : Brand.paperLine;
  Color get card => isDark ? Brand.nightCard : Brand.paperCard;
  bool get reduceMotion => MediaQuery.maybeOf(this)?.disableAnimations ?? false;
  void toast(String m) => ScaffoldMessenger.of(this)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(m), behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))));
}
