'use client';
import { useState } from 'react';
import { Coins, Info, Sparkles } from 'lucide-react';
import { useApi, useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { useToast } from '@/components/toast';
import { cn, vnd } from '@/lib/utils';
import { LedgerList } from '@/components/ledger';



function Wallet() {
  const { refresh } = useAuth();
  const toast = useToast();
  const cfg = useApi<any>('/wallet/config');
  const w = useApi<any>('/wallet');
  const [pkg, setPkg] = useState('p120');
  const [provider, setProvider] = useState('sandbox');
  const [busy, setBusy] = useState(false);
  if (!cfg.data || !w.data) return <Skeleton className="h-96" />;
  const buy = async () => {
    setBusy(true);
    try {
      const r = await api('/wallet/topup', { body: { packageId: pkg, provider, returnUrl: location.href } });
      if (r.payUrl) location.href = r.payUrl;
      else { toast('Nạp xu thành công (sandbox) 🎉'); await Promise.all([w.reload(), refresh()]); }
    } catch (e: any) { toast(e.message, true); }
    setBusy(false);
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div>
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1d1838] via-[#3b2466] to-[#7a2e45] p-8 text-white shadow-2xl">
          <div className="absolute -right-10 -top-10 size-56 rounded-full bg-gold/30 blur-3xl" />
          <div className="relative text-sm text-white/70">Số dư xu</div>
          <div className="relative mt-1 flex items-baseline gap-2 font-serif text-6xl font-bold"><Coins className="size-10 text-[#f3d27a]" />{w.data.coins}</div>
          <div className="relative mt-2 text-sm text-white/60">1 xu = {vnd(cfg.data.coinVnd)} · Thuê 48h = {Math.round(cfg.data.rentalRatio * 100)}% giá mua</div>
          {w.data.earnings > 0 && <div className="relative mt-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm">Thu nhập tác giả: <b>{w.data.earnings} xu</b></div>}
        </div>
        <h2 className="mt-10 font-serif text-2xl font-bold">Chọn gói xu</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {cfg.data.packages.map((p: any) => (
            <button key={p.id} onClick={() => setPkg(p.id)} className={cn('relative rounded-3xl border-2 p-5 text-left transition hover:-translate-y-0.5', pkg === p.id ? 'border-gold bg-gold/5 shadow-lg' : 'border-line bg-card')}>
              {p.bonus > 0 && <span className="absolute -top-2.5 right-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">+{p.bonus} thưởng</span>}
              <Coins className="size-6 text-gold" />
              <div className="mt-2 font-serif text-3xl font-bold">{p.coins + p.bonus}</div>
              <div className="text-sm text-muted">{vnd(p.vnd)}</div>
            </button>
          ))}
        </div>
        <h2 className="mt-8 font-serif text-xl font-bold">Phương thức thanh toán</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {cfg.data.providers.map((p: any) => (
            <button key={p.id} disabled={!p.enabled} onClick={() => setProvider(p.id)} className={cn('rounded-2xl border-2 px-4 py-3 text-left text-sm transition disabled:opacity-40', provider === p.id ? 'border-brand' : 'border-line bg-card')}>
              <div className="font-semibold">{p.label}</div><div className="text-xs text-muted">{p.enabled ? 'Sẵn sàng' : 'Chưa cấu hình khoá merchant'}</div>
            </button>
          ))}
        </div>
        <Button size="lg" variant="gold" className="mt-6 w-full md:w-auto" disabled={busy} onClick={buy}><Sparkles />Nạp ngay</Button>
        <p className="mt-4 flex gap-2 rounded-2xl bg-bg-soft p-4 text-xs leading-relaxed text-muted"><Info className="size-4 shrink-0" />Bản v0.1 chỉ dùng cổng <b>sandbox</b> — không trừ tiền thật. Trong ứng dụng iOS/Android, việc bán xu (nội dung số) phải dùng In-App Purchase của Apple/Google; trên web có thể dùng MoMo/VNPay/ZaloPay.</p>
      </div>
      <div>
        <h2 className="font-serif text-xl font-bold">Lịch sử giao dịch</h2>
        <LedgerList items={w.data.ledger} />
      </div>
    </div>
  );
}

export default function P() { return <RequireAuth><div className="mx-auto max-w-6xl px-6 py-12"><h1 className="mb-8 font-serif text-4xl font-bold">Ví xu</h1><Wallet /></div></RequireAuth>; }
