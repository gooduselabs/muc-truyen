import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Mực brand marks. The logo is a cinnabar seal (triện) with a slightly uneven, hand-stamped edge,
 * holding an ink drop that doubles as a pen nib; a small gold lantern-dot sits on the corner.
 */
export function LogoMark({ className, title = 'Mực' }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="muc-seal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9532f" />
          <stop offset="1" stopColor="#a92b17" />
        </linearGradient>
        <filter id="muc-rough"><feTurbulence baseFrequency=".9" numOctaves="2" seed="7" /><feDisplacementMap in="SourceGraphic" scale="1.6" /></filter>
      </defs>
      <path filter="url(#muc-rough)" fill="url(#muc-seal)"
        d="M10 6.5C20 4.8 44 4.6 55 6.2c2.6.4 3.3 2.2 3.3 4.6.6 13.6.8 28.6-.2 42.4-.2 2.6-1.6 4.2-4.3 4.4-12.3 1-30.3 1.2-43.5.2C7.7 57.6 6 56 5.9 53.2 5.2 40 5.3 23.5 6.3 10.6c.2-2.3 1.6-3.7 3.7-4.1Z" />
      {/* ink drop / nib */}
      <path fill="#fbf3e4" d="M32 12.5c6.8 9.3 12.5 16.6 12.5 24.1A12.5 12.5 0 0 1 32 49.1a12.5 12.5 0 0 1-12.5-12.5c0-7.5 5.7-14.8 12.5-24.1Z" />
      <path fill="#a92b17" d="M32 27.5v13.2" stroke="#a92b17" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="42.6" r="2.6" fill="#a92b17" />
      <path d="M26.5 33.5c.6-3.4 2.4-6.4 4.2-9" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      {/* lantern dot */}
      <circle cx="53" cy="53" r="6.2" fill="#f1b84b" stroke="#fbf3e4" strokeWidth="2.4" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-display text-[26px] font-extrabold leading-none tracking-tight', className)}>
      Mực<span className="text-brand">.</span>
    </span>
  );
}

export function Logo({ small, className }: { small?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn('group inline-flex items-center gap-2.5', className)} aria-label="Mực — trang chủ">
      <LogoMark className="size-10 drop-shadow-[0_8px_14px_rgba(194,59,34,.35)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105" />
      {!small && (
        <span className="flex flex-col">
          <Wordmark />
          <span className="mt-1 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[.22em] text-muted">truyện viết bằng tâm</span>
        </span>
      )}
    </Link>
  );
}

/** Hand-drawn brush stroke, used under section titles. */
export function BrushStroke({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 14" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M2 9.5C40 4 90 3.2 150 5.4c45 1.6 95 2.6 146 .6" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M30 11.5c60-2.6 140-3.2 230-1.4" fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Ornamental divider: ink line – seal – ink line. */
export function InkDivider({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 text-line', className)} aria-hidden>
      <svg viewBox="0 0 200 8" className="h-2 flex-1" preserveAspectRatio="none"><path d="M0 4c40-3 80 2 120-1s60 2 80 0" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
      <span className="grid size-6 rotate-45 place-items-center rounded-[4px] bg-brand/90"><span className="size-1.5 rounded-full bg-[#fbf3e4]" /></span>
      <svg viewBox="0 0 200 8" className="h-2 flex-1" preserveAspectRatio="none"><path d="M0 4c20-2 60 3 80 0s80-1 120 1" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
    </div>
  );
}

/** Red seal stamp with vertical text, e.g. "Tuyển chọn". */
export function Seal({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn('inline-grid -rotate-6 place-items-center rounded-[6px] border-2 border-brand/80 px-1.5 py-1 font-display text-[10px] font-bold uppercase leading-[1.05] tracking-wider text-brand mix-blend-multiply dark:mix-blend-screen', className)}>
      {text}
    </span>
  );
}

/** Paper lantern illustration (hero & empty states). */
export function Lantern({ className, glow = true }: { className?: string; glow?: boolean }) {
  return (
    <svg viewBox="0 0 120 200" className={className} aria-hidden>
      <defs>
        <radialGradient id="lan-g" cx=".5" cy=".5" r=".6"><stop offset="0" stopColor="#ffd27a" /><stop offset=".55" stopColor="#ef6a3a" /><stop offset="1" stopColor="#a92b17" /></radialGradient>
        <radialGradient id="lan-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffb86b" stopOpacity=".55" /><stop offset="1" stopColor="#ffb86b" stopOpacity="0" /></radialGradient>
      </defs>
      {glow && <circle cx="60" cy="100" r="60" fill="url(#lan-glow)" />}
      <line x1="60" y1="0" x2="60" y2="38" stroke="#6b4b2a" strokeWidth="2" />
      <rect x="44" y="36" width="32" height="8" rx="2" fill="#3a2a1a" />
      <ellipse cx="60" cy="100" rx="40" ry="56" fill="url(#lan-g)" />
      {[-26, -13, 0, 13, 26].map((dx) => <path key={dx} d={`M${60 + dx * 0.2} 46 Q${60 + dx * 1.45} 100 ${60 + dx * 0.2} 154`} stroke="#7a1f10" strokeOpacity=".45" strokeWidth="1.3" fill="none" />)}
      <rect x="44" y="154" width="32" height="8" rx="2" fill="#3a2a1a" />
      <path d="M54 162v22M60 162v30M66 162v22" stroke="#c23b22" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Illustrated empty state: open book with an ink drop falling onto it. */
export function EmptyArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className} aria-hidden>
      <ellipse cx="100" cy="128" rx="70" ry="6" fill="currentColor" opacity=".08" />
      <path d="M100 40c-20-12-48-14-74-8v84c26-6 54-4 74 8 20-12 48-14 74-8V32c-26-6-54-4-74 8Z" fill="var(--card)" stroke="var(--line)" strokeWidth="2" />
      <path d="M100 40v84" stroke="var(--line)" strokeWidth="2" />
      {[56, 68, 80, 92].map((y) => <path key={y} d={`M38 ${y}c18-3 36-2 52 3M110 ${y + 3}c16-5 34-6 52-3`} stroke="var(--muted)" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round" fill="none" />)}
      <path d="M140 6c5 7 9 12 9 17a9 9 0 0 1-18 0c0-5 4-10 9-17Z" fill="var(--brand)" />
      <ellipse cx="128" cy="104" rx="10" ry="3.5" fill="var(--brand)" opacity=".35" />
    </svg>
  );
}
