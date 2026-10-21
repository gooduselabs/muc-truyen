import Link from 'next/link';
import { Eye, Heart, BookOpen, Clock } from 'lucide-react';
import { Cover } from './cover';
import { ago, fmt, STATUS_LABEL, cn } from '@/lib/utils';

export interface StoryCardData {
  id: string; slug: string; title: string; synopsis: string; coverUrl?: string | null; coverSeed: number; genre: string; tags: string[];
  ageRating: string; status: string; views: number; lastChapterAt?: string | null; waitFreeHours?: number | null;
  author: { username: string; name: string }; _count?: { chapters: number; likes: number; library: number };
}

export function StoryCard({ s, className }: { s: StoryCardData; className?: string }) {
  return (
    <Link href={`/truyen/${s.slug}`} className={cn('group block', className)}>
      <div className="relative">
        <Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} genre={s.genre} className="transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_28px_50px_-20px_rgba(20,10,40,.6)]" />
        {s.waitFreeHours ? <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur"><Clock className="size-3" />Chờ miễn phí</span> : null}
        {s.ageRating !== 'ALL' && <span className="absolute bottom-2 right-2 rounded-md bg-white/90 px-1.5 text-[10px] font-bold text-black">{s.ageRating.replace('T', '')}+</span>}
      </div>
      <div className="mt-3 line-clamp-1 font-semibold transition-colors group-hover:text-brand">{s.title}</div>
      <div className="mt-0.5 line-clamp-1 text-xs text-muted">{s.author.name} · {STATUS_LABEL[s.status]}</div>
      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1"><Eye className="size-3" />{fmt(s.views)}</span>
        {s._count && <span className="inline-flex items-center gap-1"><Heart className="size-3" />{fmt(s._count.likes)}</span>}
        {s._count && <span className="inline-flex items-center gap-1"><BookOpen className="size-3" />{s._count.chapters} chương</span>}
      </div>
    </Link>
  );
}

export function StoryRow({ s, rank }: { s: StoryCardData; rank?: number }) {
  return (
    <Link href={`/truyen/${s.slug}`} className="group flex items-center gap-4 rounded-2xl p-2 transition hover:bg-bg-soft">
      {rank !== undefined && (
        <div className={cn('w-8 shrink-0 text-center font-serif text-3xl font-bold italic', rank < 3 ? 'text-brand' : 'text-muted/50')}>{rank + 1}</div>
      )}
      <Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} size="sm" className="w-14 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 font-semibold group-hover:text-brand">{s.title}</div>
        <div className="line-clamp-1 text-xs text-muted">{s.author.name} · {s.genre}</div>
        <div className="mt-1 flex gap-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1"><Eye className="size-3" />{fmt(s.views)}</span>
          {s.lastChapterAt && <span>{ago(s.lastChapterAt)}</span>}
        </div>
      </div>
    </Link>
  );
}
