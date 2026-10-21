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
            home: home ?? (state.ready ? const Shell() : const Splash()),
          ),
        ),
      );
}

class Splash extends StatelessWidget {
  const Splash({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Logo(size: 64)));
}

class Logo extends StatelessWidget {
  final double size;
  const Logo({super.key, this.size = 30});
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            gradient: Brand.sealGradient,
            borderRadius: BorderRadius.circular(size * .28),
            boxShadow: [BoxShadow(color: Brand.seal.withValues(alpha: .35), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          alignment: Alignment.center,
          child: Text('M', style: TextStyle(fontFamily: 'Lora', color: Colors.white, fontWeight: FontWeight.w700, fontSize: size * .55)),
        ),
        SizedBox(width: size * .3),
        Text('Mực', style: TextStyle(fontFamily: 'Lora', fontSize: size * .8, fontWeight: FontWeight.w700, color: context.fg)),
        Text('.', style: TextStyle(fontFamily: 'Lora', fontSize: size * .8, fontWeight: FontWeight.w700, color: Brand.seal)),
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
          const NavigationDestination(icon: Icon(Icons.auto_stories_outlined), selectedIcon: Icon(Icons.auto_stories, color: Brand.seal), label: 'Trang chủ'),
          const NavigationDestination(icon: Icon(Icons.explore_outlined), selectedIcon: Icon(Icons.explore, color: Brand.seal), label: 'Khám phá'),
          const NavigationDestination(icon: Icon(Icons.collections_bookmark_outlined), selectedIcon: Icon(Icons.collections_bookmark, color: Brand.seal), label: 'Tủ sách'),
          NavigationDestination(
            icon: Badge(isLabelVisible: s.unread > 0, label: Text('${s.unread}'), child: const Icon(Icons.person_outline)),
            selectedIcon: const Icon(Icons.person, color: Brand.seal),
            label: 'Tài khoản',
          ),
        ],
      ),
    );
  }
}
