import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';

enum ReaderTheme { light, sepia, dark }

class AppState extends ChangeNotifier {
  final Api api = Api();
  SharedPreferences? prefs;
  OfflineStore? offline;
  Map<String, dynamic>? user;
  bool ready = false;
  ThemeMode themeMode = ThemeMode.light;
  ReaderTheme readerTheme = ReaderTheme.sepia;
  double fontSize = 19;
  double lineHeight = 1.75;
  double ttsRate = 0.5;
  int unread = 0;
  int coins = 0;

  bool get loggedIn => user != null;

  /// Called after runApp (never block before the first frame).
  Future<void> init() async {
    try {
      prefs = await SharedPreferences.getInstance();
      final p = prefs!;
      offline = OfflineStore(p);
      api.server = p.getString('server') ?? Api.defaultServer;
      api.token = p.getString('token');
      themeMode = p.getString('theme') == 'dark' ? ThemeMode.dark : ThemeMode.light;
      readerTheme = ReaderTheme.values.firstWhere((t) => t.name == p.getString('readerTheme'), orElse: () => ReaderTheme.sepia);
      fontSize = p.getDouble('fontSize') ?? 19;
      lineHeight = p.getDouble('lineHeight') ?? 1.75;
      ttsRate = p.getDouble('ttsRate') ?? 0.5;
    } catch (_) {}
    ready = true;
    notifyListeners();
    if (api.token != null) refreshMe();
  }

  Future<void> refreshMe() async {
    try {
      user = Map<String, dynamic>.from(await api.get('/auth/me'));
      final w = await api.get('/wallet');
      coins = w['coins'] ?? 0;
      final n = await api.get('/notifications');
      unread = (n['items'] as List).where((i) => i['read'] != true).length;
    } on ApiError catch (e) {
      if (e.status == 401) await logout();
    } catch (_) {}
    notifyListeners();
  }

  Future<void> login(String email, String password, {String? name, String? username, bool register = false}) async {
    final r = register
        ? await api.post('/auth/register', {'email': email, 'password': password, 'name': name, 'username': username})
        : await api.post('/auth/login', {'email': email, 'password': password});
    api.token = r['token'];
    await prefs?.setString('token', api.token!);
    user = Map<String, dynamic>.from(r['user']);
    await refreshMe();
  }

  Future<void> logout() async {
    api.token = null;
    user = null;
    coins = 0;
    unread = 0;
    await prefs?.remove('token');
    notifyListeners();
  }

  Future<void> setServer(String s) async {
    api.server = s.trim().replaceAll(RegExp(r'/+$'), '');
    await prefs?.setString('server', api.server);
    notifyListeners();
  }

  void setTheme(ThemeMode m) {
    themeMode = m;
    prefs?.setString('theme', m == ThemeMode.dark ? 'dark' : 'light');
    notifyListeners();
  }

  void setReader({ReaderTheme? theme, double? size, double? height, double? rate}) {
    if (theme != null) readerTheme = theme;
    if (size != null) fontSize = size;
    if (height != null) lineHeight = height;
    if (rate != null) ttsRate = rate;
    prefs?.setString('readerTheme', readerTheme.name);
    prefs?.setDouble('fontSize', fontSize);
    prefs?.setDouble('lineHeight', lineHeight);
    prefs?.setDouble('ttsRate', ttsRate);
    notifyListeners();
  }

  void setCoins(int c) {
    coins = c;
    notifyListeners();
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);
  static AppState of(BuildContext c) => c.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;
  static AppState read(BuildContext c) => c.getInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
