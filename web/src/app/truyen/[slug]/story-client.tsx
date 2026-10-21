'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Burst, Tilt } from '@/components/motion';
import { BookmarkPlus, BookmarkCheck, Clock, Coins, Gift, Heart, Lock, ListPlus, Star, Unlock, UserPlus, UserCheck, Play } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AGE_LABEL, STATUS_LABEL, ago, cn, fmt } from '@/lib/utils';
import { Cover } from '@/components/cover';
import { Button } from '@/components/ui/button';
import { Badge, Card, SectionTitle, Textarea, Input, Empty } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { StoryCard } from '@/components/story-card';
import { useToast } from '@/components/toast';
import { ReportButton } from '@/components/report';

export function StoryClient({ initial, recs }: { initial: any; recs: any[] }) {
  const { me, refresh } = useAuth();
  const toast = useToast();
  const [s, setS] = useState(initial);
  const [tip, setTip] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  useEffect(() => { if (me) api(`/stories/${initial.slug}`).then(setS).catch(() => {}); }, [me, initial.slug]);
  const mine = s.mine;
  const unlocked = new Set<string>(mine?.unlocked || []);
  const need = () => { if (!me) { location.href = `/dang-nhap?next=/truyen/${s.slug}`; return true; } return false; };

  const toggleLib = async () => {
    if (need()) return;
    const r = await api(`/me/library/${s.id}`, { method: mine?.inLibrary ? 'DELETE' : 'POST' });
    setS({ ...s, mine: { ...mine, inLibrary: r.inLibrary } });
    toast(r.inLibrary ? 'Đã thêm vào tủ sách' : 'Đã bỏ khỏi tủ sách');
  };
  const [burst, setBurst] = useState(false);
  const like = async () => {
    if (need()) return;
    const r = await api(`/stories/${s.id}/like`, { method: 'POST' });
    setS({ ...s, _count: { ...s._count, likes: s._count.likes + (r.liked ? 1 : -1) }, mine: { ...mine, liked: r.liked } });
    if (r.liked) { setBurst(true); setTimeout(() => setBurst(false), 900); }
  };
  const follow = async () => {
    if (need()) return;
    const r = await api(`/users/${s.author.username}/follow`, { method: mine?.followingAuthor ? 'DELETE' : 'POST' });
    setS({ ...s, authorFollowers: s.authorFollowers + (r.following ? 1 : -1), mine: { ...mine, followingAuthor: r.following } });
  };
  const cont = mine?.progress ? mine.progress.chapterNo : 1;
  const totalWords = s.chapters.reduce((a: number, c: any) => a + c.wordCount, 0);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 opacity-30 blur-3xl" style={{ background: `radial-gradient(circle at 20% 30%, var(--brand), transparent 50%), radial-gradient(circle at 80% 70%, var(--gold), transparent 50%)` }} />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-[260px_1fr] md:py-16">
          <div className="fade-up mx-auto w-52 md:w-full"><Tilt max={10}><Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} genre={s.genre} author={s.author.name} size="lg" /></Tilt></div>
          <div className="fade-up">
            <div className="flex flex-wrap gap-2">
              <Badge className="border-brand/30 bg-brand-soft text-brand">{s.genre}</Badge>
              <Badge>{STATUS_LABEL[s.status]}</Badge>
              <Badge>{AGE_LABEL[s.ageRating]}</Badge>
              {s.waitFreeHours && <Badge className="border-gold/40 text-gold"><Clock className="size-3" />Chờ {s.waitFreeHours}h miễn phí</Badge>}
            </div>
            <h1 className="mt-4 font-display text-[42px] font-black leading-[1.05] tracking-tight md:text-[58px]">{s.title}</h1>
            <Link href={`/u/${s.author.username}`} className="mt-3 inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
              <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-brand to-gold text-xs font-bold text-white">{s.author.name[0]}</span>
              {s.author.name} · {fmt(s.authorFollowers)} người theo dõi
            </Link>
            <div className="mt-6 grid max-w-xl grid-cols-4 gap-2">
              {[
                { v: fmt(s.views), l: 'lượt đọc' }, { v: fmt(s._count.likes), l: 'yêu thích' },
                { v: s.rating.count ? s.rating.avg.toFixed(1) : '—', l: `${s.rating.count} đánh giá` }, { v: s.chapters.length, l: `${fmt(totalWords)} chữ` },
              ].map((x) => (
                <div key={x.l} className="rounded-2xl border border-line bg-card/70 p-3 text-center backdrop-blur">
                  <div className="font-serif text-xl font-bold">{x.v}</div><div className="text-[11px] text-muted">{x.l}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-2xl whitespace-pre-line font-serif text-[17px] leading-relaxed text-fg/85">{s.synopsis}</p>
            <div className="mt-4 flex flex-wrap gap-2">{s.tags.map((t: string) => <Link key={t} href={`/kham-pha?tag=${encodeURIComponent(t)}`}><Badge className="hover:border-brand hover:text-brand">#{t}</Badge></Link>)}</div>
            <div className="mt-8 flex flex-wrap gap-3">
              {s.chapters.length > 0 && <Button size="lg" asChild><Link href={`/truyen/${s.slug}/${cont}`}><Play className="fill-current" />{mine?.progress ? `Đọc tiếp chương ${cont}` : 'Đọc từ đầu'}</Link></Button>}
              <Button size="lg" variant="outline" onClick={toggleLib}>{mine?.inLibrary ? <><BookmarkCheck className="text-brand" />Trong tủ sách</> : <><BookmarkPlus />Thêm vào tủ</>}</Button>
              <span className="relative inline-flex"><Button size="icon" variant="outline" onClick={like} aria-label="Yêu thích" className="size-12"><Heart className={cn('transition-transform', mine?.liked && 'scale-110 fill-brand text-brand')} /></Button><Burst show={burst} /></span>
              <Button size="icon" variant="outline" onClick={() => !need() && setListOpen(true)} aria-label="Thêm vào danh sách" className="size-12"><ListPlus /></Button>
              {!mine?.isAuthor && <Button size="lg" variant="gold" onClick={() => !need() && setTip(true)}><Gift />Ủng hộ</Button>}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-12 lg:grid-cols-[1fr_300px]">
        <Tabs defaultValue="toc">
          <TabsList>
            <TabsTrigger value="toc">Mục lục · {s.chapters.length}</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá · {s.rating.count}</TabsTrigger>
          </TabsList>
          <TabsContent value="toc">
            <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
              {s.chapters.map((c: any) => {
                const open = c.price === 0 || unlocked.has(c.id) || mine?.isAuthor;
                return (
                  <Link key={c.id} href={`/truyen/${s.slug}/${c.number}`} className={cn('group flex items-center gap-4 px-5 py-4 transition hover:bg-bg-soft', mine?.progress?.chapterNo === c.number && 'bg-brand-soft/50')}>
                    <span className="w-10 font-serif text-lg font-bold text-muted/60">{String(c.number).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 font-medium group-hover:text-brand">{c.title}</div>
                      <div className="text-xs text-muted">{ago(c.publishedAt)} · {fmt(c.wordCount)} chữ · {fmt(c.views)} lượt đọc</div>
                    </div>
                    {c.price > 0 ? (
                      open ? <Badge className="border-emerald-500/30 text-emerald-600"><Unlock className="size-3" />Đã mở</Badge>
                        : <Badge className="border-gold/40 text-gold"><Lock className="size-3" />{c.price} xu</Badge>
                    ) : <Badge>Miễn phí</Badge>}
                  </Link>
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="reviews"><Reviews story={s} onDone={() => api(`/stories/${s.slug}`).then(setS)} /></TabsContent>
        </Tabs>

        <aside className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-brand to-gold text-lg font-bold text-white">{s.author.name[0]}</div>
              <div><Link href={`/u/${s.author.username}`} className="font-semibold hover:text-brand">{s.author.name}</Link><div className="text-xs text-muted">@{s.author.username}</div></div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{s.author.bio || 'Tác giả chưa viết giới thiệu.'}</p>
            {!mine?.isAuthor && <Button variant={mine?.followingAuthor ? 'outline' : 'ink'} className="mt-5 w-full" onClick={follow}>{mine?.followingAuthor ? <><UserCheck />Đang theo dõi</> : <><UserPlus />Theo dõi tác giả</>}</Button>}
          </Card>
          <div className="flex justify-end"><ReportButton type="story" id={s.id} /></div>
        </aside>
      </div>

      {recs.length > 0 && (
        <section className="mx-auto max-w-6xl px-6">
          <SectionTitle kicker="Gợi ý" title="Có thể bạn cũng thích" />
          <div className="stagger grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-6">{recs.slice(0, 6).map((r) => <StoryCard key={r.id} s={r} />)}</div>
        </section>
      )}

      <TipDialog open={tip} onOpenChange={setTip} story={s} onDone={refresh} />
      <ListDialog open={listOpen} onOpenChange={setListOpen} storyId={s.id} />
    </div>
  );
}

function Stars({ value, onChange, size = 5 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onChange} onClick={() => onChange?.(i)} className="transition hover:scale-110 disabled:hover:scale-100">
          <Star className={cn(i <= value ? 'fill-gold text-gold' : 'text-line')} style={{ width: size * 4, height: size * 4 }} />
        </button>
      ))}
    </div>
  );
}

function Reviews({ story, onDone }: { story: any; onDone: () => void }) {
  const { me } = useAuth();
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const submit = async () => {
    try { await api(`/stories/${story.id}/reviews`, { body: { rating, body } }); toast('Cảm ơn bạn đã đánh giá!'); setBody(''); onDone(); }
    catch (e: any) { toast(e.message, true); }
  };
  return (
    <div className="space-y-4">
      {me && !story.mine?.isAuthor && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><div className="font-semibold">Đánh giá của bạn</div><Stars value={rating} onChange={setRating} /></div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Bạn thấy truyện thế nào? (chỉ người đã đọc mới đánh giá được)" />
          <div className="mt-3 flex justify-end"><Button onClick={submit}>Gửi đánh giá</Button></div>
        </Card>
      )}
      {story.reviews.length === 0 ? <Empty icon={<Star />} title="Chưa có đánh giá" hint="Hãy là người đầu tiên chia sẻ cảm nhận." /> : story.reviews.map((r: any) => (
        <div key={r.id} className="rounded-3xl border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <Link href={`/u/${r.user.username}`} className="flex items-center gap-2 font-semibold hover:text-brand">
              <span className="grid size-8 place-items-center rounded-full bg-bg-soft text-sm">{r.user.name[0]}</span>{r.user.name}
            </Link>
            <Stars value={r.rating} size={3.5} />
          </div>
          <p className="mt-3 font-serif leading-relaxed text-fg/85">{r.body}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted">{ago(r.createdAt)}<ReportButton type="review" id={r.id} small /></div>
        </div>
      ))}
    </div>
  );
}

function TipDialog({ open, onOpenChange, story, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; story: any; onDone: () => void }) {
  const { me } = useAuth();
  const toast = useToast();
  const [coins, setCoins] = useState(20);
  const [msg, setMsg] = useState('');
  const send = async () => {
    try { await api(`/wallet/tip/${story.id}`, { body: { coins, message: msg } }); toast(`Đã ủng hộ ${coins} xu cho ${story.author.name} 💛`); onOpenChange(false); onDone(); }
    catch (e: any) { toast(e.message, true); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={`Ủng hộ ${story.author.name}`}>
      <p className="text-sm text-muted">Tác giả nhận 90% số xu bạn gửi. Số dư: <b className="text-gold">{me?.coins ?? 0} xu</b></p>
      <div className="mt-5 grid grid-cols-4 gap-2">
        {[10, 20, 50, 100].map((v) => (
          <button key={v} onClick={() => setCoins(v)} className={cn('rounded-2xl border py-4 font-bold transition', coins === v ? 'border-gold bg-gold/10 text-gold' : 'border-line hover:border-gold')}>
            <Coins className="mx-auto mb-1 size-5" />{v}
          </button>
        ))}
      </div>
      <Input className="mt-4" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Lời nhắn cho tác giả (không bắt buộc)" />
      <Button variant="gold" size="lg" className="mt-5 w-full" onClick={send}><Gift />Gửi {coins} xu</Button>
      {(me?.coins ?? 0) < coins && <Link href="/vi" className="mt-3 block text-center text-sm font-semibold text-brand">Nạp thêm xu →</Link>}
    </Dialog>
  );
}

function ListDialog({ open, onOpenChange, storyId }: { open: boolean; onOpenChange: (o: boolean) => void; storyId: string }) {
  const toast = useToast();
  const [lists, setLists] = useState<any[]>([]);
  const [name, setName] = useState('');
  useEffect(() => { if (open) api('/me/lists').then(setLists).catch(() => {}); }, [open]);
  const add = async (id: string) => { await api(`/lists/${id}/items/${storyId}`, { method: 'POST' }); toast('Đã thêm vào danh sách'); onOpenChange(false); };
  const create = async () => { const l = await api('/lists', { body: { name } }); await add(l.id); setName(''); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Thêm vào danh sách đọc">
      <div className="space-y-2">
        {lists.map((l) => (
          <button key={l.id} onClick={() => add(l.id)} className="flex w-full items-center justify-between rounded-2xl border border-line px-4 py-3 text-left hover:border-brand">
            <span className="font-medium">{l.name}</span><span className="text-xs text-muted">{l.items.length} truyện</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên danh sách mới…" /><Button onClick={create} disabled={!name}>Tạo</Button></div>
    </Dialog>
  );
}
