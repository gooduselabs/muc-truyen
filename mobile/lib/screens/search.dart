import 'dart:async';
import 'package:flutter/material.dart';
import '../state.dart';
import '../theme.dart';
import '../widgets.dart';
import 'home.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final ctl = TextEditingController();
  String q = '';
  String by = 'week';
  Timer? t;
  static const tabs = {'week': 'Tuần này', 'views': 'Lượt đọc', 'likes': 'Yêu thích', 'rating': 'Điểm cao', 'library': 'Lưu nhiều'};

  @override
  void dispose() {
    t?.cancel();
    ctl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return SafeArea(
      bottom: false,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 18, 20, 4),
          child: Text('Khám phá', style: TextStyle(fontFamily: 'Lora', fontSize: 28, fontWeight: FontWeight.w700)),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
          child: TextField(
            controller: ctl,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'Tìm truyện, tác giả, thẻ… (gõ không dấu cũng được)',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: q.isEmpty ? null : IconButton(icon: const Icon(Icons.close), onPressed: () => setState(() => q = ctl.text = '')),
            ),
            onChanged: (v) {
              t?.cancel();
              t = Timer(const Duration(milliseconds: 350), () => setState(() => q = v.trim()));
            },
          ),
        ),
        if (q.isEmpty) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 6),
            child: Row(children: [
              const Icon(Icons.emoji_events_rounded, color: Brand.gold),
              const SizedBox(width: 6),
              const Text('Bảng xếp hạng', style: TextStyle(fontFamily: 'Lora', fontSize: 20, fontWeight: FontWeight.w700)),
            ]),
          ),
          SizedBox(
            height: 42,
            child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16), children: [
              for (final e in tabs.entries)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(e.value),
                    selected: by == e.key,
                    selectedColor: Brand.seal,
                    labelStyle: TextStyle(color: by == e.key ? Colors.white : null, fontWeight: FontWeight.w600),
                    showCheckmark: false,
                    onSelected: (_) => setState(() => by = e.key),
                  ),
                ),
            ]),
          ),
          Expanded(
            child: Loader<dynamic>(
              key: ValueKey('rank-$by-${app.api.server}'),
              load: () => app.api.get('/discover/rankings', {'by': by}),
              builder: (c, d, _) {
                final items = d as List;
                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                  itemCount: items.length,
                  itemBuilder: (c, i) => StoryRow(story: items[i], rank: i + 1),
                );
              },
            ),
          ),
        ] else
          Expanded(child: SearchResults(q: q)),
      ]),
    );
  }
}
