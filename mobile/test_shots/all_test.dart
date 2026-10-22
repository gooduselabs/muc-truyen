// ignore_for_file: invalid_use_of_visible_for_testing_member
// Renders the full mobile screenshot set from recorded API responses (test_shots/api).
// Run: flutter test test_shots/all_test.dart   (record: node ../../tools/record_api.mjs)
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:muc_reader/main.dart';
import 'package:muc_reader/screens/account.dart';
import 'package:muc_reader/screens/home.dart';
import 'package:muc_reader/screens/reader.dart';
import 'package:muc_reader/screens/story.dart';
import 'package:muc_reader/state.dart';
import 'package:shared_preferences/shared_preferences.dart';

const out = String.fromEnvironment('OUT', defaultValue: '../docs/screens');
String key(Uri u) {
  var k = u.path.replaceFirst('/api', '');
  if (u.query.isNotEmpty) k += '?${u.query}';
  return k.replaceAll(RegExp(r'[^A-Za-z0-9._-]+'), '_');
}

MockClient mockApi() => MockClient((req) async {
      final k = key(req.url);
      final f = File('test_shots/api/$k.json');
      String body;
      if (req.method != 'GET' && !f.existsSync()) {
        body = req.url.path.endsWith('/reads') ? '{"readId":"r1"}' : '{}';
      } else if (f.existsSync()) {
        body = f.readAsStringSync();
      } else {
        File('test_shots/missing.txt').writeAsStringSync('${req.method} ${req.url.path}${req.url.query.isEmpty ? '' : '?${req.url.query}'}\n', mode: FileMode.append);
        body = '{}';
      }
      return http.Response.bytes(utf8.encode(body), 200, headers: {'content-type': 'application/json; charset=utf-8'});
    });

Future<void> loadFonts() async {
  Future<void> f(String fam, List<String> files) async {
    final l = FontLoader(fam);
    for (final x in files) {
      l.addFont(Future.value(ByteData.sublistView(File(x).readAsBytesSync())));
    }
    await l.load();
  }
  await f('BeVietnamPro', ['assets/fonts/BeVietnamPro-Regular.ttf', 'assets/fonts/BeVietnamPro-Medium.ttf', 'assets/fonts/BeVietnamPro-SemiBold.ttf', 'assets/fonts/BeVietnamPro-Bold.ttf']);
  await f('Playfair', ['assets/fonts/PlayfairDisplay.ttf']);
  await f('Lora', ['assets/fonts/Lora.ttf', 'assets/fonts/Lora-Italic.ttf']);
  await f('MaterialIcons', ['${Platform.environment['FLUTTER_ROOT']}/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf']);
}

Future<void> settle(WidgetTester t) async {
  for (var i = 0; i < 30; i++) {
    await t.pump(const Duration(milliseconds: 100));
  }
  await t.runAsync(() => Future.delayed(const Duration(milliseconds: 200)));
  await t.pump();
  for (var i = 0; i < 10; i++) {
    await t.pump(const Duration(milliseconds: 100));
  }
}

Future<void> snap(WidgetTester t, String name) async {
  final rb = t.renderObject(find.byKey(const Key('shot'))) as RenderRepaintBoundary;
  await t.runAsync(() async {
    final img = await rb.toImage(pixelRatio: 3);
    final bd = await img.toByteData(format: ui.ImageByteFormat.png);
    File('$out/$name.png').writeAsBytesSync(bd!.buffer.asUint8List());
  });
}

void main() {
  setUpAll(loadFonts);
  for (final dark in [false, true]) {
    final m = dark ? 'dark' : 'light';
    Future<void> shot(WidgetTester t, Widget? home, String name, {bool member = true, ReaderTheme? rt, Future<void> Function()? after}) async {
      t.view.physicalSize = const Size(1179, 2556);
      t.view.devicePixelRatio = 3;
      SharedPreferences.setMockInitialValues({if (member) 'token': 'shot', if (rt != null) 'readerTheme': rt.name, 'theme': m});
      final s = AppState();
      s.api.client = mockApi();
      await s.init();
      s.api.client = mockApi();
      await t.runAsync(() async {
        for (final a in ['assets/brand/paper.png', 'assets/brand/night.png', 'assets/brand/logo.png', 'assets/brand/sepia.png']) {
          await precacheImage(AssetImage(a), t.binding.rootElement!);
        }
      }).catchError((_) {});
      await t.pumpWidget(RepaintBoundary(key: const Key('shot'), child: MucApp(state: s, home: home)));
      await settle(t);
      if (after != null) {
        await after();
        await settle(t);
      }
      await snap(t, 'mobile-$name-$m');
    }

    const story = 'nguoi-gac-den-o-cu-lao-may';
    testWidgets('splash $m', (t) => shot(t, const Splash(), 'splash', member: false));
    testWidgets('home member $m', (t) => shot(t, null, 'home-member'));
    testWidgets('discover $m', (t) => shot(t, const Shell(initial: 1), 'discover'));
    testWidgets('search $m', (t) => shot(t, const Shell(initial: 1), 'search', after: () async {
          await t.enterText(find.byType(TextField), 'đèn');
          await t.testTextInput.receiveAction(TextInputAction.search);
        }));
    testWidgets('genre $m', (t) => shot(t, Scaffold(appBar: AppBar(title: const Text('Huyền huyễn')), body: const SearchResults(genre: 'Huyền huyễn')), 'genre'));
    testWidgets('library $m', (t) => shot(t, const Shell(initial: 2), 'library'));
    testWidgets('library guest $m', (t) => shot(t, const Shell(initial: 2), 'library-guest', member: false));
    testWidgets('account $m', (t) => shot(t, const Shell(initial: 3), 'account'));
    testWidgets('account guest $m', (t) => shot(t, const Shell(initial: 3), 'account-guest', member: false));
    testWidgets('wallet $m', (t) => shot(t, const WalletScreen(), 'wallet'));
    testWidgets('notifications $m', (t) => shot(t, const NotificationsScreen(), 'notifications'));
    testWidgets('settings $m', (t) => shot(t, const SettingsScreen(), 'settings'));
    testWidgets('login $m', (t) => shot(t, const LoginScreen(), 'login', member: false));
    testWidgets('register $m', (t) => shot(t, const LoginScreen(), 'register', member: false, after: () async {
          await t.tap(find.text('Chưa có tài khoản? Đăng ký'));
        }));
    testWidgets('story tip $m', (t) => shot(t, const StoryScreen(slug: story), 'story-tip', after: () async {
          await t.tap(find.byIcon(Icons.card_giftcard_rounded));
        }));
    testWidgets('story toc $m', (t) => shot(t, const StoryScreen(slug: story), 'story-toc', after: () async {
          await t.drag(find.byType(Scrollable).first, const Offset(0, -900));
        }));
    testWidgets('reader sepia $m', (t) => shot(t, const ReaderScreen(slug: story, number: 1), 'reader-sepia', rt: ReaderTheme.sepia));
    testWidgets('reader settings $m', (t) => shot(t, const ReaderScreen(slug: story, number: 1), 'reader-settings', rt: dark ? ReaderTheme.dark : ReaderTheme.light, after: () async {
          await t.tap(find.byIcon(Icons.text_fields_rounded));
        }));
    testWidgets('reader comments $m', (t) => shot(t, const ReaderScreen(slug: story, number: 1), 'reader-comments', rt: dark ? ReaderTheme.dark : ReaderTheme.light, after: () async {
          await t.longPress(find.textContaining('Người trong xóm chài', findRichText: true).first);
        }));
    testWidgets('reader end $m', (t) => shot(t, const ReaderScreen(slug: story, number: 1), 'reader-end', rt: dark ? ReaderTheme.dark : ReaderTheme.light, after: () async {
          await t.drag(find.byType(Scrollable).first, const Offset(0, -20000));
        }));
    testWidgets('unlock member $m', (t) => shot(t, const ReaderScreen(slug: 'kiem-khach-pho-hang-bac', number: 3), 'unlock-options', rt: dark ? ReaderTheme.dark : ReaderTheme.light, after: () async {
          await t.drag(find.byType(Scrollable).first, const Offset(0, -20000));
        }));
  }
}
