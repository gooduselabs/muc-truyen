import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiError implements Exception {
  final int status;
  final String message;
  ApiError(this.status, this.message);
  @override
  String toString() => message;
}

/// Tiny REST client for the Mực API. Server URL is configurable in Settings
/// (default 10.0.2.2:4000 = host machine as seen from the Android emulator).
class Api {
  static const defaultServer = 'http://10.0.2.2:4000';
  String server;
  String? token;
  http.Client client;
  Api({this.server = defaultServer, this.token, http.Client? client}) : client = client ?? http.Client();

  Uri _u(String path, [Map<String, String>? q]) => Uri.parse('$server/api$path').replace(queryParameters: q);
  Map<String, String> get _h => {
        'content-type': 'application/json',
        if (token != null) 'authorization': 'Bearer $token',
      };

  String asset(String url) => url.startsWith('http') ? url : '$server$url';

  Future<dynamic> _handle(http.Response r) async {
    final body = r.body.isEmpty ? null : jsonDecode(utf8.decode(r.bodyBytes));
    if (r.statusCode >= 400) {
      final m = body is Map ? body['message'] : null;
      throw ApiError(r.statusCode, m is List ? m.join(', ') : (m?.toString() ?? 'Lỗi ${r.statusCode}'));
    }
    return body;
  }

  Future<dynamic> get(String p, [Map<String, String>? q]) async =>
      _handle(await client.get(_u(p, q), headers: _h).timeout(const Duration(seconds: 12)));
  Future<dynamic> post(String p, [Object? b]) async =>
      _handle(await client.post(_u(p), headers: _h, body: jsonEncode(b ?? {})).timeout(const Duration(seconds: 12)));
  Future<dynamic> delete(String p) async =>
      _handle(await client.delete(_u(p), headers: _h).timeout(const Duration(seconds: 12)));
}

/// Offline chapter cache, stored as JSON in SharedPreferences.
class OfflineStore {
  final SharedPreferences prefs;
  OfflineStore(this.prefs);
  String _sk(String slug) => 'off_story:$slug';
  String _ck(String slug, int n) => 'off_ch:$slug:$n';

  Future<void> saveStory(Map story) => prefs.setString(_sk(story['slug']), jsonEncode(story));
  Future<void> saveChapter(String slug, int n, Map data) => prefs.setString(_ck(slug, n), jsonEncode(data));
  Map<String, dynamic>? story(String slug) {
    final s = prefs.getString(_sk(slug));
    return s == null ? null : jsonDecode(s);
  }

  Map<String, dynamic>? chapter(String slug, int n) {
    final s = prefs.getString(_ck(slug, n));
    return s == null ? null : jsonDecode(s);
  }

  List<int> chapterNumbers(String slug) => prefs
      .getKeys()
      .where((k) => k.startsWith('off_ch:$slug:'))
      .map((k) => int.tryParse(k.split(':').last) ?? 0)
      .toList()
    ..sort();

  List<Map<String, dynamic>> stories() => prefs
      .getKeys()
      .where((k) => k.startsWith('off_story:'))
      .map((k) => jsonDecode(prefs.getString(k)!) as Map<String, dynamic>)
      .toList();

  Future<void> remove(String slug) async {
    for (final k in prefs.getKeys().where((k) => k.startsWith('off_ch:$slug:') || k == _sk(slug)).toList()) {
      await prefs.remove(k);
    }
  }
}
