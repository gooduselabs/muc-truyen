'use client';
import { useState } from 'react';
import { Banknote, Coins, Info } from 'lucide-react';
import { useApi, useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge, Card, Input, Label, Select, Skeleton } from '@/components/ui/misc';
import { AreaChart, fillDays } from '@/components/charts';
import { LedgerList } from '@/components/ledger';
import { useToast } from '@/components/toast';
import { vnd } from '@/lib/utils';

const ST: Record<string, [string, string]> = { PENDING: ['Chờ duyệt', 'text-sky-600'], PAID: ['Đã chuyển', 'text-emerald-600'], REJECTED: ['Từ chối', 'text-brand'], APPROVED: ['Đã duyệt', 'text-emerald-600'] };

export default function Earnings() {
  const { refresh } = useAuth();
  const toast = useToast();
  const w = useApi<any>('/wallet');
  const cfg = useApi<any>('/wallet/config');
  const ov = useApi<any>('/studio/analytics?days=30');
  const [f, setF] = useState({ coins: '', method: 'momo', account: '' });
  if (!w.data || !cfg.data) return <Skeleton className="h-96" />;
  const req = async () => {
    try { await api('/wallet/payouts', { body: { ...f, coins: Number(f.coins) } }); toast('Đã gửi yêu cầu rút tiền'); setF({ ...f, coins: '' }); w.reload(); refresh(); }
    catch (e: any) { toast(e.message, true); }
  };
  const earnLedger = w.data.ledger.filter((l: any) => l.account === 'EARNINGS');
  return (
    <div className="space-y-8">
      <div><h1 className="font-serif text-4xl font-bold">Thu nhập</h1><p className="mt-1 text-muted">Bạn nhận {Math.round(cfg.data.authorShare * 100)}% doanh thu chương và {Math.round(cfg.data.tipShare * 100)}% tiền ủng hộ.</p></div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2b1d0e] via-[#8a5a2b] to-[#c08a2b] p-8 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 size-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative text-sm text-white/70">Số dư có thể rút</div>
          <div className="relative mt-1 flex items-baseline gap-3 font-serif text-6xl font-bold"><Coins className="size-10" />{w.data.earnings}<span className="text-2xl font-normal text-white/70">xu</span></div>
          <div className="relative mt-1 text-white/80">≈ {vnd(w.data.earnings * cfg.data.coinVnd)}</div>
          {ov.data && <div className="relative mt-6"><AreaChart data={fillDays(ov.data.earningsDaily, 'coins', 30)} color="#fff3d6" height={110} /></div>}
        </div>
        <Card className="p-6">
          <div className="flex items-center gap-2 font-serif text-xl font-bold"><Banknote className="size-5 text-emerald-600" />Yêu cầu rút tiền</div>
          <div className="mt-5 space-y-4">
            <div><Label>Số xu (tối thiểu {cfg.data.minPayout})</Label><Input type="number" value={f.coins} onChange={(e) => setF({ ...f, coins: e.target.value })} placeholder={String(cfg.data.minPayout)} />{f.coins && <div className="mt-1 text-xs text-muted">≈ {vnd(Number(f.coins) * cfg.data.coinVnd)}</div>}</div>
            <div className="grid grid-cols-[130px_1fr] gap-2">
              <div><Label>Kênh</Label><Select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}><option value="momo">MoMo</option><option value="zalopay">ZaloPay</option><option value="bank">Ngân hàng</option></Select></div>
              <div><Label>Tài khoản nhận</Label><Input value={f.account} onChange={(e) => setF({ ...f, account: e.target.value })} placeholder="SĐT ví / STK – ngân hàng" /></div>
            </div>
            <Button className="w-full" onClick={req} disabled={!f.coins || !f.account}>Gửi yêu cầu</Button>
            <p className="flex gap-2 text-xs text-muted"><Info className="size-4 shrink-0" />Quản trị viên duyệt thủ công trong v0.1. Thu nhập từ 2 triệu đồng/lần có thể bị khấu trừ thuế TNCN theo quy định.</p>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div><h2 className="font-serif text-xl font-bold">Lịch sử rút tiền</h2>
          <div className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
            {w.data.payouts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div><div className="font-medium">{p.coins} xu · {vnd(p.amountVnd)}</div><div className="text-xs text-muted">{p.method.toUpperCase()} · {p.account} · {new Date(p.createdAt).toLocaleDateString('vi-VN')}</div></div>
                <Badge className={ST[p.status][1]}>{ST[p.status][0]}</Badge>
              </div>
            ))}
            {!w.data.payouts.length && <div className="p-8 text-center text-sm text-muted">Chưa có yêu cầu nào</div>}
          </div>
        </div>
        <div><h2 className="font-serif text-xl font-bold">Biến động thu nhập</h2><LedgerList items={earnLedger} /></div>
      </div>
    </div>
  );
}
