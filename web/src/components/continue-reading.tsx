'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Cover } from './cover';
import { SectionTitle } from './ui/misc';

export function ContinueReading() {
  const { me } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { if (me) api('/me/history').then(setItems).catch(() => {}); }, [me]);
  if (!me || !items.length) return null;
  return (
    <section>
      <SectionTitle kicker={`Chào ${me.name}`} title="Đọc tiếp nhé" />
      <div className="no-scrollbar -mx-6 flex gap-4 overflow-x-auto px-6 pb-2">
        {items.slice(0, 8).map((s) => {
          const pct = Math.round((s.progress.chapterNo / Math.max(1, s._count.chapters)) * 100);
          return (
            <Link key={s.id} href={`/truyen/${s.slug}/${s.progress.chapterNo}`} className="group flex w-80 shrink-0 gap-4 rounded-3xl border border-line bg-card p-3 transition hover:-translate-y-0.5 hover:border-brand">
              <Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} size="sm" className="w-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 py-1">
                <div className="line-clamp-1 font-semibold group-hover:text-brand">{s.title}</div>
                <div className="mt-0.5 text-xs text-muted">Chương {s.progress.chapterNo}/{s._count.chapters}</div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-soft"><div className="h-full rounded-full bg-gradient-to-r from-brand to-gold" style={{ width: `${pct}%` }} /></div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand"><BookOpen className="size-3" />Đọc tiếp</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
