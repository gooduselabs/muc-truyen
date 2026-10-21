import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:muc_reader/api.dart';
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

void main() {
  testWidgets('trang chủ hiển thị banner, mục tuyển chọn và kệ truyện', (t) async {
    final s = await makeState();
    await t.pumpWidget(MucApp(state: s));
    await t.pumpAndSettle();
    expect(find.text('BIÊN TẬP VIÊN CHỌN'), findsWidgets);
    expect(find.text('Biên tập viên chọn'), findsOneWidget);
    await t.scrollUntilVisible(find.text('Đang thịnh hành'), 300, scrollable: find.byType(Scrollable).first);
    expect(find.text('Đang thịnh hành'), findsOneWidget);
    expect(find.text('Trang chủ'), findsOneWidget);
  });

  testWidgets('trang truyện hiển thị mục lục và giá chương', (t) async {
    final s = await makeState();
    await t.pumpWidget(MucApp(state: s, home: const StoryScreen(slug: 'nguoi-gac-den-o-cu-lao-may')));
    await t.pumpAndSettle();
    expect(find.text('Người Gác Đèn Ở Cù Lao Mây'), findsWidgets);
    await t.scrollUntilVisible(find.text('Chiếc chìa khoá bằng đồng'), 200, scrollable: find.byType(Scrollable).first);
    expect(find.text('Mục lục'), findsOneWidget);
    expect(find.text('Chiếc chìa khoá bằng đồng'), findsOneWidget);
  });

  testWidgets('trình đọc hiển thị đoạn văn và đổi giao diện', (t) async {
    final s = await makeState();
    await t.pumpWidget(MucApp(state: s, home: const ReaderScreen(slug: 'nguoi-gac-den-o-cu-lao-may', number: 1)));
    await t.pumpAndSettle();
    expect(find.text('CHƯƠNG 1'), findsOneWidget);
    s.setReader(theme: ReaderTheme.dark, size: 22);
    await t.pumpAndSettle();
    expect(s.readerTheme, ReaderTheme.dark);
    expect(s.prefs!.getString('readerTheme'), 'dark');
  });

  testWidgets('chương khoá hiện 3 lựa chọn mở khoá', (t) async {
    final s = await makeState();
    await t.pumpWidget(MucApp(state: s, home: const ReaderScreen(slug: 'kiem-khach-pho-hang-bac', number: 3)));
    await t.pumpAndSettle();
    await t.scrollUntilVisible(find.text('Mua vĩnh viễn'), 300, scrollable: find.byType(Scrollable).first);
    expect(find.text('Chương này cần mở khoá'), findsOneWidget);
    expect(find.text('Thuê 48 giờ'), findsOneWidget);
    expect(find.text('Chờ là miễn phí'), findsOneWidget);
  });

  test('OfflineStore lưu và đọc lại chương', () async {
    SharedPreferences.setMockInitialValues({});
    final o = OfflineStore(await SharedPreferences.getInstance());
    await o.saveStory({'slug': 'a', 'title': 'A'});
    await o.saveChapter('a', 2, {'x': 1});
    await o.saveChapter('a', 1, {'x': 0});
    expect(o.chapterNumbers('a'), [1, 2]);
    expect(o.chapter('a', 2)!['x'], 1);
    expect(o.stories().single['title'], 'A');
    await o.remove('a');
    expect(o.stories(), isEmpty);
  });

  test('Api ném ApiError với thông điệp tiếng Việt', () async {
    final api = Api(client: MockClient((_) async => http.Response.bytes(utf8.encode('{"message":"Không đủ xu"}'), 400)));
    expect(() => api.post('/wallet/unlock/x'), throwsA(isA<ApiError>().having((e) => e.message, 'message', 'Không đủ xu')));
  });
}
