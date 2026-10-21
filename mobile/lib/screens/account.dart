import 'package:flutter/material.dart';
import '../api.dart';
import '../main.dart';
import '../state.dart';
import '../theme.dart';
import '../widgets.dart';
import 'reader.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final u = app.user;
    void go(Widget w) => Navigator.push(context, MaterialPageRoute(builder: (_) => w));
    return SafeArea(
      bottom: false,
      child: ListView(padding: const EdgeInsets.fromLTRB(16, 18, 16, 30), children: [
        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 14),
          child: Text('Tài khoản', style: TextStyle(fontFamily: 'Lora', fontSize: 28, fontWeight: FontWeight.w700)),
        ),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF2A2350), Brand.ink]),
            boxShadow: [BoxShadow(color: Brand.ink.withValues(alpha: .3), blurRadius: 20, offset: const Offset(0, 10))],
          ),
          child: u == null
              ? Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Chào bạn 👋', style: TextStyle(fontFamily: 'Lora', color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  const Text('Đăng nhập để đồng bộ tủ sách, bình luận và mở khoá chương.', style: TextStyle(color: Colors.white70, height: 1.5)),
                  const SizedBox(height: 14),
                  FilledButton(onPressed: () => go(const LoginScreen()), child: const Text('Đăng nhập / Đăng ký')),
                ])
              : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Avatar(u, size: 52),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(u['name'] ?? '', style: const TextStyle(fontFamily: 'Lora', color: Colors.white, fontSize: 21, fontWeight: FontWeight.w700)),
                        Text('@${u['username']}', style: const TextStyle(color: Colors.white60)),
                      ]),
                    ),
                  ]),
                  const SizedBox(height: 18),
                  Row(children: [
                    Expanded(child: _Stat('Số dư', '${app.coins} xu', Brand.gold)),
                    const SizedBox(width: 10),
                    Expanded(child: _Stat('Thông báo', '${app.unread} mới', const Color(0xFFFF8A73))),
                  ]),
                ]),
        ),
        const SizedBox(height: 18),
        _Group(children: [
          _Item(Icons.account_balance_wallet_outlined, 'Ví xu', 'Nạp xu, lịch sử giao dịch', () => go(const WalletScreen()), enabled: app.loggedIn),
          _Item(Icons.notifications_none_rounded, 'Thông báo', 'Chương mới, bình luận, ủng hộ', () => go(const NotificationsScreen()), enabled: app.loggedIn),
          _Item(Icons.tune_rounded, 'Cài đặt', 'Giao diện, máy chủ, trình đọc', () => go(const SettingsScreen())),
        ]),
        const SizedBox(height: 12),
        _Group(children: [
          SwitchListTile(
            secondary: const Icon(Icons.dark_mode_outlined),
            title: const Text('Chế độ tối', style: TextStyle(fontWeight: FontWeight.w600)),
            value: app.themeMode == ThemeMode.dark,
            activeThumbColor: Brand.seal,
            onChanged: (v) => app.setTheme(v ? ThemeMode.dark : ThemeMode.light),
          ),
        ]),
        if (u != null) ...[
          const SizedBox(height: 12),
          _Group(children: [_Item(Icons.logout_rounded, 'Đăng xuất', null, () => app.logout(), danger: true)]),
        ],
        const SizedBox(height: 24),
        Center(child: Text('Mực v0.1.0 · Thanh toán đang ở chế độ thử nghiệm', style: TextStyle(fontSize: 12, color: context.muted))),
      ]),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label, value;
  final Color color;
  const _Stat(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: .08), borderRadius: BorderRadius.circular(14)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(color: Colors.white60, fontSize: 12)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 17)),
        ]),
      );
}

class _Group extends StatelessWidget {
  final List<Widget> children;
  const _Group({required this.children});
  @override
  Widget build(BuildContext context) => Card(margin: EdgeInsets.zero, clipBehavior: Clip.antiAlias, child: Column(children: children));
}

class _Item extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? sub;
  final VoidCallback onTap;
  final bool enabled, danger;
  const _Item(this.icon, this.title, this.sub, this.onTap, {this.enabled = true, this.danger = false});
  @override
  Widget build(BuildContext context) => ListTile(
        enabled: enabled,
        leading: Icon(icon, color: danger ? Brand.seal : null),
        title: Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: danger ? Brand.seal : null)),
        subtitle: sub == null ? null : Text(sub!, style: TextStyle(fontSize: 12.5, color: context.muted)),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: onTap,
      );
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool reg = false, busy = false;
  final email = TextEditingController(text: 'docgia@muc.vn'), pass = TextEditingController(text: 'muc12345');
  final name = TextEditingController(), username = TextEditingController();

  Future<void> submit() async {
    setState(() => busy = true);
    try {
      await AppScope.read(context).login(email.text.trim(), pass.text, register: reg, name: name.text.trim(), username: username.text.trim());
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) context.toast(e is ApiError ? e.message : 'Không kết nối được máy chủ');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(),
        body: ListView(padding: const EdgeInsets.fromLTRB(24, 0, 24, 24), children: [
          const Align(alignment: Alignment.centerLeft, child: Logo(size: 40)),
          const SizedBox(height: 24),
          Text(reg ? 'Tạo tài khoản' : 'Chào mừng trở lại', style: const TextStyle(fontFamily: 'Lora', fontSize: 28, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(reg ? 'Đọc miễn phí, nhận 50 xu chào mừng.' : 'Tủ sách của bạn đang chờ.', style: TextStyle(color: context.muted)),
          const SizedBox(height: 24),
          if (reg) ...[
            TextField(controller: name, decoration: const InputDecoration(labelText: 'Tên hiển thị')),
            const SizedBox(height: 12),
            TextField(controller: username, decoration: const InputDecoration(labelText: 'Tên người dùng', prefixText: '@')),
            const SizedBox(height: 12),
          ],
          TextField(controller: email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
          const SizedBox(height: 12),
          TextField(controller: pass, obscureText: true, decoration: const InputDecoration(labelText: 'Mật khẩu')),
          const SizedBox(height: 20),
          FilledButton(onPressed: busy ? null : submit, child: Text(busy ? 'Đang xử lý…' : reg ? 'Đăng ký' : 'Đăng nhập')),
          TextButton(onPressed: () => setState(() => reg = !reg), child: Text(reg ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký')),
          if (!reg) Text('Tài khoản demo: docgia@muc.vn / muc12345', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: context.muted)),
        ]),
      );
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Thông báo'), actions: [
        TextButton(
          onPressed: () async {
            await app.api.post('/notifications/read-all');
            app.refreshMe();
          },
          child: const Text('Đọc hết'),
        ),
      ]),
      body: !app.loggedIn
          ? const Center(child: Text('Đăng nhập để xem thông báo'))
          : Loader<dynamic>(
              key: ValueKey(app.unread),
              load: () => app.api.get('/notifications'),
              builder: (c, d, _) {
                final items = d['items'] as List;
                const icons = {'chapter': Icons.auto_stories, 'follow': Icons.person_add_alt_1, 'comment': Icons.chat_bubble_outline, 'tip': Icons.card_giftcard, 'review': Icons.star_outline};
                return ListView.separated(
                  padding: const EdgeInsets.all(12),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (c, i) {
                    final n = items[i];
                    final link = (n['link'] ?? '') as String;
                    final m = RegExp(r'^/truyen/([^/]+)/(\d+)').firstMatch(link);
                    return Card(
                      margin: EdgeInsets.zero,
                      color: n['read'] == true ? null : Brand.seal.withValues(alpha: c.isDark ? .12 : .06),
                      child: ListTile(
                        leading: CircleAvatar(backgroundColor: Brand.seal.withValues(alpha: .12), child: Icon(icons[n['type']] ?? Icons.notifications, color: Brand.seal, size: 20)),
                        title: Text(n['title'], style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        subtitle: Text('${n['body'] ?? ''}\n${ago(n['createdAt'])}', style: TextStyle(fontSize: 12.5, color: c.muted)),
                        isThreeLine: true,
                        onTap: () {
                          app.api.post('/notifications/${n['id']}/read').then((_) => app.refreshMe(), onError: (_) {});
                          if (m != null) Navigator.push(c, MaterialPageRoute(builder: (_) => ReaderScreen(slug: m.group(1)!, number: int.parse(m.group(2)!))));
                        },
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});
  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  int bump = 0;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Ví xu')),
      body: Loader<List>(
        key: ValueKey(bump),
        load: () async => [await app.api.get('/wallet'), await app.api.get('/wallet/config')],
        builder: (c, d, _) {
          final w = d[0], cfg = d[1];
          final ledger = w['ledger'] as List;
          return ListView(padding: const EdgeInsets.all(16), children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(gradient: Brand.goldGradient, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Brand.gold.withValues(alpha: .4), blurRadius: 18, offset: const Offset(0, 8))]),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Số dư', style: TextStyle(color: Colors.white70)),
                Text('${w['coins']} xu', style: const TextStyle(fontFamily: 'Lora', fontSize: 36, color: Colors.white, fontWeight: FontWeight.w700)),
                Text('≈ ${(w['coins'] as int) * (cfg['coinVnd'] as int)}đ · 1 xu = ${cfg['coinVnd']}đ', style: const TextStyle(color: Colors.white70, fontSize: 12.5)),
              ]),
            ),
            const SectionTitle('Nạp xu', sub: 'Sandbox: không trừ tiền thật'),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.7,
              children: [
                for (final p in cfg['packages'] as List)
                  InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () async {
                      try {
                        await app.api.post('/wallet/topup', {'packageId': p['id'], 'provider': 'sandbox'});
                        await app.refreshMe();
                        if (c.mounted) c.toast('Đã nạp ${p['coins'] + p['bonus']} xu (sandbox)');
                        setState(() => bump++);
                      } catch (e) {
                        if (c.mounted) c.toast('$e');
                      }
                    },
                    child: Card(
                      margin: EdgeInsets.zero,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
                          Row(children: [
                            const Icon(Icons.toll_rounded, color: Brand.gold, size: 20),
                            const SizedBox(width: 4),
                            Text('${p['coins']}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                            if (p['bonus'] > 0) ...[const SizedBox(width: 6), Pill('+${p['bonus']}', color: Brand.seal)],
                          ]),
                          const SizedBox(height: 4),
                          Text('${(p['vnd'] as int) ~/ 1000}.000đ', style: TextStyle(color: c.muted, fontWeight: FontWeight.w600)),
                        ]),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Text('Lưu ý: bản phát hành trên Google Play / App Store phải dùng thanh toán trong ứng dụng (IAP) cho nội dung số. '
                'MoMo/VNPay chỉ dùng trên web.',
                style: TextStyle(fontSize: 12, color: c.muted, height: 1.5)),
            const SectionTitle('Lịch sử giao dịch'),
            for (final e in ledger)
              ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                leading: CircleAvatar(
                  backgroundColor: ((e['amount'] as int) > 0 ? Colors.green : Brand.seal).withValues(alpha: .12),
                  child: Icon((e['amount'] as int) > 0 ? Icons.south_west_rounded : Icons.north_east_rounded, size: 18, color: (e['amount'] as int) > 0 ? Colors.green : Brand.seal),
                ),
                title: Text(e['note'] ?? e['type'], style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                subtitle: Text(ago(e['createdAt']), style: TextStyle(fontSize: 12, color: c.muted)),
                trailing: Text('${(e['amount'] as int) > 0 ? '+' : ''}${e['amount']}',
                    style: TextStyle(fontWeight: FontWeight.w700, color: (e['amount'] as int) > 0 ? Colors.green : Brand.seal)),
              ),
          ]);
        },
      ),
    );
  }
}

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final server = TextEditingController(text: AppScope.read(context).api.server);
  String? health;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Cài đặt')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const Text('Máy chủ', style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        TextField(controller: server, decoration: const InputDecoration(hintText: 'http://10.0.2.2:4000', prefixIcon: Icon(Icons.dns_outlined))),
        const SizedBox(height: 8),
        Row(children: [
          FilledButton(
            onPressed: () async {
              await app.setServer(server.text);
              try {
                final h = await app.api.get('/health');
                setState(() => health = '✓ ${h['name']} ${h['version']}');
                app.refreshMe();
              } catch (e) {
                setState(() => health = '✗ Không kết nối được');
              }
            },
            child: const Text('Lưu & kiểm tra'),
          ),
          const SizedBox(width: 12),
          if (health != null) Expanded(child: Text(health!, style: TextStyle(color: health!.startsWith('✓') ? Colors.green : Brand.seal))),
        ]),
        const SizedBox(height: 6),
        Text('Máy ảo Android: 10.0.2.2 trỏ về máy tính đang chạy API.', style: TextStyle(fontSize: 12, color: context.muted)),
        const Divider(height: 40),
        const Text('Trình đọc', style: TextStyle(fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        ReaderSettings(app: app),
      ]),
    );
  }
}
