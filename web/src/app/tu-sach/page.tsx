'use client';
import Link from 'next/link';
import { BookMarked, History, ListChecks } from 'lucide-react';
import { useApi } from '@/lib/auth';
import { RequireAuth } from '@/components/require-auth';
import { Cover } from '@/components/cover';
import { Empty, Skeleton } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ago } from '@/lib/utils';

function Shelf({ items }: { items: any[] }) {
  return (
    <div className="stagger grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
      {items.map((s) => {
        const total = s._count.chapters || 1;
        const at = s.progress?.chapterNo || 0;
        return (
          <Link key={s.id} href={at ? `/truyen/${s.slug}/${at}` : `/truyen/${s.slug}`} className="group">
            <Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} genre={s.genre} className="transition group-hover:-translate-y-1" />
            <div className="mt-3 line-clamp-1 font-semibold group-hover:text-brand">{s.title}</div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-bg-soft"><div className="h-full bg-gradient-to-r from-brand to-gold" style={{ width: `${(at / total) * 100}%` }} /></div>
            <div className="mt-1 text-xs text-muted">{at ? `Chương ${at}/${total}` : 'Chưa đọc'}{s.progress && ` · ${ago(s.progress.updatedAt)}`}</div>
          </Link>
        );
      })}
    </div>
  );
}

function Library() {
  const lib = useApi<any[]>('/me/library');
  const hist = useApi<any[]>('/me/history');
  const lists = useApi<any[]>('/me/lists');
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-serif text-4xl font-bold">Tủ sách</h1>
      <Tabs defaultValue="lib" className="mt-8">
        <TabsList>
          <TabsTrigger value="lib"><BookMarked className="mr-1.5 inline size-4" />Đã lưu</TabsTrigger>
          <TabsTrigger value="hist"><History className="mr-1.5 inline size-4" />Lịch sử</TabsTrigger>
          <TabsTrigger value="lists"><ListChecks className="mr-1.5 inline size-4" />Danh sách</TabsTrigger>
        </TabsList>
        <TabsContent value="lib">{!lib.data ? <Skeleton className="h-64" /> : lib.data.length ? <Shelf items={lib.data} /> : <Empty icon={<BookMarked />} title="Tủ sách trống" hint="Bấm “Thêm vào tủ” ở trang truyện để lưu lại."><Button asChild><Link href="/kham-pha">Khám phá truyện</Link></Button></Empty>}</TabsContent>
        <TabsContent value="hist">{hist.data?.length ? <Shelf items={hist.data} /> : <Empty title="Chưa đọc truyện nào" />}</TabsContent>
        <TabsContent value="lists">
          {lists.data?.length ? <div className="grid gap-5 md:grid-cols-2">{lists.data.map((l) => (
            <div key={l.id} className="rounded-3xl border border-line bg-card p-6">
              <div className="flex items-center justify-between"><div className="font-serif text-xl font-bold">{l.name}</div><span className="text-xs text-muted">{l.isPublic ? 'Công khai' : 'Riêng tư'}</span></div>
              <p className="text-sm text-muted">{l.description}</p>
              <div className="mt-4 flex gap-3">{l.items.slice(0, 6).map((i: any) => <Link key={i.storyId} href={`/truyen/${i.story.slug}`} className="w-16"><Cover title={i.story.title} seed={i.story.coverSeed} size="sm" className="rounded-lg" /></Link>)}</div>
            </div>))}</div> : <Empty title="Chưa có danh sách" hint="Tạo danh sách từ nút ☰+ ở trang truyện." />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default function P() { return <RequireAuth><Library /></RequireAuth>; }
