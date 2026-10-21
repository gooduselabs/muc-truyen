import { cn } from '@/lib/utils';

/**
 * Generated book covers in the Mực style: a cloth-bound book with a debossed frame,
 * an ink-wash motif chosen by seed, Playfair title typography and a red seal.
 */
const PALETTES = [
  ['#1a1733', '#3b2f6b', '#f1b84b'], ['#0f3b3a', '#1f6b5e', '#f2d38a'], ['#3a0f1e', '#8f2a3e', '#ffd6a5'],
  ['#14213d', '#2b3a67', '#f4a259'], ['#2b1d0e', '#7a4f25', '#f6e7cb'], ['#0b2027', '#2f6f80', '#e4ecd8'],
  ['#2d1240', '#62307a', '#f7b2bd'], ['#122a1c', '#355f42', '#e9f5db'], ['#3d0c02', '#a8321f', '#f9e79f'],
  ['#1b1b3a', '#5a2f5a', '#ff9fb2'], ['#082a33', '#1e6f93', '#fdf6e3'], ['#2d1e2f', '#9a4e2f', '#f2e9e4'],
];

export function palette(seed: number) { return PALETTES[Math.abs(seed) % PALETTES.length]; }

function Motif({ kind, c, a }: { kind: number; c: string; a: string }) {
  switch (kind) {
    case 0: // moon over waves
      return <><circle cx="138" cy="86" r="34" fill={c} opacity=".9" /><path d="M0 214c30-14 50-14 76 0s50 14 76 0 34-14 48-8v94H0Z" fill={a} opacity=".55" /><path d="M0 228c30-12 50-12 76 0s50 12 76 0 34-12 48-6" stroke={c} strokeOpacity=".5" fill="none" /></>;
    case 1: // mountains (sơn thủy)
      return <><path d="M-10 230 L52 120 L92 180 L130 110 L214 236Z" fill={a} opacity=".6" /><path d="M-10 250 L70 170 L120 220 L160 180 L214 250Z" fill={c} opacity=".25" /><circle cx="56" cy="70" r="14" fill={c} /></>;
    case 2: // lotus
      return <g transform="translate(100 150)" fill={c} opacity=".85">{[-60, -30, 0, 30, 60].map((r) => <path key={r} transform={`rotate(${r})`} d="M0 0C-14-24-12-52 0-70 12-52 14-24 0 0Z" opacity={r === 0 ? 1 : .6} />)}</g>;
    case 3: // concentric ripples / lantern light
      return <>{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx="100" cy="120" r={26 + i * 22} fill="none" stroke={c} strokeOpacity={0.55 - i * 0.1} strokeWidth="1.4" />)}<circle cx="100" cy="120" r="12" fill={c} /></>;
    default: // bamboo
      return <g stroke={c} strokeWidth="5" strokeLinecap="round" opacity=".7">{[40, 70, 160].map((x, i) => <path key={x} d={`M${x} 300 L${x + (i - 1) * 6} 30`} />)}<path d="M70 120l30-22M160 90l-28-18M40 180l26-16" strokeWidth="3" /></g>;
  }
}

export function Cover({ title, seed = 0, url, author, genre, className, size = 'md' }: {
  title: string; seed?: number; url?: string | null; author?: string; genre?: string; className?: string; size?: 'sm' | 'md' | 'lg';
}) {
  const [a, b, c] = palette(seed);
  return (
    <div className={cn('group/cover relative aspect-[2/3] overflow-hidden rounded-[6px_14px_14px_6px] shadow-[0_22px_40px_-20px_rgba(30,15,5,.65),inset_3px_0_0_rgba(255,255,255,.12)] ring-1 ring-black/10', className)}
      style={{ background: `linear-gradient(160deg, ${b} 0%, ${a} 75%)` }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <svg className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover/cover:scale-105" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <defs>
              <filter id={`cl${seed}`}><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed={seed % 50} /><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .08 0" /></filter>
            </defs>
            <Motif kind={seed % 5} c={c} a={a} />
            <rect width="200" height="300" filter={`url(#cl${seed})`} />
          </svg>
          {/* spine shading */}
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/35 via-white/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
          {size !== 'sm' && <div className="absolute inset-[7px] rounded-[4px_10px_10px_4px] border" style={{ borderColor: `${c}55` }} />}
          <div className={cn('absolute inset-x-0 bottom-0 p-3.5', size === 'lg' && 'p-6')}>
            {genre && size !== 'sm' && <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-[.3em]" style={{ color: c }}>{genre}</div>}
            <div className={cn('font-display font-bold leading-[1.08] text-[#fbf3e4] drop-shadow', size === 'sm' ? 'text-[11px] line-clamp-3' : size === 'lg' ? 'text-[28px]' : 'text-[17px] line-clamp-3')}>{title}</div>
            {author && size === 'lg' && <div className="mt-2.5 text-xs italic text-white/75">— {author}</div>}
          </div>
          <div className={cn('absolute right-2.5 top-2.5 grid place-items-center rounded-[3px] border border-[#fbf3e4]/40 bg-[#c23b22] font-display font-bold text-[#fbf3e4] shadow', size === 'sm' ? 'size-4 text-[7px]' : 'size-6 text-[10px]')}>M</div>
        </>
      )}
    </div>
  );
}
