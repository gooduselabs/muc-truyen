'use client';
import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, ExternalLink, FileText, ImageUp, Lock, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/auth';
import { Cover } from '@/components/cover';
import { Button } from '@/components/ui/button';
import { Badge, Card, Input, Label, Select, Skeleton, Textarea } from '@/components/ui/misc';
import { useToast } from '@/components/toast';
import { ago, cn, fmt } from '@/lib/utils';

const EMPTY = { title: '', synopsis: '', genre: 'Huyền huyễn', tags: '', ageRating: 'ALL', status: 'ONGOING', visibility: 'DRAFT', waitFreeHours: '', coverUrl: '' };
const CH_STATUS: Record<string, [string, string]> = { DRAFT: ['Nháp', ''], SCHEDULED: ['Hẹn giờ', 'border-sky-500/30 text-sky-600'], PUBLISHED: ['Đã đăng', 'border-emerald-500/30 text-emerald-600'] };

export default function StoryEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'moi';
  const router = useRouter();
  const toast = useToast();
  const genres = useApi<string[]>('/stories/genres');
  const story = useApi<any>(isNew ? null : `/studio/stories/${id}`);
  const [f, setF] = useState<any>(EMPTY);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (story.data) { const s = story.data; setF({ ...s, tags: s.tags.join(', '), waitFreeHours: s.waitFreeHours ?? '', coverUrl: s.coverUrl ?? '' }); } }, [story.data]);

  const save = async () => {
    setBusy(true);
    try {
      const body = { title: f.title, synopsis: f.synopsis, genre: f.genre, tags: f.tags, ageRating: f.ageRating, status: f.status, visibility: f.visibility, coverUrl: f.coverUrl, waitFreeHours: f.waitFreeHours ? Number(f.waitFreeHours) : null };
      if (isNew) { const s = await api('/studio/stories', { body }); toast('Đã tạo truyện'); router.replace(`/studio/truyen/${s.id}`); }
      else { await api(`/studio/stories/${id}`, { method: 'PATCH', body }); toast('Đã lưu thay đổi'); story.reload(); }
    } catch (e: any) { toast(e.message, true); }
    setBusy(false);
  };
  const upload = async (file: File) => {
    const form = new FormData(); form.append('file', file);
    try { const r = await api('/uploads', { form }); setF({ ...f, coverUrl: r.url }); toast('Đã tải ảnh bìa — nhớ bấm Lưu'); } catch (e: any) { toast(e.message, true); }
  };
  const newChapter = async () => { const c = await api(`/studio/stories/${id}/chapters`, { body: { title: `Chương ${(story.data?.chapters.length ?? 0) + 1}` } }); router.push(`/studio/chuong/${c.id}`); };
  const del = async () => { if (!confirm('Xoá truyện này và toàn bộ chương?')) return; await api(`/studio/stories/${id}`, { method: 'DELETE' }); router.push('/studio'); };

  if (!isNew && !story.data) return <Skeleton className="h-96" />;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><Link href="/studio" className="text-sm text-muted hover:text-fg">← Truyện của tôi</Link><h1 className="mt-1 font-serif text-4xl font-bold">{isNew ? 'Truyện mới' : f.title}</h1></div>
        <div className="flex gap-2">
          {!isNew && story.data?.visibility === 'PUBLISHED' && <Button variant="outline" asChild><Link href={`/truyen/${story.data.slug}`} target="_blank"><ExternalLink />Xem trang truyện</Link></Button>}
          <Button onClick={save} disabled={busy || !f.title}>{isNew ? 'Tạo truyện' : 'Lưu'}</Button>
        </div>
      </div>
      <Card className="grid gap-8 p-6 md:grid-cols-[200px_1fr]">
        <div>
          <Cover title={f.title || 'Tên truyện'} seed={story.data?.coverSeed ?? 7} url={f.coverUrl} genre={f.genre} />
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => fileRef.current?.click()}><ImageUp />Tải ảnh bìa</Button>
          {f.coverUrl && <button className="mt-2 w-full text-xs text-muted hover:text-brand" onClick={() => setF({ ...f, coverUrl: '' })}>Dùng bìa tự tạo</button>}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Tên truyện</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Tên thật kêu nhé" className="font-serif text-lg" /></div>
          <div className="sm:col-span-2"><Label>Giới thiệu</Label><Textarea rows={5} value={f.synopsis} onChange={(e) => setF({ ...f, synopsis: e.target.value })} placeholder="Vài câu khiến người đọc không thể bỏ qua…" /></div>
          <div><Label>Thể loại</Label><Select value={f.genre} onChange={(e) => setF({ ...f, genre: e.target.value })}>{(genres.data || []).map((g) => <option key={g}>{g}</option>)}</Select></div>
          <div><Label>Thẻ (cách nhau bởi dấu phẩy)</Label><Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="thanh xuân, chữa lành" /></div>
          <div><Label>Độ tuổi</Label><Select value={f.ageRating} onChange={(e) => setF({ ...f, ageRating: e.target.value })}><option value="ALL">Mọi lứa tuổi</option><option value="T13">13+</option><option value="T16">16+</option><option value="T18">18+</option></Select></div>
          <div><Label>Tình trạng</Label><Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="ONGOING">Đang ra</option><option value="COMPLETED">Hoàn thành</option><option value="HIATUS">Tạm ngưng</option></Select></div>
          <div><Label>Chờ là miễn phí (giờ / vé)</Label><Input type="number" min={0} value={f.waitFreeHours} onChange={(e) => setF({ ...f, waitFreeHours: e.target.value })} placeholder="Để trống = tắt · gợi ý 24" /></div>
          <div><Label>Hiển thị</Label><Select value={f.visibility} onChange={(e) => setF({ ...f, visibility: e.target.value })}><option value="DRAFT">Bản nháp (chỉ mình tôi)</option><option value="PUBLISHED">Xuất bản</option></Select></div>
        </div>
      </Card>

      {!isNew && (
        <div>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl font-bold">Chương</h2><Button onClick={newChapter}><Plus />Viết chương mới</Button></div>
          <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
            {story.data.chapters.map((c: any) => (
              <Link key={c.id} href={`/studio/chuong/${c.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-bg-soft">
                <FileText className="size-5 text-muted" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">Chương {c.number}: {c.title}</div>
                  <div className="text-xs text-muted">{fmt(c.wordCount)} chữ · {c.status === 'SCHEDULED' ? <><CalendarClock className="inline size-3" /> đăng lúc {new Date(c.publishAt).toLocaleString('vi-VN')}</> : `sửa ${ago(c.updatedAt)}`}{c.status === 'PUBLISHED' && ` · ${fmt(c.views)} lượt đọc`}</div>
                </div>
                {c.price > 0 && <Badge className="border-gold/40 text-gold"><Lock className="size-3" />{c.price} xu</Badge>}
                <Badge className={cn(CH_STATUS[c.status][1])}>{CH_STATUS[c.status][0]}</Badge>
              </Link>
            ))}
            {story.data.chapters.length === 0 && <div className="px-5 py-10 text-center text-sm text-muted">Chưa có chương nào.</div>}
          </div>
          <button onClick={del} className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand"><Trash2 className="size-4" />Xoá truyện</button>
        </div>
      )}
    </div>
  );
}
