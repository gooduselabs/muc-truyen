import Link from 'next/link';
import { Crown, Eye, Heart, BookmarkCheck, Star } from 'lucide-react';
import { sget } from '@/lib/api';
import { Cover } from '@/components/cover';
import { cn, fmt } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bảng xếp hạng' };
const TABS = [['week', 'Thịnh hành tuần', Crown], ['views', 'Lượt đọc', Eye], ['likes', 'Yêu thích', Heart], ['library', 'Lưu tủ', BookmarkCheck], ['rating', 'Điểm cao', Star]] as const;

export default async function Rankings({ searchParams }: { searchParams: Promise<{ by?: string }> }) {
  const by = (await searchParams).by || 'week';
  const list: any[] = (await sget(`/discover/rankings?by=${by}`)) || [];
  const [a, b, c, ...rest] = list;
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-[.25em] text-brand">Bảng vàng</div>
        <h1 className="mt-2 font-serif text-4xl font-bold md:text-5xl">Bảng xếp hạng</h1>
      </div>
      <div className="no-scrollbar mt-8 flex justify-center gap-2 overflow-x-auto">
        {TABS.map(([k, l, I]) => (
          <Link key={k} href={`/bang-xep-hang?by=${k}`} className={cn('inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition', by === k ? 'border-brand bg-brand text-white' : 'border-line bg-card hover:border-brand')}><I className="size-4" />{l}</Link>
        ))}
      </div>
      {a && (
        <div className="mt-14 grid grid-cols-3 items-end gap-4 md:gap-8">
          {[b, a, c].map((s, i) => s && (
            <Link key={s.id} href={`/truyen/${s.slug}`} className={cn('group text-center fade-up', i === 1 ? 'order-2' : i === 0 ? 'order-1 pt-10' : 'order-3 pt-16')}>
              <div className="relative mx-auto" style={{ width: i === 1 ? '100%' : '82%' }}>
                <Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} genre={s.genre} className="transition group-hover:-translate-y-1.5" />
                <div className={cn('absolute -top-5 left-1/2 grid size-11 -translate-x-1/2 place-items-center rounded-full font-serif text-xl font-bold text-white shadow-lg ring-4 ring-bg', i === 1 ? 'bg-gradient-to-br from-[#f3d27a] to-[#c08a2b]' : i === 0 ? 'bg-gradient-to-br from-slate-300 to-slate-500' : 'bg-gradient-to-br from-amber-600 to-amber-800')}>{i === 1 ? 1 : i === 0 ? 2 : 3}</div>
              </div>
              <div className="mt-3 line-clamp-2 font-serif font-bold group-hover:text-brand md:text-lg">{s.title}</div>
              <div className="text-xs text-muted">{s.author.name} · {fmt(s.views)} lượt đọc</div>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-12 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
        {rest.map((s, i) => (
          <Link key={s.id} href={`/truyen/${s.slug}`} className="group flex items-center gap-5 px-5 py-4 transition hover:bg-bg-soft">
            <span className="w-8 text-center font-serif text-2xl font-bold italic text-muted/50">{i + 4}</span>
            <Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} size="sm" className="w-12 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1"><div className="line-clamp-1 font-semibold group-hover:text-brand">{s.title}</div><div className="text-xs text-muted">{s.author.name} · {s.genre}</div></div>
            <div className="hidden gap-5 text-sm text-muted sm:flex"><span className="inline-flex items-center gap-1"><Eye className="size-4" />{fmt(s.views)}</span><span className="inline-flex items-center gap-1"><Heart className="size-4" />{fmt(s._count.likes)}</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
