import Link from 'next/link';
import { Eye, Heart, BookOpen, Clock } from 'lucide-react';
import { Cover } from './cover';
import { ago, fmt, STATUS_LABEL, cn } from '@/lib/utils';
import { Tilt } from './motion';
import { Pin, BadgeCheck } from 'lucide-react';

export interface StoryCardData {
  id: string; slug: string; title: string; synopsis: string; coverUrl?: string | null; coverSeed: number; genre: string; tags: string[];
  ageRating: string; status: string; views: number; lastChapterAt?: string | null; waitFreeHours?: number | null;
  pinned?: boolean; featured?: boolean; rankBoost?: number;
  author: { username: string; name: string; verified?: boolean }; _count?: { chapters: number; likes: number; library: number };
}

export function StoryCard({ s, className }: { s: StoryCardData; className?: string }) {
  return (
    <Link href={`/truyen/${s.slug}`} className={cn('group block', className)}>
      <div className="relative">
        <Tilt><Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} genre={s.genre} /></Tilt>
        {s.pinned && <span className="absolute -left-1.5 -top-1.5 z-10 grid size-7 place-items-center rounded-full bg-brand text-white shadow-lg"><Pin className="size-3.5" /></span>}
        {s.waitFreeHours ? <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur"><Clock className="size-3" />Chờ miễn phí</span> : null}
        {s.ageRating !== 'ALL' && <span className="absolute bottom-2 right-2 rounded-md bg-white/90 px-1.5 text-[10px] font-bold text-black">{s.ageRating.replace('T', '')}+</span>}
      </div>
      <div className="mt-3 line-clamp-1 font-display text-[17px] font-bold transition-colors group-hover:text-brand">{s.title}</div>
      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted"><span className="line-clamp-1">{s.author.name}</span>{s.author.verified && <BadgeCheck className="size-3.5 shrink-0 text-jade" />}<span>· {STATUS_LABEL[s.status]}</span></div>
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
        <div className={cn('w-8 shrink-0 text-center font-display text-3xl font-black italic', rank < 3 ? 'text-brand' : 'text-muted/50')}>{rank + 1}</div>
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
