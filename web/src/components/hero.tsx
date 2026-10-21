'use client';
import * as React from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Cover } from './cover';
import { Lantern } from './brand';
import type { StoryCardData } from './story-card';

export type Banner = { id: string; title: string; subtitle: string; kicker: string; link: string; hue: number; story: StoryCardData | null };

/** Admin-curated hero carousel with layered parallax (pointer + scroll) and auto-advance. */
export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 20 }), sy = useSpring(my, { stiffness: 80, damping: 20 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const far = { x: useTransform(sx, (v) => v * -14), y: useTransform(sy, (v) => v * -10) };
  const near = { x: useTransform(sx, (v) => v * 26), y: useTransform(sy, (v) => v * 18) };
  const n = banners.length;
  React.useEffect(() => {
    if (paused || reduce || n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6500);
    return () => clearInterval(t);
  }, [paused, reduce, n]);
  if (!n) return null;
  const b = banners[i];
  const href = b.story ? `/truyen/${b.story.slug}` : b.link || '/kham-pha';
  const h = b.hue;

  return (
    <section ref={ref} className="relative isolate overflow-hidden"
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); mx.set(0); my.set(0); }}>
      {/* background wash, changes hue per slide */}
      <AnimatePresence initial={false}>
        <motion.div key={b.id} className="absolute inset-0 -z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}
          style={{ background: `radial-gradient(900px 520px at 78% 40%, hsl(${h} 70% 55% / .28), transparent 65%), radial-gradient(700px 400px at 10% 90%, hsl(${(h + 40) % 360} 60% 50% / .14), transparent 60%)` }} />
      </AnimatePresence>
      <motion.div style={{ ...far, translateY: scrollY }} className="pointer-events-none absolute -left-20 top-10 -z-10 font-display text-[260px] font-black italic leading-none text-fg/[.04] md:text-[360px]">Mực</motion.div>
      <motion.div style={near} className="pointer-events-none absolute right-[4%] top-0 -z-10 hidden lg:block"><Lantern className="h-64 animate-[sway_6s_ease-in-out_infinite] origin-top" /></motion.div>

      <div className="mx-auto grid min-h-[560px] max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-[1.1fr_.9fr] md:py-16">
        <AnimatePresence mode="wait">
          <motion.div key={b.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft/70 px-3 py-1 text-xs font-bold uppercase tracking-[.2em] text-brand">
              <Sparkles className="size-3.5" />{b.kicker || 'Nổi bật'}
            </div>
            <h1 className="mt-6 font-display text-[44px] font-black leading-[1.02] tracking-tight md:text-[68px]">{b.title}</h1>
            {b.story && <p className="mt-4 text-sm font-medium text-muted">bởi <span className="text-fg">{b.story.author.name}</span> · {b.story.genre}</p>}
            <p className="mt-5 max-w-xl font-serif text-[19px] leading-relaxed text-fg/80">{b.subtitle || b.story?.synopsis}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={b.story ? `/truyen/${b.story.slug}/1` : href} className="group inline-flex h-12 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-white shadow-[0_14px_30px_-12px_var(--brand)] transition hover:-translate-y-0.5">
                {b.story ? 'Đọc ngay' : 'Tìm hiểu'}<ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              {b.story && <Link href={href} className="inline-flex h-12 items-center rounded-full border border-line bg-card/70 px-6 font-semibold backdrop-blur transition hover:border-brand">Xem chi tiết</Link>}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="relative mx-auto h-[440px] w-full max-w-md" style={{ perspective: 1200 }}>
          <AnimatePresence mode="popLayout">
            {b.story ? (
              <motion.div key={b.id} style={near} initial={{ opacity: 0, rotateY: -35, x: 80, scale: 0.9 }} animate={{ opacity: 1, rotateY: -12, x: 0, scale: 1 }} exit={{ opacity: 0, rotateY: 30, x: -80, scale: 0.9 }}
                transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }} className="absolute left-1/2 top-1/2 w-[62%] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]">
                <Link href={href} className="block">
                  <Cover title={b.story.title} seed={b.story.coverSeed} url={b.story.coverUrl} genre={b.story.genre} author={b.story.author.name} size="lg" className="shadow-[30px_40px_60px_-30px_rgba(20,10,0,.7)]" />
                </Link>
                <div className="absolute -bottom-8 left-1/2 h-6 w-4/5 -translate-x-1/2 rounded-[50%] bg-black/25 blur-xl" />
              </motion.div>
            ) : (
              <motion.div key={b.id} style={near} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-6 grid place-items-center rounded-[2rem] border border-gold/40 text-center"
                >
                <div style={{ background: `radial-gradient(circle, hsl(${h} 80% 60% / .35), transparent 70%)` }} className="absolute inset-0 rounded-[2rem]" />
                <div className="relative">
                  <Lantern className="mx-auto h-48" />
                  <div className="mt-2 font-display text-2xl font-bold italic">{b.kicker}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {n > 1 && (
        <div className="mx-auto -mt-6 flex max-w-7xl items-center gap-3 px-6 pb-10">
          <button aria-label="Trước" onClick={() => setI((i - 1 + n) % n)} className="grid size-9 place-items-center rounded-full border border-line bg-card/70 hover:border-brand"><ChevronLeft className="size-4" /></button>
          <div className="flex gap-2">
            {banners.map((x, k) => (
              <button key={x.id} aria-label={`Banner ${k + 1}`} onClick={() => setI(k)} className="relative h-1.5 w-12 overflow-hidden rounded-full bg-line">
                {k === i && <motion.span key={`${i}-${paused}`} className="absolute inset-y-0 left-0 bg-brand" initial={{ width: paused || reduce ? '100%' : '0%' }} animate={{ width: '100%' }} transition={{ duration: paused || reduce ? 0 : 6.5, ease: 'linear' }} />}
                {k < i && <span className="absolute inset-0 bg-brand/50" />}
              </button>
            ))}
          </div>
          <button aria-label="Sau" onClick={() => setI((i + 1) % n)} className="grid size-9 place-items-center rounded-full border border-line bg-card/70 hover:border-brand"><ChevronRight className="size-4" /></button>
          <span className="ml-2 font-display text-sm italic text-muted">{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
        </div>
      )}
    </section>
  );
}
