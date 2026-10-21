'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Burst, CoinCelebration, PageTurn } from '@/components/motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Coins, Heart, Lock, MessageCircle, Minus, Plus, Settings2, Sparkles, Timer, Type } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ago, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Textarea, Skeleton } from '@/components/ui/misc';
import { useToast } from '@/components/toast';

type Theme = 'light' | 'sepia' | 'dark';
interface Prefs { theme: Theme; size: number; leading: number; font: 'serif' | 'sans'; width: number }
const DEFAULT: Prefs = { theme: 'light', size: 19, leading: 1.85, font: 'serif', width: 680 };

function usePrefs() {
  const [p, setP] = useState<Prefs>(DEFAULT);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('muc_reader') || 'null');
      setP(saved ? { ...DEFAULT, ...saved } : { ...DEFAULT, theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
    } catch { /* ignore */ }
  }, []);
  const set = (x: Partial<Prefs>) => setP((o) => { const n = { ...o, ...x }; localStorage.setItem('muc_reader', JSON.stringify(n)); return n; });
  return [p, set] as const;
}

function Countdown({ to }: { to: string }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const s = Math.max(0, Math.floor((new Date(to).getTime() - Date.now()) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return <span className="font-mono tabular-nums">{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(sec).padStart(2, '0')}</span>;
}

export function Reader({ slug, n }: { slug: string; n: number }) {
  const { me, ready, refresh } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [prefs, setPrefs] = usePrefs();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [panel, setPanel] = useState(false);
  const [para, setPara] = useState<number | null | 'chapter'>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [hearts, setHearts] = useState(false);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const readId = useRef<string | null>(null);
  const maxSeen = useRef(0);

  const load = useCallback(async () => {
    try { setData(await api(`/stories/${slug}/chapters/${n}`)); setErr(null); } catch (e: any) { setErr(e.message); }
  }, [slug, n]);
  useEffect(() => { if (ready) { setData(null); readId.current = null; maxSeen.current = 0; load(); window.scrollTo(0, 0); } }, [ready, load]);

  // Analytics beacon + progress sync while reading
  useEffect(() => {
    if (!data?.access.canRead) return;
    const chapterId = data.chapter.id;
    const send = async () => {
      try {
        const r = await api('/reads', { body: { chapterId, maxParagraph: maxSeen.current, readId: readId.current } });
        readId.current = r.readId;
        if (me) await api('/me/progress', { body: { chapterId, paragraph: maxSeen.current } });
      } catch { /* offline */ }
    };
    send();
    const els = document.querySelectorAll('[data-p]');
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) maxSeen.current = Math.max(maxSeen.current, Number((e.target as HTMLElement).dataset.p));
    }), { rootMargin: '0px 0px -30% 0px' });
    els.forEach((e) => io.observe(e));
    const t = setInterval(send, 15000);
    const onScroll = () => {
      const h = document.documentElement;
      setProgress(Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { io.disconnect(); clearInterval(t); window.removeEventListener('scroll', onScroll); send(); };
  }, [data, me]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName.match(/INPUT|TEXTAREA/)) return;
      if (e.key === 'ArrowRight' && data?.next) router.push(`/truyen/${slug}/${data.next.number}`);
      if (e.key === 'ArrowLeft' && data?.prev) router.push(`/truyen/${slug}/${data.prev.number}`);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [data, slug, router]);

  const unlock = async (mode: 'buy' | 'rent' | 'wait') => {
    if (!me) { router.push(`/dang-nhap?next=/truyen/${slug}/${n}`); return; }
    setBusy(true);
    try {
      await api(`/wallet/unlock/${data.chapter.id}`, { body: { mode } });
      setCelebrate(mode === 'wait' ? 'Đã dùng vé chờ miễn phí' : mode === 'rent' ? 'Đã thuê chương 48 giờ' : 'Đã mở khoá vĩnh viễn');
      await Promise.all([load(), refresh()]);
    } catch (e: any) { toast(e.message, true); }
    setBusy(false);
  };
  const like = async () => {
    if (!me) return router.push('/dang-nhap');
    const r = await api(`/chapters/${data.chapter.id}/like`, { method: 'POST' });
    setData({ ...data, liked: r.liked, likes: data.likes + (r.liked ? 1 : -1) });
    if (r.liked) { setHearts(true); setTimeout(() => setHearts(false), 900); }
  };

  const theme = `reader-${prefs.theme}`;
  if (err) return <div className={cn('reader grid min-h-screen place-items-center', theme)}><div className="text-center"><p className="font-serif text-2xl">{err}</p><Link href={`/truyen/${slug}`} className="mt-4 inline-block text-brand">← Về trang truyện</Link></div></div>;
  if (!data) return <div className={cn('reader min-h-screen px-6 pt-24', theme)}><div className="mx-auto max-w-2xl space-y-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-5 opacity-50" />)}</div></div>;

  const { story, chapter, access, commentCounts } = data;
  const fontFamily = prefs.font === 'serif' ? 'var(--font-read), Georgia, serif' : 'var(--font-ui), system-ui, sans-serif';

  return (
    <div className={cn('reader min-h-screen', theme)}>
      <div className="fixed inset-x-0 top-0 z-40 h-0.5"><div className="h-full bg-gradient-to-r from-brand to-gold transition-[width] duration-150" style={{ width: `${progress * 100}%` }} /></div>
      <header className="sticky top-0 z-30 border-b backdrop-blur-xl" style={{ borderColor: 'var(--r-line)', background: 'color-mix(in oklab, var(--r-bg) 85%, transparent)' }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <Link href={`/truyen/${slug}`} className="grid size-9 place-items-center rounded-full hover:bg-black/5" aria-label="Quay lại"><ArrowLeft className="size-5" /></Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{story.title}</div>
            <div className="truncate text-xs" style={{ color: 'var(--r-muted)' }}>Chương {chapter.number} · {chapter.title}</div>
          </div>
          <button onClick={() => setPara('chapter')} className="grid size-9 place-items-center rounded-full hover:bg-black/5" aria-label="Bình luận chương"><MessageCircle className="size-5" /></button>
          <button onClick={() => setPanel(true)} className="grid size-9 place-items-center rounded-full hover:bg-black/5" aria-label="Cài đặt đọc"><Settings2 className="size-5" /></button>
        </div>
      </header>

      <CoinCelebration show={!!celebrate} label={celebrate || ''} onDone={() => setCelebrate(null)} />
      <PageTurn turnKey={n}>
      <article className="mx-auto px-5 pb-16 pt-12 md:pt-20" style={{ maxWidth: prefs.width }}>
        <div className="mb-12 text-center">
          <div className="text-xs font-bold uppercase tracking-[.3em]" style={{ color: 'var(--brand)' }}>Chương {chapter.number}</div>
          <h1 className="mt-3 font-display text-[34px] font-bold leading-tight md:text-[44px]">{chapter.title}</h1>
          <div className="mx-auto mt-4 flex w-40 items-center gap-3" aria-hidden><span className="h-px flex-1" style={{ background: 'var(--r-line)' }} /><span className="size-2 rotate-45" style={{ background: 'var(--brand)' }} /><span className="h-px flex-1" style={{ background: 'var(--r-line)' }} /></div>
          <div className="mt-3 text-xs" style={{ color: 'var(--r-muted)' }}>{chapter.wordCount.toLocaleString('vi-VN')} chữ · {ago(chapter.publishedAt)} · ~{Math.max(1, Math.round(chapter.wordCount / 230))} phút đọc</div>
          <div className="mx-auto mt-6 h-px w-16" style={{ background: 'var(--brand)' }} />
        </div>

        <div className={cn(!access.canRead && 'relative')} style={{ fontFamily, fontSize: prefs.size, lineHeight: prefs.leading }}>
          {chapter.paragraphs.map((p: any, i: number) => {
            if (p.type === 'hr') return <div key={i} data-p={i} className="my-10 text-center tracking-[.6em]" style={{ color: 'var(--r-muted)' }}>✦ ✦ ✦</div>;
            const c = commentCounts[String(i)] || 0;
            const Tag = p.type === 'h' ? 'h2' : 'p';
            return (
              <div key={i} data-p={i} className="para group relative -mx-3 px-3 py-1">
                <Tag className={cn('mb-[0.9em] text-pretty', p.type === 'h' && 'font-bold', p.type === 'quote' && 'border-l-2 pl-4 italic')} style={p.type === 'quote' ? { borderColor: 'var(--brand)' } : undefined} dangerouslySetInnerHTML={{ __html: p.html }} />
                {access.canRead && (
                  <button onClick={() => setPara(i)} aria-label={`Bình luận đoạn ${i + 1}`}
                    className={cn('absolute -right-10 top-2 hidden h-7 min-w-7 items-center justify-center gap-1 rounded-full px-1.5 text-[11px] font-bold transition md:flex',
                      c ? 'bg-[var(--brand)] text-white opacity-90 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 hover:!opacity-100')}
                    style={c ? undefined : { border: '1px solid var(--r-line)' }}>
                    {c ? c : <Plus className="size-3.5" />}
                  </button>
                )}
              </div>
            );
          })}
          {!access.canRead && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40" style={{ background: 'linear-gradient(transparent, var(--r-bg))' }} />}
        </div>

        {!access.canRead && (
          <div className="fade-up relative mt-4 overflow-hidden rounded-[2rem] border p-7 text-center md:p-10" style={{ borderColor: 'var(--r-line)', background: 'color-mix(in oklab, var(--r-fg) 4%, var(--r-bg))' }}>
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-[var(--brand)]/20 blur-3xl" />
            <div className="relative">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--brand)] text-white shadow-lg"><Lock className="size-6" /></div>
              <h3 className="mt-4 font-serif text-2xl font-bold">Chương này cần mở khoá</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--r-muted)' }}>Còn {chapter.totalParagraphs - chapter.paragraphs.length} đoạn nữa. 70% số xu được chuyển cho tác giả.</p>
              <div className="mt-7 grid gap-3 text-left sm:grid-cols-3">
                {access.waitFree.enabled && (() => {
                  const avail = !access.waitFree.availableAt || new Date(access.waitFree.availableAt) <= new Date();
                  return (
                    <button disabled={busy || (!!me && !avail)} onClick={() => unlock('wait')} className="group rounded-2xl border p-4 transition enabled:hover:-translate-y-0.5 enabled:hover:border-emerald-500 disabled:opacity-60" style={{ borderColor: 'var(--r-line)' }}>
                      <Timer className="size-5 text-emerald-500" />
                      <div className="mt-2 font-semibold">Chờ là miễn phí</div>
                      <div className="text-xs" style={{ color: 'var(--r-muted)' }}>{!me || avail ? `Dùng vé miễn phí (${access.waitFree.hours}h/vé)` : <>Vé tiếp theo sau <Countdown to={access.waitFree.availableAt} /></>}</div>
                    </button>
                  );
                })()}
                <button disabled={busy} onClick={() => unlock('rent')} className="rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-sky-500" style={{ borderColor: 'var(--r-line)' }}>
                  <Clock className="size-5 text-sky-500" />
                  <div className="mt-2 font-semibold">Thuê 48 giờ</div>
                  <div className="text-xs" style={{ color: 'var(--r-muted)' }}><b className="text-[var(--gold)]">{access.rentPrice} xu</b> · đọc lại thoải mái trong 2 ngày</div>
                </button>
                <button disabled={busy} onClick={() => unlock('buy')} className={cn('rounded-2xl border-2 border-[var(--gold)] p-4 transition hover:-translate-y-0.5', !access.waitFree.enabled && 'sm:col-span-2')}>
                  <Coins className="size-5 text-[var(--gold)]" />
                  <div className="mt-2 font-semibold">Mua vĩnh viễn</div>
                  <div className="text-xs" style={{ color: 'var(--r-muted)' }}><b className="text-[var(--gold)]">{access.price} xu</b> · mở khoá mãi mãi</div>
                </button>
              </div>
              <div className="mt-5 text-sm" style={{ color: 'var(--r-muted)' }}>
                {me ? <>Số dư: <b className="text-[var(--gold)]">{me.coins} xu</b> · <Link href="/vi" className="font-semibold text-[var(--brand)]">Nạp thêm</Link></> : <Link href={`/dang-nhap?next=/truyen/${slug}/${n}`} className="font-semibold text-[var(--brand)]">Đăng nhập để mở khoá</Link>}
              </div>
            </div>
          </div>
        )}

        {access.canRead && (
          <div className="mt-16 text-center">
            {access.reason === 'RENTAL' && <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-600"><Clock className="size-3.5" />Đang thuê · hết hạn {new Date(access.expiresAt).toLocaleString('vi-VN')}</div>}
            <div className="flex items-center justify-center gap-3">
              <span className="relative inline-flex"><Button variant="outline" onClick={like} className="!border-[var(--r-line)] !bg-transparent"><Heart className={cn('transition-transform', data.liked && 'scale-110 fill-[var(--brand)] text-[var(--brand)]')} />{data.likes}</Button><Burst show={hearts} onDone={() => {}} /></span>
              <Button variant="outline" onClick={() => setPara('chapter')} className="!border-[var(--r-line)] !bg-transparent"><MessageCircle />{commentCounts.chapter || 0} bình luận</Button>
            </div>
          </div>
        )}

        <nav className="mt-14 grid grid-cols-2 gap-3">
          {data.prev ? <Link href={`/truyen/${slug}/${data.prev.number}`} className="group rounded-2xl border p-4 transition hover:-translate-x-0.5" style={{ borderColor: 'var(--r-line)' }}>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--r-muted)' }}><ChevronLeft className="size-3.5" />Chương trước</div>
            <div className="mt-1 line-clamp-1 font-semibold">{data.prev.title}</div></Link> : <div />}
          {data.next ? <Link href={`/truyen/${slug}/${data.next.number}`} className="group rounded-2xl border p-4 text-right transition hover:translate-x-0.5" style={{ borderColor: 'var(--r-line)' }}>
            <div className="flex items-center justify-end gap-1 text-xs" style={{ color: 'var(--r-muted)' }}>Chương sau{data.next.price > 0 && <Lock className="size-3" />}<ChevronRight className="size-3.5" /></div>
            <div className="mt-1 line-clamp-1 font-semibold">{data.next.title}</div></Link>
            : <div className="rounded-2xl border p-4 text-right text-sm" style={{ borderColor: 'var(--r-line)', color: 'var(--r-muted)' }}><Sparkles className="ml-auto mb-1 size-4" />Bạn đã đọc tới chương mới nhất</div>}
        </nav>
      </article>
      </PageTurn>

      <Dialog open={panel} onOpenChange={setPanel} title="Cài đặt đọc" side>
        <div className="space-y-7">
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Nền</div>
            <div className="grid grid-cols-3 gap-2">
              {([['light', 'Sáng', '#fdfbf7', '#26212e'], ['sepia', 'Giấy cũ', '#f4ead5', '#4a3a24'], ['dark', 'Tối', '#121019', '#d8d2e2']] as const).map(([k, l, bg, fg]) => (
                <button key={k} onClick={() => setPrefs({ theme: k })} className={cn('rounded-2xl border-2 py-4 font-serif text-lg transition', prefs.theme === k ? 'border-brand scale-[1.03]' : 'border-line')} style={{ background: bg, color: fg }}>
                  Aa<div className="font-sans text-xs">{l}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Phông chữ</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPrefs({ font: 'serif' })} className={cn('rounded-2xl border-2 py-3 font-serif', prefs.font === 'serif' ? 'border-brand' : 'border-line')}>Lora (có chân)</button>
              <button onClick={() => setPrefs({ font: 'sans' })} className={cn('rounded-2xl border-2 py-3', prefs.font === 'sans' ? 'border-brand' : 'border-line')}>Be Vietnam Pro</button>
            </div>
          </div>
          {([['Cỡ chữ', 'size', 14, 28, 1, `${prefs.size}px`], ['Giãn dòng', 'leading', 1.4, 2.3, 0.1, prefs.leading.toFixed(1)], ['Độ rộng cột', 'width', 520, 900, 40, `${prefs.width}px`]] as const).map(([l, k, min, max, step, v]) => (
            <div key={k}>
              <div className="mb-3 flex justify-between text-xs font-semibold uppercase tracking-wider text-muted"><span>{l}</span><span className="text-fg">{v}</span></div>
              <div className="flex items-center gap-3">
                <button className="grid size-9 place-items-center rounded-full border border-line" onClick={() => setPrefs({ [k]: Math.max(min, +(prefs[k] - step).toFixed(1)) } as any)}><Minus className="size-4" /></button>
                <input type="range" min={min} max={max} step={step} value={prefs[k]} onChange={(e) => setPrefs({ [k]: Number(e.target.value) } as any)} className="flex-1 accent-[var(--brand)]" />
                <button className="grid size-9 place-items-center rounded-full border border-line" onClick={() => setPrefs({ [k]: Math.min(max, +(prefs[k] + step).toFixed(1)) } as any)}><Plus className="size-4" /></button>
              </div>
            </div>
          ))}
          <p className="flex items-center gap-2 rounded-2xl bg-bg-soft p-4 text-xs text-muted"><Type className="size-4 shrink-0" />Mẹo: dùng phím ← → để chuyển chương. Cài đặt được lưu trên thiết bị này.</p>
        </div>
      </Dialog>

      <CommentsDrawer chapterId={chapter.id} target={para} paragraphs={chapter.paragraphs} onClose={() => setPara(null)}
        onPosted={(k) => setData({ ...data, commentCounts: { ...commentCounts, [k]: (commentCounts[k] || 0) + 1 } })} />
    </div>
  );
}

function CommentsDrawer({ chapterId, target, paragraphs, onClose, onPosted }: { chapterId: string; target: number | null | 'chapter'; paragraphs: any[]; onClose: () => void; onPosted: (k: string) => void }) {
  const { me } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const open = target !== null;
  const key = target === 'chapter' ? 'chapter' : String(target);
  useEffect(() => { if (open) api(`/chapters/${chapterId}/comments?paragraph=${key}`).then(setItems).catch(() => {}); }, [open, chapterId, key]);
  const post = async () => {
    try {
      const c = await api(`/chapters/${chapterId}/comments`, { body: { body, paragraph: target === 'chapter' ? null : target } });
      setItems([...items, c]); setBody(''); onPosted(key);
    } catch (e: any) { toast(e.message, true); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} title={target === 'chapter' ? 'Bình luận chương' : `Bình luận đoạn ${Number(target) + 1}`} side>
      {typeof target === 'number' && <blockquote className="mb-5 line-clamp-4 border-l-2 border-brand pl-4 font-serif text-sm italic text-muted">{paragraphs[target]?.text}</blockquote>}
      <div className="-mx-2 flex-1 space-y-3 overflow-auto px-2">
        {items.length === 0 && <p className="py-10 text-center text-sm text-muted">Chưa có bình luận. Mở lời đi nào ✍️</p>}
        {items.map((c) => (
          <div key={c.id} className="fade-up flex gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand/80 to-gold/80 text-xs font-bold text-white">{c.user.name[0]}</div>
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-bg-soft px-4 py-2.5">
              <div className="text-xs"><b>{c.user.name}</b> <span className="text-muted">· {ago(c.createdAt)}</span></div>
              <p className="mt-0.5 text-sm">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
      {me ? (
        <div className="mt-4 border-t border-line pt-4">
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Viết bình luận…" className="min-h-20" />
          <Button className="mt-2 w-full" disabled={!body.trim()} onClick={post}>Gửi</Button>
        </div>
      ) : <Link href="/dang-nhap" className="mt-4 block text-center text-sm font-semibold text-brand">Đăng nhập để bình luận</Link>}
    </Dialog>
  );
}
