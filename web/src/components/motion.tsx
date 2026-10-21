'use client';
import * as React from 'react';
import { AnimatePresence, MotionConfig, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Global motion config: honours the OS "reduce motion" setting everywhere. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 260, damping: 28 }}>{children}</MotionConfig>;
}

const ease = [0.2, 0.7, 0.2, 1] as const;

/** Fade/slide in when scrolled into view. */
export function Reveal({ children, className, delay = 0, y = 18 }: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, ease, delay }}>
      {children}
    </motion.div>
  );
}

/** Staggered reveal for grids/lists: children animate one after another. */
export function Stagger({ children, className, gap = 0.06 }: { children: React.ReactNode; className?: string; gap?: number }) {
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}>
      {React.Children.map(children, (c) => c && (
        <motion.div variants={{ hidden: { opacity: 0, y: 22, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease } } }}>{c}</motion.div>
      ))}
    </motion.div>
  );
}

/** 3D tilt following the pointer, with a moving sheen — for book covers. */
export function Tilt({ children, className, max = 12 }: { children: React.ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5), y = useMotionValue(0.5);
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 200, damping: 18 });
  const sheen = useTransform(x, [0, 1], ['-30%', '130%']);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <div style={{ perspective: 900 }} className={className}>
      <motion.div
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        whileHover={{ scale: 1.035, z: 20 }}
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left) / r.width); y.set((e.clientY - r.top) / r.height); }}
        onPointerLeave={() => { x.set(0.5); y.set(0.5); }}
        className="relative"
      >
        {children}
        <motion.span aria-hidden style={{ left: sheen }} className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent mix-blend-overlay" />
      </motion.div>
    </div>
  );
}

/** Burst of particles around a point (hearts for likes, coins for unlocks). */
export function Burst({ show, kind = 'heart', count = 12, onDone }: { show: boolean; kind?: 'heart' | 'coin' | 'spark'; count?: number; onDone?: () => void }) {
  const glyph = kind === 'heart' ? '❤' : kind === 'coin' ? '●' : '✦';
  const color = kind === 'heart' ? 'text-brand' : kind === 'coin' ? 'text-gold' : 'text-gold';
  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <span className="pointer-events-none absolute inset-0 z-30 grid place-items-center" aria-hidden>
          {Array.from({ length: count }, (_, i) => {
            const a = (i / count) * Math.PI * 2, d = 38 + (i % 3) * 16;
            return (
              <motion.span key={i} className={cn('absolute text-sm', color)}
                initial={{ x: 0, y: 0, scale: 0.2, opacity: 1 }}
                animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d - 10, scale: [0.2, 1.2, 0.8], opacity: [1, 1, 0], rotate: (i % 2 ? 1 : -1) * 40 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}>{glyph}</motion.span>
            );
          })}
          <motion.span className={cn('absolute size-10 rounded-full border-2', kind === 'heart' ? 'border-brand' : 'border-gold')}
            initial={{ scale: 0.2, opacity: 0.9 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 0.6 }} />
        </span>
      )}
    </AnimatePresence>
  );
}

/** Full-screen coin celebration after a successful unlock. */
export function CoinCelebration({ show, label, onDone }: { show: boolean; label: string; onDone: () => void }) {
  React.useEffect(() => { if (show) { const t = setTimeout(onDone, 1900); return () => clearTimeout(t); } }, [show, onDone]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="pointer-events-none fixed inset-0 z-[80] grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(241,184,75,.28),transparent_60%)]" />
          {Array.from({ length: 26 }, (_, i) => {
            const a = (i / 26) * Math.PI * 2, d = 140 + (i % 4) * 50;
            return (
              <motion.span key={i} className="absolute grid size-7 place-items-center rounded-full border-2 border-[#8a5a12] bg-gradient-to-br from-[#ffe08a] to-[#d99a22] text-[11px] font-bold text-[#7a4d0c] shadow-lg"
                initial={{ x: 0, y: 0, scale: 0, rotateY: 0 }}
                animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d + 60, scale: [0, 1.15, 1], rotateY: 720, opacity: [1, 1, 0] }}
                transition={{ duration: 1.5, ease: [0.15, 0.7, 0.3, 1], delay: (i % 5) * 0.03 }}>xu</motion.span>
            );
          })}
          <motion.div className="relative rounded-3xl border border-gold/50 bg-card/95 px-8 py-5 text-center shadow-2xl backdrop-blur"
            initial={{ scale: 0.6, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
            <div className="text-3xl">🔓</div>
            <div className="mt-1 font-display text-xl font-bold">{label}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Page-turn transition: the new page swings in from the spine, with a paper shadow sweeping across. */
export function PageTurn({ turnKey, children, dir = 1 }: { turnKey: string | number; children: React.ReactNode; dir?: 1 | -1 }) {
  return (
    <div style={{ perspective: 1800 }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={turnKey} style={{ transformOrigin: dir > 0 ? 'left center' : 'right center' }}
          initial={{ rotateY: dir * 70, opacity: 0, filter: 'brightness(.85)' }}
          animate={{ rotateY: 0, opacity: 1, filter: 'brightness(1)' }}
          exit={{ rotateY: dir * -60, opacity: 0, filter: 'brightness(.8)' }}
          transition={{ duration: 0.65, ease: [0.3, 0.6, 0.2, 1] }} className="relative">
          {children}
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-black/25 via-transparent to-transparent"
            initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.8 }} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Smooth theme switch: ink-circle reveal from the toggle using the View Transitions API (falls back to CSS transitions). */
export function switchTheme(next: 'dark' | 'light', from?: { x: number; y: number }) {
  const apply = () => { document.documentElement.classList.toggle('dark', next === 'dark'); localStorage.setItem('muc_theme', next); };
  const d = document as any;
  if (!d.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return apply();
  if (from) { document.documentElement.style.setProperty('--vt-x', `${from.x}px`); document.documentElement.style.setProperty('--vt-y', `${from.y}px`); }
  d.startViewTransition(apply);
}

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded-2xl', className)} />;
}
