'use client';
import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown, ArrowUp, Ban, BadgeCheck, BookOpen, Check, Coins, Eye, EyeOff, Flag, FolderTree, Gauge, History, Image as ImageIcon,
  LayoutTemplate, Megaphone, Pin, Plus, Sparkles, Star, Trash2, TrendingUp, Users, Wallet, X,
} from 'lucide-react';
import { useApi } from '@/lib/auth';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Badge, Empty, Input, Select, Skeleton, Textarea } from '@/components/ui/misc';
import { useToast } from '@/components/toast';
import { AreaChart } from '@/components/charts';
import { Cover } from '@/components/cover';
import { LogoMark } from '@/components/brand';
import { ago, cn, fmt, vnd } from '@/lib/utils';
import { Kpi, Panel, Pill, Switch, fromLocal, scheduleLabel, toLocal } from './ui';

const SECTIONS = [
  { id: 'tong-quan', label: 'Tổng quan', icon: Gauge },
  { id: 'truyen', label: 'Truyện', icon: BookOpen },
  { id: 'trang-chu', label: 'Trang chủ & banner', icon: LayoutTemplate },
  { id: 'xep-hang', label: 'Xếp hạng', icon: TrendingUp },
  { id: 'the-loai', label: 'Thể loại & thẻ', icon: FolderTree },
  { id: 'nguoi-dung', label: 'Người dùng', icon: Users },
  { id: 'bao-cao', label: 'Báo cáo', icon: Flag },
  { id: 'chi-tra', label: 'Chi trả', icon: Wallet },
  { id: 'goi-xu', label: 'Gói xu & khuyến mãi', icon: Coins },
  { id: 'thong-bao', label: 'Thông báo', icon: Megaphone },
  { id: 'nhat-ky', label: 'Nhật ký', icon: History },
] as const;
type Sec = (typeof SECTIONS)[number]['id'];

function Admin() {
  const [sec, setSec] = React.useState<Sec>('tong-quan');
  const stats = useApi<any>('/admin/stats');
  React.useEffect(() => {
    const h = location.hash.slice(1) as Sec;
    if (SECTIONS.some((s) => s.id === h)) setSec(h);
  }, []);
  const go = (s: Sec) => { setSec(s); history.replaceState(null, '', `#${s}`); };
  const badge: Partial<Record<Sec, number>> = { truyen: stats.data?.pendingStories, 'bao-cao': stats.data?.openReports, 'chi-tra': stats.data?.pendingPayouts };
  return (
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-8 md:px-6 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-5 flex items-center gap-3 px-2">
          <LogoMark className="size-10" />
          <div><div className="font-display text-xl font-bold leading-none">Quản trị</div><div className="mt-1 text-xs text-muted">Bàn biên tập Mực</div></div>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => go(s.id)} className={cn('relative flex shrink-0 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-semibold transition', sec === s.id ? 'text-white' : 'text-muted hover:bg-bg-soft hover:text-fg')}>
              {sec === s.id && <motion.span layoutId="admin-nav" className="absolute inset-0 -z-0 rounded-2xl bg-ink shadow-lg dark:bg-brand" />}
              <s.icon className="relative size-4" /><span className="relative flex-1">{s.label}</span>
              {!!badge[s.id] && <span className="relative grid min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[10px] text-white">{badge[s.id]}</span>}
            </button>
          ))}
        </nav>
      </aside>
      <main className="min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={sec} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            {sec === 'tong-quan' && <Dashboard go={go} />}
            {sec === 'truyen' && <Stories onChange={stats.reload} />}
            {sec === 'trang-chu' && <Homepage />}
            {sec === 'xep-hang' && <Rankings />}
            {sec === 'the-loai' && <Taxonomy />}
            {sec === 'nguoi-dung' && <UsersSec />}
            {sec === 'bao-cao' && <Reports onChange={stats.reload} />}
            {sec === 'chi-tra' && <Payouts onChange={stats.reload} />}
            {sec === 'goi-xu' && <Packages />}
            {sec === 'thong-bao' && <Announcements />}
            {sec === 'nhat-ky' && <Audit />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function H({ title, sub, children }: { title: string; sub: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-display text-4xl font-black tracking-tight">{title}</h1><p className="mt-1 text-muted">{sub}</p></div>
      {children}
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ go }: { go: (s: Sec) => void }) {
  const [days, setDays] = React.useState(30);
  const d = useApi<any>(`/admin/dashboard?days=${days}`);
  const x = d.data;
  const series = (k: string) => (x?.series || []).map((s: any) => ({ x: s.day, y: s[k] }));
  return (
    <>
      <H title="Tổng quan" sub="Sức khoẻ của cộng đồng, theo thời gian thực.">
        <div className="flex gap-1 rounded-full border border-line bg-bg-soft p-1">
          {[7, 30, 90].map((n) => <button key={n} onClick={() => setDays(n)} className={cn('rounded-full px-4 py-1.5 text-sm font-semibold', days === n ? 'bg-card shadow' : 'text-muted')}>{n} ngày</button>)}
        </div>
      </H>
      {!x ? <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Kpi i={0} icon={Users} label="Người dùng" value={fmt(x.users)} sub={`+${x.totals.newUsers} trong ${days} ngày`} tone="indigo" />
            <Kpi i={1} icon={Eye} label="DAU hôm nay" value={x.totals.dauToday} sub={`TB ${x.totals.dauAvg}/ngày`} tone="jade" />
            <Kpi i={2} icon={BookOpen} label="Lượt đọc chương" value={fmt(x.totals.views)} sub={`${x.chapters} chương đã đăng`} tone="brand" />
            <Kpi i={3} icon={Coins} label="Doanh thu (sandbox)" value={vnd(x.totals.revenueVnd)} sub={`${fmt(x.totals.coinsSold)} xu bán · ${fmt(x.totals.coinsSpent)} xu tiêu`} tone="gold" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[['Truyện chờ duyệt', x.pendingStories, 'truyen'], ['Báo cáo đang mở', x.openReports, 'bao-cao'], ['Yêu cầu chi trả', x.pendingPayouts, 'chi-tra']].map(([l, v, s]: any) => (
              <button key={l} onClick={() => go(s)} className="sheet group flex items-center justify-between rounded-3xl px-5 py-4 text-left transition hover:-translate-y-0.5">
                <span className="font-semibold">{l}</span>
                <span className={cn('font-display text-3xl font-bold', v ? 'text-brand' : 'text-muted')}>{v}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Người đọc hoạt động (DAU)" sub="Số độc giả khác nhau mở chương mỗi ngày"><AreaChart data={series('dau')} color="var(--jade)" /></Panel>
            <Panel title="Lượt đọc chương" sub="Tổng lượt mở chương mỗi ngày"><AreaChart data={series('views')} color="var(--brand)" /></Panel>
            <Panel title="Doanh thu nạp xu" sub="VND, cổng sandbox"><AreaChart data={series('vnd')} color="var(--gold)" label={(v) => vnd(v)} /></Panel>
            <Panel title="Xu tiêu dùng" sub="Mở khoá, thuê chương, ủng hộ"><AreaChart data={series('spent')} color="var(--indigo)" /></Panel>
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
            <Panel title="Truyện đọc nhiều nhất">
              <div className="space-y-2">
                {x.topStories.map((s: any, i: number) => (
                  <Link key={s.id} href={`/truyen/${s.slug}`} className="flex items-center gap-4 rounded-2xl p-2 hover:bg-bg-soft">
                    <span className="w-6 text-center font-display text-2xl font-black italic text-brand">{i + 1}</span>
                    <Cover title={s.title} seed={s.coverSeed} size="sm" className="w-10" />
                    <div className="min-w-0 flex-1"><div className="truncate font-semibold">{s.title}</div><div className="text-xs text-muted">{s.author.name} · {s.genre}</div></div>
                    <div className="text-right text-sm font-semibold">{fmt(s.views)}<div className="text-xs font-normal text-muted">lượt đọc</div></div>
                  </Link>
                ))}
              </div>
            </Panel>
            <Panel title="Thể loại" sub="Lượt đọc theo thể loại">
              <div className="space-y-3">
                {(() => { const max = Math.max(1, ...x.genres.map((g: any) => g.views)); return x.genres.map((g: any, i: number) => (
                  <div key={g.genre}>
                    <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{g.genre}</span><span className="text-muted">{fmt(g.views)} · {g.n} truyện</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-bg-soft"><motion.div initial={{ width: 0 }} animate={{ width: `${(g.views / max) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-brand to-gold" /></div>
                  </div>
                )); })()}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- Stories ---------------- */
const VIS: Record<string, { l: string; tone: 'jade' | 'gold' | 'muted' | 'brand' }> = { PUBLISHED: { l: 'Đã đăng', tone: 'jade' }, PENDING: { l: 'Chờ duyệt', tone: 'gold' }, HIDDEN: { l: 'Đã ẩn', tone: 'brand' }, DRAFT: { l: 'Nháp', tone: 'muted' } };
function Stories({ onChange }: { onChange: () => void }) {
  const toast = useToast();
  const [vis, setVis] = React.useState('');
  const [q, setQ] = React.useState('');
  const list = useApi<any[]>(`/admin/stories?visibility=${vis}&q=${encodeURIComponent(q)}`);
  const act = async (id: string, action: string, value?: number) => {
    await api(`/admin/stories/${id}`, { body: { action, value } });
    toast({ approve: 'Đã duyệt truyện', hide: 'Đã ẩn truyện', publish: 'Đã hiện lại', pin: 'Đã ghim lên đầu', unpin: 'Đã bỏ ghim', feature: 'Đã đưa vào nổi bật', unfeature: 'Đã bỏ nổi bật', boost: 'Đã cập nhật ưu tiên xếp hạng' }[action] || 'OK');
    list.reload(); onChange();
  };
  return (
    <>
      <H title="Truyện" sub="Duyệt, ẩn, ghim lên đầu và đưa vào mục nổi bật." />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {[['', 'Tất cả'], ['PENDING', 'Chờ duyệt'], ['PUBLISHED', 'Đã đăng'], ['HIDDEN', 'Đã ẩn'], ['DRAFT', 'Nháp']].map(([k, l]) => <Pill key={k} on={vis === k} tone="brand" onClick={() => setVis(k)}>{l}</Pill>)}
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên truyện…" className="ml-auto h-10 max-w-xs" />
      </div>
      {!list.data ? <Skeleton className="h-64" /> : !list.data.length ? <Empty title="Không có truyện nào" hint="Thử bộ lọc khác." /> : (
        <div className="space-y-3">
          {list.data.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="sheet flex flex-wrap items-center gap-4 rounded-3xl p-4">
              <Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} size="sm" className="w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/truyen/${s.slug}`} className="font-display text-lg font-bold hover:text-brand">{s.title}</Link>
                  <Pill on tone={VIS[s.visibility].tone}>{VIS[s.visibility].l}</Pill>
                  {s.pinned && <Pill on tone="brand"><Pin className="size-3" />Ghim</Pill>}
                  {s.featured && <Pill on tone="gold"><Star className="size-3" />Nổi bật</Pill>}
                  {s.rankBoost !== 0 && <Pill on tone="jade"><TrendingUp className="size-3" />{s.rankBoost > 0 ? '+' : ''}{s.rankBoost}</Pill>}
                </div>
                <div className="text-sm text-muted">{s.author.name}{s.author.verified && ' ✓'} · {s.genre} · {s._count.chapters} chương · {fmt(s.views)} lượt đọc · cập nhật {ago(s.updatedAt)}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.visibility === 'PENDING' && <Button size="sm" onClick={() => act(s.id, 'approve')}><Check />Duyệt</Button>}
                {s.visibility === 'PUBLISHED' ? <Button size="sm" variant="outline" onClick={() => act(s.id, 'hide')}><EyeOff />Ẩn</Button>
                  : s.visibility === 'HIDDEN' && <Button size="sm" variant="outline" onClick={() => act(s.id, 'publish')}><Eye />Hiện</Button>}
                <Button size="sm" variant={s.pinned ? 'soft' : 'ghost'} onClick={() => act(s.id, s.pinned ? 'unpin' : 'pin')}><Pin />{s.pinned ? 'Bỏ ghim' : 'Ghim'}</Button>
                <Button size="sm" variant={s.featured ? 'soft' : 'ghost'} onClick={() => act(s.id, s.featured ? 'unfeature' : 'feature')}><Sparkles />{s.featured ? 'Bỏ nổi bật' : 'Nổi bật'}</Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------- Homepage curation ---------------- */
function useStoriesPicker() {
  return useApi<any[]>('/admin/stories?visibility=PUBLISHED');
}

function Homepage() {
  const toast = useToast();
  const banners = useApi<any[]>('/admin/banners');
  const curations = useApi<any[]>('/admin/curations');
  const stories = useStoriesPicker();
  const byId = (id: string) => stories.data?.find((s) => s.id === id);
  const move = async (kind: 'banners' | 'curations', list: any[], i: number, d: number) => {
    const ids = list.map((x) => x.id); const j = i + d; if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await api(`/admin/${kind}-order`, { body: { ids } }); (kind === 'banners' ? banners : curations).reload();
  };
  const patch = async (kind: 'banners' | 'curations', id: string, body: any) => { await api(`/admin/${kind}/${id}`, { method: 'PATCH', body }); (kind === 'banners' ? banners : curations).reload(); };
  const del = async (kind: 'banners' | 'curations', id: string) => { if (!confirm('Xoá mục này?')) return; await api(`/admin/${kind}/${id}`, { method: 'DELETE' }); (kind === 'banners' ? banners : curations).reload(); toast('Đã xoá'); };
  const [nb, setNb] = React.useState({ title: '', kicker: '', subtitle: '', storyId: '', link: '', hue: 18 });
  const [nc, setNc] = React.useState({ title: '', subtitle: '', style: 'shelf' });
  return (
    <>
      <H title="Trang chủ & banner" sub="Sắp xếp carousel, mục tuyển chọn của biên tập viên; hẹn giờ bật/tắt.">
        <Button asChild variant="outline"><Link href="/" target="_blank"><Eye />Xem trang chủ</Link></Button>
      </H>
      <div className="space-y-6">
        <Panel title="Carousel banner" sub="Thứ tự hiển thị từ trên xuống. Banner hết hạn hoặc chưa tới giờ sẽ tự ẩn.">
          <div className="space-y-3">
            {(banners.data || []).map((b, i, arr) => {
              const st = scheduleLabel(b); const s = b.storyId ? byId(b.storyId) : null;
              return (
                <motion.div layout key={b.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-bg/60 p-3">
                  <div className="flex flex-col"><button aria-label="Lên" onClick={() => move('banners', arr, i, -1)} className="rounded p-0.5 hover:bg-bg-soft"><ArrowUp className="size-4" /></button><button aria-label="Xuống" onClick={() => move('banners', arr, i, 1)} className="rounded p-0.5 hover:bg-bg-soft"><ArrowDown className="size-4" /></button></div>
                  <div className="grid h-16 w-28 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, hsl(${b.hue} 70% 55%), hsl(${(b.hue + 40) % 360} 50% 22%))` }}>
                    {s ? <Cover title={s.title} seed={s.coverSeed} size="sm" className="w-9" /> : <ImageIcon className="size-5 text-white/80" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{b.title}</span><Pill on tone={st.tone}>{st.t}</Pill>{b.kicker && <span className="text-xs text-muted">· {b.kicker}</span>}</div>
                    <div className="truncate text-sm text-muted">{b.subtitle}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                      Từ <input type="datetime-local" defaultValue={toLocal(b.startsAt)} onBlur={(e) => patch('banners', b.id, { startsAt: fromLocal(e.target.value) })} className="rounded-lg border border-line bg-card px-2 py-1" />
                      đến <input type="datetime-local" defaultValue={toLocal(b.endsAt)} onBlur={(e) => patch('banners', b.id, { endsAt: fromLocal(e.target.value) })} className="rounded-lg border border-line bg-card px-2 py-1" />
                    </div>
                  </div>
                  <Switch on={b.active} onChange={(v) => patch('banners', b.id, { active: v })} label="Bật banner" />
                  <button aria-label="Xoá" onClick={() => del('banners', b.id)} className="rounded-full p-2 text-muted hover:bg-brand/10 hover:text-brand"><Trash2 className="size-4" /></button>
                </motion.div>
              );
            })}
          </div>
          <form className="mt-5 grid gap-3 rounded-2xl border border-dashed border-line p-4 md:grid-cols-6" onSubmit={async (e) => { e.preventDefault(); await api('/admin/banners', { body: nb }); setNb({ ...nb, title: '', subtitle: '', kicker: '' }); banners.reload(); toast('Đã thêm banner'); }}>
            <Input required placeholder="Tiêu đề" value={nb.title} onChange={(e) => setNb({ ...nb, title: e.target.value })} className="md:col-span-2" />
            <Input placeholder="Nhãn nhỏ (VD: Sự kiện)" value={nb.kicker} onChange={(e) => setNb({ ...nb, kicker: e.target.value })} />
            <Select value={nb.storyId} onChange={(e) => { const s = byId(e.target.value); setNb({ ...nb, storyId: e.target.value, title: nb.title || s?.title || '' }); }} className="md:col-span-2">
              <option value="">— Không gắn truyện (dùng link) —</option>
              {(stories.data || []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </Select>
            <div className="flex items-center gap-2"><input aria-label="Màu" type="range" min={0} max={360} value={nb.hue} onChange={(e) => setNb({ ...nb, hue: +e.target.value })} className="w-full accent-[var(--brand)]" /><span className="size-6 shrink-0 rounded-full" style={{ background: `hsl(${nb.hue} 70% 55%)` }} /></div>
            <Input placeholder="Mô tả ngắn" value={nb.subtitle} onChange={(e) => setNb({ ...nb, subtitle: e.target.value })} className="md:col-span-4" />
            <Input placeholder="Link (nếu không gắn truyện)" value={nb.link} onChange={(e) => setNb({ ...nb, link: e.target.value })} />
            <Button type="submit"><Plus />Thêm banner</Button>
          </form>
        </Panel>

        <Panel title="Mục tuyển chọn trên trang chủ" sub="“Biên tập viên chọn”, chủ đề theo mùa… Hiển thị theo thứ tự.">
          <div className="space-y-3">
            {(curations.data || []).map((c, i, arr) => {
              const st = scheduleLabel(c);
              return (
                <motion.div layout key={c.id} className="rounded-2xl border border-line bg-bg/60 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col"><button aria-label="Lên" onClick={() => move('curations', arr, i, -1)} className="rounded p-0.5 hover:bg-bg-soft"><ArrowUp className="size-4" /></button><button aria-label="Xuống" onClick={() => move('curations', arr, i, 1)} className="rounded p-0.5 hover:bg-bg-soft"><ArrowDown className="size-4" /></button></div>
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-display text-lg font-bold">{c.title}</span><Pill on tone={st.tone}>{st.t}</Pill></div><div className="text-sm text-muted">{c.subtitle}</div></div>
                    <Select value={c.style} onChange={(e) => patch('curations', c.id, { style: e.target.value })} className="h-9 w-36"><option value="shelf">Kệ sách</option><option value="spotlight">Tiêu điểm</option></Select>
                    <Switch on={c.active} onChange={(v) => patch('curations', c.id, { active: v })} label="Bật mục" />
                    <button aria-label="Xoá" onClick={() => del('curations', c.id)} className="rounded-full p-2 text-muted hover:bg-brand/10 hover:text-brand"><Trash2 className="size-4" /></button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {c.storyIds.map((id: string) => { const s = byId(id); return s && (
                      <span key={id} className="inline-flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-2 text-sm">
                        <Cover title={s.title} seed={s.coverSeed} size="sm" className="w-5 rounded" />{s.title}
                        <button aria-label="Bỏ" onClick={() => patch('curations', c.id, { storyIds: c.storyIds.filter((x: string) => x !== id) })}><X className="size-3.5 text-muted hover:text-brand" /></button>
                      </span>
                    ); })}
                    <Select value="" onChange={(e) => e.target.value && patch('curations', c.id, { storyIds: [...c.storyIds, e.target.value] })} className="h-9 w-48">
                      <option value="">+ Thêm truyện…</option>
                      {(stories.data || []).filter((s) => !c.storyIds.includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </Select>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <form className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-dashed border-line p-4" onSubmit={async (e) => { e.preventDefault(); await api('/admin/curations', { body: { ...nc, storyIds: [] } }); setNc({ title: '', subtitle: '', style: 'shelf' }); curations.reload(); toast('Đã thêm mục'); }}>
            <Input required placeholder="Tên mục (VD: Đọc trong mùa mưa)" value={nc.title} onChange={(e) => setNc({ ...nc, title: e.target.value })} className="max-w-xs" />
            <Input placeholder="Mô tả" value={nc.subtitle} onChange={(e) => setNc({ ...nc, subtitle: e.target.value })} className="max-w-sm" />
            <Button type="submit"><Plus />Thêm mục</Button>
          </form>
        </Panel>
      </div>
    </>
  );
}

/* ---------------- Rankings overrides ---------------- */
function Rankings() {
  const [by, setBy] = React.useState('week');
  const r = useApi<any[]>(`/discover/rankings?by=${by}`);
  const boost = async (id: string, value: number) => { await api(`/admin/stories/${id}`, { body: { action: 'boost', value } }); r.reload(); };
  return (
    <>
      <H title="Xếp hạng" sub="Xem trước bảng xếp hạng công khai và điều chỉnh ưu tiên (−10 … +10). Mọi thay đổi đều ghi nhật ký." />
      <div className="mb-5 flex flex-wrap gap-2">{[['week', 'Thịnh hành tuần'], ['views', 'Lượt đọc'], ['likes', 'Yêu thích'], ['rating', 'Điểm cao'], ['library', 'Lưu nhiều']].map(([k, l]) => <Pill key={k} on={by === k} onClick={() => setBy(k)}>{l}</Pill>)}</div>
      <Panel>
        {!r.data ? <Skeleton className="h-60" /> : (
          <motion.ol layout className="divide-y divide-line">
            {r.data.map((s, i) => (
              <motion.li layout key={s.id} className="flex items-center gap-4 py-3">
                <span className={cn('w-8 text-center font-display text-2xl font-black italic', i < 3 ? 'text-brand' : 'text-muted/60')}>{i + 1}</span>
                <Cover title={s.title} seed={s.coverSeed} size="sm" className="w-9" />
                <div className="min-w-0 flex-1"><div className="truncate font-semibold">{s.title}</div><div className="text-xs text-muted">{s.author.name} · {fmt(s.views)} lượt đọc · {s._count.likes} thích</div></div>
                <div className="flex items-center gap-1">
                  <button aria-label="Giảm" onClick={() => boost(s.id, (s.rankBoost || 0) - 1)} className="grid size-8 place-items-center rounded-full border border-line hover:border-brand"><ArrowDown className="size-4" /></button>
                  <span className={cn('w-10 text-center font-mono text-sm font-bold', s.rankBoost > 0 ? 'text-jade' : s.rankBoost < 0 ? 'text-brand' : 'text-muted')}>{s.rankBoost > 0 ? '+' : ''}{s.rankBoost || 0}</span>
                  <button aria-label="Tăng" onClick={() => boost(s.id, (s.rankBoost || 0) + 1)} className="grid size-8 place-items-center rounded-full border border-line hover:border-jade"><ArrowUp className="size-4" /></button>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </Panel>
    </>
  );
}

/* ---------------- Categories & tags ---------------- */
function Taxonomy() {
  const toast = useToast();
  const d = useApi<any>('/admin/categories');
  const [name, setName] = React.useState('');
  const [tag, setTag] = React.useState({ from: '', to: '' });
  const patch = async (id: string, body: any) => { await api(`/admin/categories/${id}`, { method: 'PATCH', body }); d.reload(); };
  return (
    <>
      <H title="Thể loại & thẻ" sub="Thể loại xuất hiện ở trang chủ, bộ lọc và studio tác giả." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Thể loại" action={<form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); try { await api('/admin/categories', { body: { name } }); setName(''); d.reload(); } catch (er: any) { toast(er.message, true); } }}><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Thể loại mới" className="h-9 w-44" /><Button size="sm" type="submit"><Plus />Thêm</Button></form>}>
          <div className="divide-y divide-line">
            {(d.data?.categories || []).map((c: any, i: number, arr: any[]) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="flex"><button aria-label="Lên" disabled={!i} onClick={() => patch(c.id, { position: arr[i - 1].position - 1 })} className="rounded p-1 hover:bg-bg-soft disabled:opacity-30"><ArrowUp className="size-3.5" /></button></div>
                <input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && patch(c.id, { name: e.target.value }).then(() => toast('Đã đổi tên & cập nhật truyện'))} className="flex-1 rounded-lg bg-transparent px-2 py-1 font-medium outline-none focus:bg-bg-soft" />
                <span className="text-xs text-muted">{c.stories} truyện</span>
                <Switch on={c.active} onChange={(v) => patch(c.id, { active: v })} label="Hiển thị" />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Thẻ (tag)" sub="Gộp thẻ trùng nghĩa hoặc xoá thẻ rác trên toàn bộ truyện.">
          <form className="mb-4 flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); const r = await api('/admin/tags', { body: tag }); toast(`Đã cập nhật ${r.stories} truyện`); setTag({ from: '', to: '' }); d.reload(); }}>
            <Input required value={tag.from} onChange={(e) => setTag({ ...tag, from: e.target.value })} placeholder="Thẻ cũ" className="h-9 w-36" />
            <Input value={tag.to} onChange={(e) => setTag({ ...tag, to: e.target.value })} placeholder="Gộp vào (trống = xoá)" className="h-9 w-48" />
            <Button size="sm" type="submit" variant={tag.to ? 'default' : 'outline'}>{tag.to ? 'Gộp thẻ' : 'Xoá thẻ'}</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {(d.data?.tags || []).map((t: any) => <button key={t.tag} onClick={() => setTag({ ...tag, from: t.tag })}><Badge className="hover:border-brand hover:text-brand">#{t.tag} <span className="opacity-60">{t.n}</span></Badge></button>)}
          </div>
        </Panel>
      </div>
    </>
  );
}

/* ---------------- Users ---------------- */
function UsersSec() {
  const toast = useToast();
  const [q, setQ] = React.useState('');
  const users = useApi<any[]>(`/admin/users?q=${encodeURIComponent(q)}`);
  const upd = async (u: any, body: any) => { try { await api(`/admin/users/${u.id}`, { body }); users.reload(); } catch (e: any) { toast(e.message, true); } };
  return (
    <>
      <H title="Người dùng" sub="Phân quyền, xác minh tác giả, khoá tài khoản vi phạm."><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm username hoặc email…" className="h-10 w-72" /></H>
      <div className="sheet overflow-x-auto rounded-3xl">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted"><tr className="border-b border-line"><th className="px-5 py-3">Người dùng</th><th>Vai trò</th><th>Truyện</th><th>Xu</th><th>Thu nhập</th><th>Tham gia</th><th className="pr-5 text-right">Hành động</th></tr></thead>
          <tbody className="divide-y divide-line">
            {(users.data || []).map((u) => (
              <tr key={u.id} className={cn(u.banned && 'opacity-60')}>
                <td className="px-5 py-3"><div className="flex items-center gap-1.5 font-semibold">{u.name}{u.verified && <BadgeCheck className="size-4 text-jade" />}{u.banned && <Badge className="border-brand/40 text-brand">Đã khoá</Badge>}</div><div className="text-xs text-muted">@{u.username} · {u.email}</div></td>
                <td><Select value={u.role} onChange={(e) => upd(u, { role: e.target.value })} className="h-8 w-32 rounded-xl px-2 text-xs"><option value="READER">Độc giả</option><option value="AUTHOR">Tác giả</option><option value="ADMIN">Quản trị</option></Select></td>
                <td>{u._count.stories}</td><td>{fmt(u.coins)}</td><td>{fmt(u.earnings)}</td><td className="text-muted">{ago(u.createdAt)}</td>
                <td className="pr-5 text-right">
                  <div className="inline-flex gap-1">
                    {u.role !== 'READER' && <Button size="sm" variant={u.verified ? 'soft' : 'ghost'} onClick={() => upd(u, { verified: !u.verified })}><BadgeCheck />{u.verified ? 'Bỏ xác minh' : 'Xác minh'}</Button>}
                    {u.role !== 'ADMIN' && <Button size="sm" variant={u.banned ? 'outline' : 'ghost'} onClick={() => upd(u, { banned: !u.banned })}><Ban />{u.banned ? 'Mở khoá' : 'Khoá'}</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------------- Reports ---------------- */
const TT: Record<string, string> = { story: 'Truyện', chapter: 'Chương', comment: 'Bình luận', review: 'Đánh giá', user: 'Người dùng' };
function Reports({ onChange }: { onChange: () => void }) {
  const toast = useToast();
  const [status, setStatus] = React.useState('OPEN');
  const reports = useApi<any[]>(`/admin/reports?status=${status}`);
  const act = async (id: string, action: string) => { await api(`/admin/reports/${id}`, { body: { action } }); toast('Đã xử lý báo cáo'); reports.reload(); onChange(); };
  return (
    <>
      <H title="Báo cáo vi phạm" sub="Hàng đợi kiểm duyệt từ cộng đồng." />
      <div className="mb-4 flex gap-2">{[['OPEN', 'Đang mở'], ['RESOLVED', 'Đã xử lý'], ['DISMISSED', 'Bỏ qua']].map(([k, l]) => <Pill key={k} on={status === k} onClick={() => setStatus(k)}>{l}</Pill>)}</div>
      {!reports.data ? <Skeleton className="h-40" /> : !reports.data.length ? <Empty icon={<Check />} title="Không có báo cáo nào" hint="Cộng đồng đang rất ngoan 🌿" /> : (
        <div className="space-y-3">
          {reports.data.map((r) => (
            <div key={r.id} className="sheet flex flex-wrap items-start gap-4 rounded-3xl p-5">
              <div className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand"><Flag className="size-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><Badge>{TT[r.targetType]}</Badge><span className="font-semibold">{r.reason}</span><span className="text-xs text-muted">bởi @{r.reporter.username} · {ago(r.createdAt)}</span></div>
                {r.detail && <p className="mt-1 text-sm text-muted">{r.detail}</p>}
                <div className="mt-3 rounded-2xl bg-bg-soft p-3 text-sm">
                  {r.target ? (r.target.body ? <>“{r.target.body}” <span className="text-xs text-muted">— @{r.target.user?.username}{r.target.hidden && ' · đã ẩn'}</span></>
                    : r.target.title ? <Link href={`/truyen/${r.target.slug || r.target.story?.slug}`} className="font-semibold text-brand hover:underline">{r.target.story?.title ? `${r.target.story.title} · ` : ''}{r.target.title}</Link>
                    : <>@{r.target.username}</>) : <span className="text-muted">Đối tượng đã bị xoá</span>}
                </div>
              </div>
              {r.status === 'OPEN' && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => act(r.id, 'dismiss')}><X />Bỏ qua</Button>
                  <Button size="sm" variant="soft" onClick={() => act(r.id, 'hide')}><EyeOff />Ẩn nội dung</Button>
                  <Button size="sm" onClick={() => act(r.id, 'ban')}><Ban />Khoá tài khoản</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------- Payouts ---------------- */
function Payouts({ onChange }: { onChange: () => void }) {
  const toast = useToast();
  const payouts = useApi<any[]>('/admin/payouts');
  const pay = async (id: string, action: string) => { try { await api(`/admin/payouts/${id}`, { body: { action } }); toast(action === 'approve' ? 'Đã duyệt chi trả' : 'Đã từ chối & hoàn xu'); payouts.reload(); onChange(); } catch (e: any) { toast(e.message, true); } };
  return (
    <>
      <H title="Chi trả tác giả" sub="Duyệt yêu cầu rút thu nhập. Từ chối sẽ hoàn xu vào ví thu nhập." />
      <div className="sheet divide-y divide-line overflow-hidden rounded-3xl">
        {(payouts.data || []).map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <div className="grid size-10 place-items-center rounded-full bg-gold/15 text-gold"><Wallet className="size-4" /></div>
            <div className="min-w-0 flex-1"><div className="font-semibold">{p.user.name} <span className="text-sm font-normal text-muted">@{p.user.username}</span></div><div className="text-sm text-muted">{p.coins} xu · <b className="text-fg">{vnd(p.amountVnd)}</b> · {p.method.toUpperCase()} {p.account} · {ago(p.createdAt)}</div></div>
            {p.status === 'PENDING' ? <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => pay(p.id, 'reject')}>Từ chối</Button><Button size="sm" onClick={() => pay(p.id, 'approve')}><Check />Đã chuyển khoản</Button></div> : <Pill on tone={p.status === 'PAID' ? 'jade' : 'muted'}>{p.status === 'PAID' ? 'Đã chi' : 'Từ chối'}</Pill>}
          </div>
        ))}
        {payouts.data && !payouts.data.length && <div className="p-8 text-center text-sm text-muted">Không có yêu cầu</div>}
      </div>
    </>
  );
}

/* ---------------- Coin packages ---------------- */
function Packages() {
  const toast = useToast();
  const list = useApi<any[]>('/admin/packages');
  const empty = { id: '', coins: 100, bonus: 0, vnd: 10000, label: '', promoBonus: 0, promoUntil: '', active: true, position: 0 };
  const [edit, setEdit] = React.useState<any | null>(null);
  const save = async (p: any) => { try { await api('/admin/packages', { body: { ...p, promoUntil: p.promoUntil ? fromLocal(p.promoUntil) : null } }); toast('Đã lưu gói xu'); setEdit(null); list.reload(); } catch (e: any) { toast(e.message, true); } };
  return (
    <>
      <H title="Gói xu & khuyến mãi" sub="Giá hiển thị trên web; bản mobile phát hành trên store phải dùng IAP."><Button onClick={() => setEdit({ ...empty, position: list.data?.length || 0 })}><Plus />Gói mới</Button></H>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(list.data || []).map((p, i) => {
          const promo = p.promoBonus > 0 && (!p.promoUntil || new Date(p.promoUntil) > new Date());
          return (
            <motion.button key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setEdit({ ...p, promoUntil: toLocal(p.promoUntil) })}
              className={cn('sheet relative overflow-hidden rounded-3xl p-5 text-left transition hover:-translate-y-1', !p.active && 'opacity-50')}>
              {promo && <span className="absolute right-3 top-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase text-white">KM +{p.promoBonus}</span>}
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">{p.id} {p.label && `· ${p.label}`}</div>
              <div className="mt-2 flex items-baseline gap-1 font-display text-4xl font-black text-gold">{p.coins}<span className="text-base font-semibold text-muted">xu</span></div>
              <div className="text-sm text-muted">+{p.bonus} thưởng{promo && <> · <b className="text-brand">+{p.promoBonus} KM</b> đến {p.promoUntil ? new Date(p.promoUntil).toLocaleDateString('vi-VN') : '∞'}</>}</div>
              <div className="mt-3 font-semibold">{vnd(p.vnd)}</div>
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {edit && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEdit(null)}>
            <motion.form initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); save(edit); }} className="sheet grid w-full max-w-lg gap-3 rounded-3xl p-6 sm:grid-cols-2">
              <h3 className="font-display text-2xl font-bold sm:col-span-2">Gói xu</h3>
              {[['id', 'Mã gói'], ['label', 'Nhãn (VD: Hời nhất)'], ['coins', 'Số xu'], ['bonus', 'Thưởng cố định'], ['vnd', 'Giá (VND)'], ['promoBonus', 'Thưởng khuyến mãi']].map(([k, l]) => (
                <label key={k} className="text-xs font-semibold uppercase tracking-wider text-muted">{l}<Input value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} className="mt-1 normal-case" /></label>
              ))}
              <label className="text-xs font-semibold uppercase tracking-wider text-muted sm:col-span-2">Khuyến mãi đến<Input type="datetime-local" value={edit.promoUntil || ''} onChange={(e) => setEdit({ ...edit, promoUntil: e.target.value })} className="mt-1" /></label>
              <div className="flex items-center gap-3 sm:col-span-2"><Switch on={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} /> Đang bán</div>
              <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={() => setEdit(null)}>Huỷ</Button><Button type="submit">Lưu</Button></div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------- Announcements ---------------- */
function Announcements() {
  const toast = useToast();
  const list = useApi<any[]>('/admin/announcements');
  const [f, setF] = React.useState({ title: '', body: '', link: '', audience: 'ALL' });
  return (
    <>
      <H title="Thông báo hệ thống" sub="Gửi thông báo trong ứng dụng tới toàn bộ hoặc một nhóm người dùng." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel title="Soạn thông báo">
          <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); if (!confirm('Gửi thông báo này?')) return; const r = await api('/admin/announcements', { body: f }); toast(`Đã gửi tới ${r.recipients} người`); setF({ title: '', body: '', link: '', audience: 'ALL' }); list.reload(); }}>
            <Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Tiêu đề" />
            <Textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Nội dung" />
            <Input value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="Đường dẫn (tuỳ chọn), VD /kham-pha" />
            <div className="flex flex-wrap gap-2">{[['ALL', 'Tất cả'], ['READER', 'Độc giả'], ['AUTHOR', 'Tác giả']].map(([k, l]) => <Pill key={k} on={f.audience === k} onClick={() => setF({ ...f, audience: k })}>{l}</Pill>)}</div>
            <Button type="submit"><Megaphone />Gửi thông báo</Button>
          </form>
        </Panel>
        <Panel title="Đã gửi">
          <div className="space-y-3">
            {(list.data || []).map((a) => (
              <div key={a.id} className="rounded-2xl border border-line p-4">
                <div className="flex items-center justify-between gap-2"><span className="font-semibold">{a.title}</span><Pill on tone="jade">{a.recipients} người</Pill></div>
                {a.body && <p className="mt-1 text-sm text-muted">{a.body}</p>}
                <div className="mt-2 text-xs text-muted">{a.audience === 'ALL' ? 'Tất cả' : a.audience === 'READER' ? 'Độc giả' : 'Tác giả'} · {ago(a.createdAt)}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

/* ---------------- Audit log ---------------- */
const ACT: Record<string, string> = {
  'story.approve': 'duyệt truyện', 'story.hide': 'ẩn truyện', 'story.publish': 'hiện truyện', 'story.pin': 'ghim truyện', 'story.unpin': 'bỏ ghim', 'story.feature': 'đưa vào nổi bật',
  'story.unfeature': 'bỏ nổi bật', 'story.boost': 'chỉnh ưu tiên xếp hạng', 'banner.create': 'tạo banner', 'banner.update': 'sửa banner', 'banner.delete': 'xoá banner', 'banner.reorder': 'sắp xếp banner',
  'curation.create': 'tạo mục tuyển chọn', 'curation.update': 'sửa mục tuyển chọn', 'curation.delete': 'xoá mục tuyển chọn', 'curation.reorder': 'sắp xếp mục tuyển chọn',
  'category.create': 'thêm thể loại', 'category.update': 'sửa thể loại', 'tag.merge': 'gộp thẻ', 'tag.delete': 'xoá thẻ', 'package.upsert': 'lưu gói xu',
  'announcement.send': 'gửi thông báo', 'user.update': 'cập nhật người dùng', 'payout.approve': 'duyệt chi trả', 'payout.reject': 'từ chối chi trả',
  'report.dismiss': 'bỏ qua báo cáo', 'report.hide': 'ẩn nội dung bị báo cáo', 'report.ban': 'khoá tài khoản vi phạm',
};
function Audit() {
  const [q, setQ] = React.useState('');
  const log = useApi<any[]>(`/admin/audit?q=${encodeURIComponent(q)}`);
  return (
    <>
      <H title="Nhật ký quản trị" sub="Mọi thao tác của quản trị viên đều được ghi lại."><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lọc theo hành động, người, đối tượng…" className="h-10 w-72" /></H>
      <Panel>
        <ol className="relative space-y-4 border-l-2 border-dashed border-line pl-6">
          {(log.data || []).map((l) => (
            <li key={l.id} className="relative">
              <span className="absolute -left-[33px] top-1 grid size-4 place-items-center rounded-full border-2 border-card bg-brand" />
              <div className="text-sm"><b>@{l.actor}</b> {ACT[l.action] || l.action} {l.target && <span className="font-semibold text-brand">“{l.target}”</span>}</div>
              <div className="text-xs text-muted">{new Date(l.createdAt).toLocaleString('vi-VN')} · <code className="rounded bg-bg-soft px-1">{l.action}</code></div>
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}

export default function P() { return <RequireAuth role="ADMIN"><Admin /></RequireAuth>; }

