'use client';
import Link from 'next/link';
import { BookOpen, ListChecks, Rss, Star } from 'lucide-react';
import { useApi } from '@/lib/auth';
import { RequireAuth } from '@/components/require-auth';
import { Cover } from '@/components/cover';
import { Empty, Skeleton } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { ago } from '@/lib/utils';

function Feed() {
  const { data } = useApi<any>('/feed');
  if (!data) return <Skeleton className="h-96" />;
  if (!data.items.length) return <Empty icon={<Rss />} title="Bảng tin còn trống" hint="Theo dõi tác giả và bạn đọc để thấy chương mới, đánh giá và danh sách của họ."><Button asChild><Link href="/bang-xep-hang">Tìm tác giả hay</Link></Button></Empty>;
  return (
    <div className="relative space-y-5 before:absolute before:bottom-0 before:left-5 before:top-0 before:w-px before:bg-line">
      {data.items.map((it: any, i: number) => {
        const s = it.chapter?.story || it.review?.story || it.list?.items[0]?.story;
        const Icon = it.type === 'chapter' ? BookOpen : it.type === 'review' ? Star : ListChecks;
        return (
          <div key={i} className="fade-up relative flex gap-5">
            <div className="z-10 grid size-10 shrink-0 place-items-center rounded-full border-4 border-bg bg-brand text-white"><Icon className="size-4" /></div>
            <div className="flex-1 rounded-3xl border border-line bg-card p-5">
              <div className="text-xs text-muted">{ago(it.at)}</div>
              {it.type === 'chapter' && (
                <Link href={`/truyen/${s.slug}/${it.chapter.number}`} className="group mt-2 flex gap-4">
                  <Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} size="sm" className="w-16 shrink-0 rounded-xl" />
                  <div><div className="text-sm"><b>{s.author.name}</b> vừa đăng chương mới</div><div className="mt-1 font-serif text-lg font-bold group-hover:text-brand">Chương {it.chapter.number}: {it.chapter.title}</div><div className="text-sm text-muted">{s.title}{it.chapter.price > 0 && ` · ${it.chapter.price} xu`}</div></div>
                </Link>
              )}
              {it.type === 'review' && (
                <Link href={`/truyen/${s.slug}`} className="group mt-2 flex gap-4">
                  <Cover title={s.title} seed={s.coverSeed} size="sm" className="w-16 shrink-0 rounded-xl" />
                  <div><div className="text-sm"><b>{it.review.user.name}</b> đánh giá <b>{s.title}</b> <span className="text-gold">{'★'.repeat(it.review.rating)}</span></div><p className="mt-1 font-serif text-fg/80">“{it.review.body}”</p></div>
                </Link>
              )}
              {it.type === 'list' && (
                <div className="mt-2"><div className="text-sm"><b>{it.list.owner.name}</b> tạo danh sách <b>{it.list.name}</b></div>
                  <div className="mt-3 flex gap-2">{it.list.items.map((x: any) => <Link key={x.storyId} href={`/truyen/${x.story.slug}`} className="w-14"><Cover title={x.story.title} seed={x.story.coverSeed} size="sm" className="rounded-lg" /></Link>)}</div></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default function P() {
  return <RequireAuth><div className="mx-auto max-w-2xl px-6 py-12"><h1 className="mb-8 font-serif text-4xl font-bold">Bảng tin</h1><Feed /></div></RequireAuth>;
}
