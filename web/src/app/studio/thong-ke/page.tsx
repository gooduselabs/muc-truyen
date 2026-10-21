'use client';
import { useEffect, useState } from 'react';
import { BookOpen, Coins, Star, Users, TrendingDown } from 'lucide-react';
import { useApi } from '@/lib/auth';
import { Card, Select, Skeleton } from '@/components/ui/misc';
import { AreaChart, fillDays } from '@/components/charts';
import { cn, fmt } from '@/lib/utils';

export default function Analytics() {
  const [days, setDays] = useState(30);
  const ov = useApi<any>(`/studio/analytics?days=${days}`);
  const [storyId, setStoryId] = useState<string>('');
  const [chapterId, setChapterId] = useState<string>('');
  useEffect(() => { if (ov.data?.stories[0] && !storyId) setStoryId(ov.data.stories[0].id); }, [ov.data, storyId]);
  const st = useApi<any>(storyId ? `/studio/analytics/stories/${storyId}` : null);
  useEffect(() => { if (st.data?.chapters[0]) setChapterId(st.data.chapters[0].id); }, [st.data]);
  const ch = useApi<any>(chapterId ? `/studio/analytics/chapters/${chapterId}` : null);
  if (!ov.data) return <Skeleton className="h-96" />;
  const d = ov.data;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-serif text-4xl font-bold">Thống kê</h1><p className="mt-1 text-muted">Ai đang đọc, đọc tới đâu, và bỏ ngang ở đâu.</p></div>
        <div className="flex gap-1 rounded-full border border-line bg-bg-soft p-1">
          {[7, 30, 90].map((v) => <button key={v} onClick={() => setDays(v)} className={cn('rounded-full px-4 py-1.5 text-sm font-semibold', days === v ? 'bg-card shadow' : 'text-muted')}>{v} ngày</button>)}
        </div>
      </div>
      <div className="stagger grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { i: BookOpen, l: 'Lượt đọc chương', v: fmt(d.reads), c: 'from-brand/15' },
          { i: Users, l: 'Người theo dõi', v: fmt(d.followers), c: 'from-violet-500/15' },
          { i: Coins, l: `Thu nhập ${days} ngày`, v: `${fmt(d.earned)} xu`, c: 'from-gold/20' },
          { i: Star, l: `Điểm TB · ${d.reviews} đánh giá`, v: d.rating ? d.rating.toFixed(1) : '—', c: 'from-emerald-500/15' },
        ].map((k) => (
          <Card key={k.l} className={cn('bg-gradient-to-br to-transparent p-5', k.c)}>
            <k.i className="size-5 text-muted" /><div className="mt-3 font-serif text-3xl font-bold">{k.v}</div><div className="text-xs text-muted">{k.l}</div>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6"><div className="mb-2 font-semibold">Lượt đọc mỗi ngày</div><AreaChart data={fillDays(d.daily, 'reads', days)} /></Card>
        <Card className="p-6"><div className="mb-2 font-semibold">Thu nhập mỗi ngày (xu)</div><AreaChart data={fillDays(d.earningsDaily, 'coins', days)} color="var(--gold)" /></Card>
      </div>

      <Card className="p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><div className="flex items-center gap-2 font-serif text-xl font-bold"><TrendingDown className="size-5 text-brand" />Tỉ lệ giữ chân theo chương</div><div className="text-sm text-muted">% độc giả của chương 1 còn đọc tới chương này</div></div>
          <Select value={storyId} onChange={(e) => setStoryId(e.target.value)} className="w-72">{d.stories.map((s: any) => <option key={s.id} value={s.id}>{s.title}</option>)}</Select>
        </div>
        {!st.data ? <Skeleton className="h-40" /> : (
          <div className="space-y-2">
            {st.data.chapters.map((c: any) => (
              <button key={c.id} onClick={() => setChapterId(c.id)} className={cn('grid w-full grid-cols-[110px_1fr_150px] items-center gap-4 rounded-xl px-2 py-1.5 text-left text-sm transition hover:bg-bg-soft', chapterId === c.id && 'bg-bg-soft')}>
                <span className="truncate font-medium">Chương {c.number}{c.price > 0 && <span className="ml-1 text-gold">●</span>}</span>
                <div className="h-6 overflow-hidden rounded-lg bg-bg-soft"><div className="flex h-full items-center rounded-lg bg-gradient-to-r from-brand to-gold px-2 text-[11px] font-bold text-white transition-all duration-700" style={{ width: `${Math.max(4, c.retention * 100)}%` }}>{Math.round(c.retention * 100)}%</div></div>
                <span className="text-right text-xs text-muted">{c.readers} người · hoàn thành {Math.round(c.completion * 100)}%</span>
              </button>
            ))}
            <p className="pt-2 text-xs text-muted"><span className="text-gold">●</span> chương trả phí — thường là nơi độc giả rời đi nhiều nhất.</p>
          </div>
        )}
      </Card>

      {ch.data && (
        <Card className="p-6">
          <div className="mb-1 font-serif text-xl font-bold">Bản đồ bỏ ngang · Chương {ch.data.chapter.number}</div>
          <div className="mb-5 text-sm text-muted">{ch.data.totalReads} lượt đọc · mỗi vạch là một đoạn văn; càng nhạt nghĩa là càng ít người đọc tới.</div>
          <div className="space-y-1">
            {ch.data.paragraphs.map((p: any) => (
              <div key={p.index} className="group grid grid-cols-[34px_1fr_60px] items-center gap-3 text-xs">
                <span className="text-right text-muted">{p.index + 1}</span>
                <div className="relative h-7 overflow-hidden rounded-md bg-bg-soft">
                  <div className="absolute inset-y-0 left-0 bg-brand" style={{ width: `${p.reached * 100}%`, opacity: 0.25 + p.reached * 0.6 }} />
                  <span className="relative block truncate px-2 leading-7 text-fg/80">{p.preview}</span>
                </div>
                <span className="text-right font-mono">{Math.round(p.reached * 100)}%{p.comments > 0 && <span className="ml-1 text-brand">💬{p.comments}</span>}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
