import 'package:flutter/material.dart';
import 'state.dart';
import 'theme.dart';
import 'screens/home.dart';
import 'screens/search.dart';
import 'screens/library.dart';
import 'screens/account.dart';

void main() {
  // Never block before runApp: prefs + session are loaded after the first frame.
  final state = AppState();
  runApp(MucApp(state: state));
  state.init();
}

class MucApp extends StatelessWidget {
  final AppState state;
  final Widget? home;
  const MucApp({super.key, required this.state, this.home});
  @override
  Widget build(BuildContext context) => AppScope(
        state: state,
        child: ListenableBuilder(
          listenable: state,
          builder: (context, _) => MaterialApp(
            title: 'Mực',
            debugShowCheckedModeBanner: false,
            theme: buildTheme(Brightness.light),
            darkTheme: buildTheme(Brightness.dark),
            themeMode: state.themeMode,
            themeAnimationDuration: const Duration(milliseconds: 550),
            themeAnimationCurve: Curves.easeInOutCubic,
            builder: (context, child) => PaperBackground(child: child ?? const SizedBox()),
            home: home ?? (state.ready ? const Shell() : const Splash()),
          ),
        ),
      );
}

class Splash extends StatelessWidget {
  const Splash({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
        body: Center(
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: .6, end: 1),
            duration: const Duration(milliseconds: 700),
            curve: Curves.elasticOut,
            builder: (_, v, c) => Transform.scale(scale: v, child: c),
            child: const Logo(size: 64),
          ),
        ),
      );
}

/// Seal logo (cinnabar stamp + ink drop + lantern dot) with the Playfair wordmark.
class Logo extends StatelessWidget {
  final double size;
  final bool tagline;
  const Logo({super.key, this.size = 30, this.tagline = false});
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(
          decoration: BoxDecoration(boxShadow: [BoxShadow(color: Brand.seal.withValues(alpha: .3), blurRadius: 12, offset: const Offset(0, 5))]),
          child: Image.asset('assets/brand/logo.png', width: size, height: size),
        ),
        SizedBox(width: size * .3),
        Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text.rich(TextSpan(children: [
            TextSpan(text: 'Mực', style: TextStyle(color: context.fg)),
            TextSpan(text: '.', style: TextStyle(color: context.accent)),
          ]), style: TextStyle(fontFamily: display, fontSize: size * .82, fontWeight: FontWeight.w900, height: 1)),
          if (tagline) Text('TRUYỆN VIẾT BẰNG TÂM', style: TextStyle(fontSize: size * .22, letterSpacing: 2, fontWeight: FontWeight.w700, color: context.muted)),
        ]),
      ]);
}

class Shell extends StatefulWidget {
  final int initial;
  const Shell({super.key, this.initial = 0});
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  late int i = widget.initial;
  @override
  Widget build(BuildContext context) {
    final s = AppScope.of(context);
    return Scaffold(
      body: IndexedStack(index: i, children: const [HomeScreen(), SearchScreen(), LibraryScreen(), AccountScreen()]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: i,
        height: 68,
        onDestinationSelected: (v) => setState(() => i = v),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.auto_stories_outlined), selectedIcon: Icon(Icons.auto_stories), label: 'Trang chủ'),
          const NavigationDestination(icon: Icon(Icons.explore_outlined), selectedIcon: Icon(Icons.explore), label: 'Khám phá'),
          const NavigationDestination(icon: Icon(Icons.collections_bookmark_outlined), selectedIcon: Icon(Icons.collections_bookmark), label: 'Tủ sách'),
          NavigationDestination(
            icon: Badge(isLabelVisible: s.unread > 0, label: Text('${s.unread}'), child: const Icon(Icons.person_outline)),
            selectedIcon: const Icon(Icons.person),
            label: 'Tài khoản',
          ),
        ],
      ),
    );
  }
}
