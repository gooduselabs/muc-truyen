'use client';
import Link from 'next/link';
import { Bell, BookOpen, Gift, MessageCircle, UserPlus, Wallet } from 'lucide-react';
import { useApi } from '@/lib/auth';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/require-auth';
import { Empty, Skeleton } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { ago, cn } from '@/lib/utils';
const ICON: Record<string, any> = { chapter: BookOpen, follow: UserPlus, comment: MessageCircle, tip: Gift, payout: Wallet };

function List() {
  const { data, reload } = useApi<any>('/notifications');
  if (!data) return <Skeleton className="h-64" />;
  return (
    <>
      <div className="mb-6 flex items-center justify-between"><h1 className="font-serif text-4xl font-bold">Thông báo</h1>{data.unread > 0 && <Button variant="outline" size="sm" onClick={async () => { await api('/notifications/read-all', { method: 'POST' }); reload(); }}>Đánh dấu đã đọc</Button>}</div>
      {data.items.length === 0 ? <Empty icon={<Bell />} title="Chưa có thông báo" /> : (
        <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
          {data.items.map((n: any) => { const I = ICON[n.type] || Bell; return (
            <Link key={n.id} href={n.link || '#'} onClick={() => api(`/notifications/${n.id}/read`, { method: 'POST' })} className={cn('flex gap-4 px-5 py-4 transition hover:bg-bg-soft', !n.read && 'bg-brand-soft/30')}>
              <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><I className="size-4" /></div>
              <div className="flex-1"><div className="font-medium">{n.title}</div>{n.body && <div className="text-sm text-muted">{n.body}</div>}<div className="mt-1 text-xs text-muted">{ago(n.createdAt)}</div></div>
              {!n.read && <span className="mt-2 size-2 rounded-full bg-brand" />}
            </Link>); })}
        </div>
      )}
    </>
  );
}
export default function P() { return <RequireAuth><div className="mx-auto max-w-2xl px-6 py-12"><List /></div></RequireAuth>; }
