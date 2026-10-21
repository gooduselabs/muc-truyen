'use client';
import Link from 'next/link';
import { BookmarkCheck, Eye, Heart, Plus, Star } from 'lucide-react';
import { useApi } from '@/lib/auth';
import { Cover } from '@/components/cover';
import { Button } from '@/components/ui/button';
import { Badge, Empty, Skeleton } from '@/components/ui/misc';
import { STATUS_LABEL, ago, fmt } from '@/lib/utils';

export default function StudioHome() {
  const { data } = useApi<any[]>('/studio/stories');
  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div><h1 className="font-serif text-4xl font-bold">Truyện của tôi</h1><p className="mt-1 text-muted">Quản lý truyện, chương, lịch đăng và giá.</p></div>
        <Button asChild><Link href="/studio/truyen/moi"><Plus />Truyện mới</Link></Button>
      </div>
      {!data ? <Skeleton className="h-64" /> : data.length === 0 ? <Empty title="Bạn chưa có truyện nào" hint="Mỗi câu chuyện lớn đều bắt đầu từ một dòng."><Button asChild><Link href="/studio/truyen/moi">Viết truyện đầu tiên</Link></Button></Empty> : (
        <div className="stagger space-y-4">
          {data.map((s) => (
            <Link key={s.id} href={`/studio/truyen/${s.id}`} className="group flex gap-5 rounded-3xl border border-line bg-card p-4 transition hover:border-brand hover:shadow-lg">
              <Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} size="sm" className="w-20 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 py-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-xl font-bold group-hover:text-brand">{s.title}</h2>
                  <Badge className={s.visibility === 'PUBLISHED' ? 'border-emerald-500/30 text-emerald-600' : ''}>{s.visibility === 'PUBLISHED' ? 'Đã xuất bản' : s.visibility === 'HIDDEN' ? 'Bị ẩn' : 'Bản nháp'}</Badge>
                  <Badge>{STATUS_LABEL[s.status]}</Badge>
                </div>
                <div className="mt-1 text-sm text-muted">{s.genre} · {s._count.chapters} chương · cập nhật {ago(s.updatedAt)}</div>
                <div className="mt-3 flex flex-wrap gap-5 text-sm">
                  <span className="inline-flex items-center gap-1.5"><Eye className="size-4 text-muted" />{fmt(s.views)}</span>
                  <span className="inline-flex items-center gap-1.5"><Heart className="size-4 text-muted" />{s._count.likes}</span>
                  <span className="inline-flex items-center gap-1.5"><BookmarkCheck className="size-4 text-muted" />{s._count.library}</span>
                  <span className="inline-flex items-center gap-1.5"><Star className="size-4 text-muted" />{s._count.reviews}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
