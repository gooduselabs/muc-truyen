import Link from 'next/link';
import { Search } from 'lucide-react';
import { sget } from '@/lib/api';
import { StoryCard } from '@/components/story-card';
import { Empty } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Khám phá' };

export default async function Explore({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v)).toString();
  const [res, genres] = await Promise.all([sget(`/discover/search?${qs}`), sget<string[]>('/stories/genres')]);
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as any);
    return `/kham-pha?${p}`;
  };
  const chip = (active: boolean) => cn('shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition', active ? 'border-fg bg-fg text-bg' : 'border-line hover:border-fg');
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-serif text-4xl font-bold md:text-5xl">Khám phá</h1>
      <form className="relative mt-6 max-w-2xl" action="/kham-pha">
        <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={sp.q} placeholder="Gõ có dấu hay không dấu đều được: “kiem hiep”, “đà lạt”, “Linh An”…"
          className="h-14 w-full rounded-full border border-line bg-card pl-14 pr-5 text-base shadow-sm outline-none focus:border-brand focus:ring-4 focus:ring-[var(--ring)]" />
        {sp.genre && <input type="hidden" name="genre" value={sp.genre} />}
      </form>
      <div className="mt-8 space-y-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Link href={link({ genre: undefined })} className={chip(!sp.genre)}>Tất cả</Link>
          {(genres || []).map((g) => <Link key={g} href={link({ genre: g })} className={chip(sp.genre === g)}>{g}</Link>)}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Trạng thái:</span>
          {[['', 'Tất cả'], ['ONGOING', 'Đang ra'], ['COMPLETED', 'Hoàn thành']].map(([v, l]) => <Link key={v} href={link({ status: v || undefined })} className={chip((sp.status || '') === v)}>{l}</Link>)}
          <span className="ml-4 text-muted">Sắp xếp:</span>
          {[['relevance', 'Phổ biến'], ['new', 'Mới cập nhật'], ['likes', 'Yêu thích']].map(([v, l]) => <Link key={v} href={link({ sort: v })} className={chip((sp.sort || 'relevance') === v)}>{l}</Link>)}
          {sp.tag && <Link href={link({ tag: undefined })} className="rounded-full bg-brand px-3.5 py-1.5 font-semibold text-white">#{sp.tag} ✕</Link>}
        </div>
      </div>
      <div className="mt-4 text-sm text-muted">{res?.total ?? 0} truyện{sp.q && <> cho “<b className="text-fg">{sp.q}</b>”</>}</div>
      {res?.items?.length ? (
        <div className="stagger mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{res.items.map((s: any) => <StoryCard key={s.id} s={s} />)}</div>
      ) : <div className="mt-8"><Empty icon={<Search />} title="Không tìm thấy truyện phù hợp" hint="Thử từ khoá khác hoặc bỏ bớt bộ lọc." /></div>}
    </div>
  );
}
