import 'package:flutter/material.dart';

class Brand {
  static const seal = Color(0xFFD9452F);
  static const gold = Color(0xFFC08A2B);
  static const ink = Color(0xFF1D1838);
  static const paper = Color(0xFFFBF8F3);
  static const night = Color(0xFF12101E);
  static const sealGradient = LinearGradient(colors: [Color(0xFFE2553A), Color(0xFFC0392B)]);
  static const goldGradient = LinearGradient(colors: [Color(0xFFD9A441), Color(0xFFB27A1F)]);
}

ThemeData buildTheme(Brightness b) {
  final dark = b == Brightness.dark;
  final scheme = ColorScheme.fromSeed(
    seedColor: Brand.seal,
    brightness: b,
    primary: Brand.seal,
    secondary: Brand.gold,
    surface: dark ? Brand.night : Brand.paper,
  );
  final base = ThemeData(useMaterial3: true, colorScheme: scheme, fontFamily: 'BeVietnamPro', brightness: b);
  return base.copyWith(
    scaffoldBackgroundColor: dark ? Brand.night : Brand.paper,
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      foregroundColor: dark ? Colors.white : Brand.ink,
      titleTextStyle: TextStyle(fontFamily: 'Lora', fontSize: 22, fontWeight: FontWeight.w700, color: dark ? Colors.white : Brand.ink),
    ),
    cardTheme: CardThemeData(
      color: dark ? const Color(0xFF1C1930) : Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: dark ? Colors.white10 : const Color(0xFFEDE6DA))),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: dark ? const Color(0xFF181528) : Colors.white,
      indicatorColor: Brand.seal.withValues(alpha: .14),
      labelTextStyle: WidgetStateProperty.all(const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: dark ? const Color(0xFF1C1930) : Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: dark ? Colors.white12 : const Color(0xFFE6DED0))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: dark ? Colors.white12 : const Color(0xFFE6DED0))),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: Brand.seal,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontFamily: 'BeVietnamPro', fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    chipTheme: base.chipTheme.copyWith(shape: const StadiumBorder(), side: BorderSide.none),
  );
}

extension Ctx on BuildContext {
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
  Color get muted => isDark ? Colors.white60 : const Color(0xFF6E6880);
  Color get fg => isDark ? Colors.white : Brand.ink;
  void toast(String m) => ScaffoldMessenger.of(this)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(m), behavior: SnackBarBehavior.floating, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))));
}
