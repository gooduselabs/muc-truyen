// ignore_for_file: invalid_use_of_visible_for_testing_member
// Renders the mobile screenshots: flutter test test_shots/shots_test.dart
import 'dart:ui' as ui;
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:muc_reader/main.dart';
import 'package:muc_reader/screens/reader.dart';
import 'package:muc_reader/screens/story.dart';
import 'package:muc_reader/state.dart';
import 'package:shared_preferences/shared_preferences.dart';

String fx(String n) => File('test/fixtures/$n.json').readAsStringSync();

MockClient mockApi() => MockClient((req) async {
      final p = req.url.path;
      String body = '{}';
      if (p.endsWith('/discover/home')) body = fx('home');
      if (p.endsWith('/stories/nguoi-gac-den-o-cu-lao-may')) body = fx('story');
      if (p.endsWith('/chapters/1')) body = fx('chapter');
      if (p.endsWith('/kiem-khach-pho-hang-bac/chapters/3')) body = fx('locked');
      if (p.endsWith('/reads')) body = '{"readId":"r1"}';
      if (p.endsWith('/discover/rankings')) body = jsonEncode(jsonDecode(fx('home'))['trending']);
      return http.Response.bytes(utf8.encode(body), 200, headers: {'content-type': 'application/json; charset=utf-8'});
    });

Future<AppState> makeState() async {
  SharedPreferences.setMockInitialValues({});
  final s = AppState();
  await s.init();
  s.api.client = mockApi();
  return s;
}

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

Future<void> snap(WidgetTester t, String name) async {
  final rb = t.renderObject(find.byKey(const Key('shot'))) as RenderRepaintBoundary;
  await t.runAsync(() async {
    final img = await rb.toImage(pixelRatio: 3);
    final bd = await img.toByteData(format: ui.ImageByteFormat.png);
    File('../docs/screens/$name.png').writeAsBytesSync(bd!.buffer.asUint8List());
  });
}

void main() {
  setUpAll(loadFonts);
  for (final dark in [false, true]) {
    final m = dark ? 'dark' : 'light';
    Future<void> shot(WidgetTester t, Widget? home, String name, {Future<void> Function()? after}) async {
      t.view.physicalSize = const Size(1179, 2556);
      t.view.devicePixelRatio = 3;
      final s = await makeState();
      s.themeMode = dark ? ThemeMode.dark : ThemeMode.light;
      await t.runAsync(() async {
        for (final a in ['assets/brand/paper.png', 'assets/brand/night.png', 'assets/brand/logo.png', 'assets/brand/sepia.png']) {
          await precacheImage(AssetImage(a), t.binding.rootElement!);
        }
      }).catchError((_) {});
      await t.pumpWidget(RepaintBoundary(key: const Key('shot'), child: MucApp(state: s, home: home)));
      for (var i = 0; i < 30; i++) {
        await t.pump(const Duration(milliseconds: 100));
      }
      await t.runAsync(() => Future.delayed(const Duration(milliseconds: 300)));
      await t.pump();
      if (after != null) await after();
      await snap(t, 'mobile-$name-$m');
    }

    testWidgets('home $m', (t) => shot(t, null, 'home'));
    testWidgets('story $m', (t) => shot(t, const StoryScreen(slug: 'nguoi-gac-den-o-cu-lao-may'), 'story'));
    testWidgets('reader $m', (t) => shot(t, const ReaderScreen(slug: 'nguoi-gac-den-o-cu-lao-may', number: 1), 'reader'));
    testWidgets('locked $m', (t) => shot(t, const ReaderScreen(slug: 'kiem-khach-pho-hang-bac', number: 3), 'locked'));
  }
}
