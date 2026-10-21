import { cn } from '@/lib/utils';

/** Generated covers: deterministic palette + ornament from a seed, so every story looks designed even without an upload. */
const PALETTES = [
  ['#1d1838', '#4b2a7b', '#ff7a59'], ['#0f3b3a', '#1f7a6d', '#f2c14e'], ['#3a0f1e', '#a8324a', '#ffd6a5'],
  ['#14213d', '#2f4b8f', '#fca311'], ['#2b1d0e', '#8a5a2b', '#f6e7cb'], ['#0b2027', '#40798c', '#cfd7c7'],
  ['#311042', '#7a2e8e', '#f7b2bd'], ['#102a1c', '#3f7d4e', '#e9f5db'], ['#3d0c02', '#c0392b', '#f9e79f'],
  ['#1b1b3a', '#693668', '#ff8fab'], ['#002b36', '#268bd2', '#fdf6e3'], ['#2d1e2f', '#b85c38', '#f2e9e4'],
];

export function palette(seed: number) { return PALETTES[Math.abs(seed) % PALETTES.length]; }

export function Cover({ title, seed = 0, url, author, genre, className, size = 'md' }: {
  title: string; seed?: number; url?: string | null; author?: string; genre?: string; className?: string; size?: 'sm' | 'md' | 'lg';
}) {
  const [a, b, c] = palette(seed);
  const shape = seed % 4;
  const initial = title.trim().charAt(0);
  return (
    <div className={cn('group/cover relative aspect-[2/3] overflow-hidden rounded-2xl shadow-[0_18px_40px_-18px_rgba(20,10,40,.55)] ring-1 ring-black/5 transition-transform duration-500', className)}
      style={{ background: `linear-gradient(155deg, ${a} 0%, ${b} 62%, ${c} 140%)` }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={title} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <svg className="absolute inset-0 h-full w-full opacity-70 transition-transform duration-700 group-hover/cover:scale-110" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
            {shape === 0 && <><circle cx="150" cy="70" r="46" fill={c} opacity=".85" /><circle cx="150" cy="70" r="66" fill="none" stroke={c} strokeOpacity=".35" /></>}
            {shape === 1 && <path d="M0 210 Q50 170 100 205 T200 190 V300 H0Z" fill={c} opacity=".35" />}
            {shape === 2 && <><path d="M-10 250 L60 140 L110 210 L150 160 L220 260Z" fill={a} opacity=".55" /><circle cx="60" cy="70" r="18" fill={c} /></>}
            {shape === 3 && [0, 1, 2, 3, 4].map((i) => <circle key={i} cx="100" cy="120" r={30 + i * 24} fill="none" stroke={c} strokeOpacity={0.5 - i * 0.08} />)}
          </svg>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div aria-hidden className="absolute -left-3 top-1 font-serif font-bold leading-none text-white/10" style={{ fontSize: size === 'sm' ? 120 : 200 }}>{initial}</div>
          <div className={cn('absolute inset-x-0 bottom-0 p-3', size === 'lg' && 'p-5')}>
            {genre && size !== 'sm' && <div className="mb-1 text-[10px] font-semibold uppercase tracking-[.2em] text-white/70">{genre}</div>}
            <div className={cn('font-serif font-bold leading-tight text-white drop-shadow', size === 'sm' ? 'text-xs line-clamp-3' : size === 'lg' ? 'text-2xl' : 'text-[15px] line-clamp-3')}>{title}</div>
            {author && size === 'lg' && <div className="mt-2 text-xs text-white/75">{author}</div>}
          </div>
          <div className="absolute right-2 top-2 grid size-6 place-items-center rounded-md bg-[#d9452f] font-serif text-[10px] font-bold text-white shadow">M</div>
        </>
      )}
    </div>
  );
}
