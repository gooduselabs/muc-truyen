'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Ban, Check, EyeOff, Flag, Shield, Users, BookOpen, Coins, Wallet, X } from 'lucide-react';
import { useApi } from '@/lib/auth';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Badge, Card, Empty, Input, Skeleton } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/toast';
import { ago, cn, fmt, vnd } from '@/lib/utils';

const TT: Record<string, string> = { story: 'Truyện', chapter: 'Chương', comment: 'Bình luận', review: 'Đánh giá', user: 'Người dùng' };

function Admin() {
  const toast = useToast();
  const stats = useApi<any>('/admin/stats');
  const [status, setStatus] = useState('OPEN');
  const reports = useApi<any[]>(`/admin/reports?status=${status}`);
  const payouts = useApi<any[]>('/admin/payouts');
  const [q, setQ] = useState('');
  const users = useApi<any[]>(`/admin/users?q=${encodeURIComponent(q)}`);
  const act = async (id: string, action: string) => { await api(`/admin/reports/${id}`, { body: { action } }); toast('Đã xử lý báo cáo'); reports.reload(); stats.reload(); };
  const pay = async (id: string, action: string) => { try { await api(`/admin/payouts/${id}`, { body: { action } }); toast(action === 'approve' ? 'Đã duyệt chi trả' : 'Đã từ chối & hoàn xu'); payouts.reload(); stats.reload(); } catch (e: any) { toast(e.message, true); } };
  const ban = async (u: any) => { await api(`/admin/users/${u.id}`, { body: { banned: !u.banned } }); users.reload(); };
  const s = stats.data;
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-fg text-bg"><Shield className="size-5" /></div><div><h1 className="font-serif text-4xl font-bold">Quản trị</h1><p className="text-sm text-muted">Kiểm duyệt nội dung, xử lý báo cáo, duyệt chi trả.</p></div></div>
      {s && (
        <div className="stagger mt-8 grid grid-cols-2 gap-4 md:grid-cols-6">
          {[[Users, 'Người dùng', fmt(s.users)], [BookOpen, 'Truyện', fmt(s.stories)], [BookOpen, 'Chương', fmt(s.chapters)], [Flag, 'Báo cáo mở', s.openReports], [Wallet, 'Chờ chi trả', s.pendingPayouts], [Coins, 'Doanh thu (sandbox)', vnd(s.revenueVnd)]].map(([I, l, v]: any) => (
            <Card key={l} className="p-4"><I className="size-4 text-muted" /><div className="mt-2 font-serif text-2xl font-bold">{v}</div><div className="text-xs text-muted">{l}</div></Card>
          ))}
        </div>
      )}
      <Tabs defaultValue="reports" className="mt-10">
        <TabsList><TabsTrigger value="reports">Báo cáo vi phạm</TabsTrigger><TabsTrigger value="payouts">Chi trả tác giả</TabsTrigger><TabsTrigger value="users">Người dùng</TabsTrigger></TabsList>
        <TabsContent value="reports">
          <div className="mb-4 flex gap-2">{[['OPEN', 'Đang mở'], ['RESOLVED', 'Đã xử lý'], ['DISMISSED', 'Bỏ qua']].map(([k, l]) => <button key={k} onClick={() => setStatus(k)} className={cn('rounded-full border px-4 py-1.5 text-sm font-semibold', status === k ? 'border-fg bg-fg text-bg' : 'border-line')}>{l}</button>)}</div>
          {!reports.data ? <Skeleton className="h-40" /> : !reports.data.length ? <Empty icon={<Check />} title="Không có báo cáo nào" hint="Cộng đồng đang rất ngoan 🌿" /> : (
            <div className="space-y-3">
              {reports.data.map((r) => (
                <Card key={r.id} className="flex flex-wrap items-start gap-4 p-5">
                  <div className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand"><Flag className="size-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><Badge>{TT[r.targetType]}</Badge><span className="font-semibold">{r.reason}</span><span className="text-xs text-muted">bởi @{r.reporter.username} · {ago(r.createdAt)}</span></div>
                    {r.detail && <p className="mt-1 text-sm text-muted">{r.detail}</p>}
                    <div className="mt-3 rounded-2xl bg-bg-soft p-3 text-sm">
                      {r.target ? (r.target.body ? <>“{r.target.body}” <span className="text-xs text-muted">— @{r.target.user?.username}{r.target.hidden && ' · đã ẩn'}</span></>
                        : r.target.title ? <Link href={`/truyen/${r.target.slug || r.target.story?.slug}`} className="font-semibold text-brand hover:underline">{r.target.story?.title ? `${r.target.story.title} · ` : ''}{r.target.title}</Link>
                        : <>@{r.target.username}</>) : <span className="text-muted">Đối tượng đã bị xoá</span>}
                    </div>
                  </div>
                  {r.status === 'OPEN' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => act(r.id, 'dismiss')}><X />Bỏ qua</Button>
                      <Button size="sm" variant="soft" onClick={() => act(r.id, 'hide')}><EyeOff />Ẩn nội dung</Button>
                      <Button size="sm" onClick={() => act(r.id, 'ban')}><Ban />Khoá tài khoản</Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="payouts">
          <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
            {(payouts.data || []).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1"><div className="font-semibold">{p.user.name} <span className="text-sm font-normal text-muted">@{p.user.username}</span></div><div className="text-sm text-muted">{p.coins} xu · {vnd(p.amountVnd)} · {p.method.toUpperCase()} {p.account} · {ago(p.createdAt)}</div></div>
                {p.status === 'PENDING' ? <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => pay(p.id, 'reject')}>Từ chối</Button><Button size="sm" onClick={() => pay(p.id, 'approve')}><Check />Đã chuyển khoản</Button></div> : <Badge>{p.status === 'PAID' ? 'Đã chi' : 'Từ chối'}</Badge>}
              </div>
            ))}
            {payouts.data && !payouts.data.length && <div className="p-8 text-center text-sm text-muted">Không có yêu cầu</div>}
          </div>
        </TabsContent>
        <TabsContent value="users">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo username hoặc email…" className="mb-4 max-w-sm" />
          <div className="overflow-hidden rounded-3xl border border-line bg-card">
            <table className="w-full text-sm">
              <thead className="bg-bg-soft text-left text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">Người dùng</th><th>Vai trò</th><th>Xu</th><th>Thu nhập</th><th>Tham gia</th><th></th></tr></thead>
              <tbody className="divide-y divide-line">
                {(users.data || []).map((u) => (
                  <tr key={u.id}><td className="px-4 py-3"><div className="font-medium">{u.name}</div><div className="text-xs text-muted">{u.email}</div></td><td>{u.role}</td><td>{u.coins}</td><td>{u.earnings}</td><td className="text-muted">{ago(u.createdAt)}</td>
                    <td className="pr-4 text-right">{u.role !== 'ADMIN' && <Button size="sm" variant={u.banned ? 'outline' : 'ghost'} onClick={() => ban(u)}>{u.banned ? 'Mở khoá' : 'Khoá'}</Button>}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default function P() { return <RequireAuth role="ADMIN"><Admin /></RequireAuth>; }
