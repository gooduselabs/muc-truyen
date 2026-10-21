'use client';
import Link from 'next/link';
import { use, useState } from 'react';
import { CalendarDays, Star, UserCheck, UserPlus } from 'lucide-react';
import { useApi, useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { StoryCard } from '@/components/story-card';
import { Cover } from '@/components/cover';
import { Button } from '@/components/ui/button';
import { Empty, Skeleton, Badge } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ago } from '@/lib/utils';

export default function Profile({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { me } = useAuth();
  const { data: u, setData, error } = useApi<any>(`/users/${username}`);
  const [busy, setBusy] = useState(false);
  if (error) return <div className="py-32 text-center font-serif text-2xl">{error}</div>;
  if (!u) return <div className="mx-auto max-w-5xl px-6 py-16"><Skeleton className="h-48" /></div>;
  const follow = async () => {
    if (!me) { location.href = '/dang-nhap'; return; }
    setBusy(true);
    const r = await api(`/users/${username}/follow`, { method: u.isFollowing ? 'DELETE' : 'POST' });
    setData({ ...u, isFollowing: r.following, followers: u.followers + (r.following ? 1 : -1) }); setBusy(false);
  };
  return (
    <div>
      <div className="h-44 bg-gradient-to-br from-[#1d1838] via-[#4b2a7b] to-brand md:h-56" />
      <div className="mx-auto max-w-5xl px-6">
        <div className="-mt-14 flex flex-wrap items-end gap-6">
          <div className="grid size-28 place-items-center rounded-[2rem] border-4 border-bg bg-gradient-to-br from-brand to-gold font-serif text-5xl font-bold text-white shadow-xl">{u.name[0]}</div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2"><h1 className="font-serif text-3xl font-bold">{u.name}</h1>{u.role !== 'READER' && <Badge className="border-brand/30 bg-brand-soft text-brand">{u.role === 'ADMIN' ? 'Quản trị' : 'Tác giả'}</Badge>}</div>
            <div className="text-sm text-muted">@{u.username} · <CalendarDays className="inline size-3.5" /> tham gia {ago(u.createdAt)}</div>
          </div>
          {me?.username !== u.username && <Button onClick={follow} disabled={busy} variant={u.isFollowing ? 'outline' : 'default'}>{u.isFollowing ? <><UserCheck />Đang theo dõi</> : <><UserPlus />Theo dõi</>}</Button>}
        </div>
        <p className="mt-5 max-w-2xl text-fg/80">{u.bio || 'Chưa có giới thiệu.'}</p>
        <div className="mt-5 flex gap-8 text-sm">
          <div><b className="font-serif text-xl">{u.followers}</b> <span className="text-muted">người theo dõi</span></div>
          <div><b className="font-serif text-xl">{u.following}</b> <span className="text-muted">đang theo dõi</span></div>
          <div><b className="font-serif text-xl">{u.stories.length}</b> <span className="text-muted">truyện</span></div>
        </div>
        <Tabs defaultValue={u.stories.length ? 'stories' : 'lists'} className="mt-10">
          <TabsList>
            <TabsTrigger value="stories">Truyện đã viết</TabsTrigger>
            <TabsTrigger value="lists">Danh sách đọc</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          </TabsList>
          <TabsContent value="stories">
            {u.stories.length ? <div className="stagger grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-5">{u.stories.map((s: any) => <StoryCard key={s.id} s={s} />)}</div> : <Empty title="Chưa có truyện nào" />}
          </TabsContent>
          <TabsContent value="lists">
            {u.lists.length ? <div className="grid gap-5 md:grid-cols-2">{u.lists.map((l: any) => (
              <div key={l.id} className="rounded-3xl border border-line bg-card p-5">
                <div className="font-serif text-lg font-bold">{l.name}</div><div className="text-sm text-muted">{l.description} · {l._count.items} truyện</div>
                <div className="mt-4 flex gap-2">{l.items.map((i: any) => <Link key={i.storyId} href={`/truyen/${i.story.slug}`} className="w-16"><Cover title={i.story.title} seed={i.story.coverSeed} url={i.story.coverUrl} size="sm" className="rounded-lg" /></Link>)}</div>
              </div>))}</div> : <Empty title="Chưa có danh sách công khai" />}
          </TabsContent>
          <TabsContent value="reviews">
            {u.reviews.length ? <div className="space-y-4">{u.reviews.map((r: any) => (
              <Link key={r.id} href={`/truyen/${r.story.slug}`} className="flex gap-4 rounded-3xl border border-line bg-card p-4 hover:border-brand">
                <Cover title={r.story.title} seed={r.story.coverSeed} size="sm" className="w-14 shrink-0 rounded-lg" />
                <div><div className="font-semibold">{r.story.title}</div><div className="flex">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="size-3.5 fill-gold text-gold" />)}</div><p className="mt-1 font-serif text-sm text-fg/80">{r.body}</p></div>
              </Link>))}</div> : <Empty title="Chưa có đánh giá" />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
