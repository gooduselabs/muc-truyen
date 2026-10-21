import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
export const LEDGER_TYPE: Record<string, string> = { TOPUP: 'Nạp xu', UNLOCK: 'Mua chương', RENTAL: 'Thuê chương 48h', TIP_SENT: 'Ủng hộ tác giả', TIP_RECEIVED: 'Nhận ủng hộ', SALE: 'Doanh thu chương', PAYOUT: 'Rút tiền', PAYOUT_REFUND: 'Hoàn rút tiền', BONUS: 'Quà tặng', ADJUST: 'Điều chỉnh' };
export function LedgerList({ items }: { items: any[] }) {
  return (
    <div className="mt-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
      {items.map((l: any) => (
        <div key={l.id} className="flex items-center gap-3 px-4 py-3">
          <div className={cn('grid size-9 place-items-center rounded-full', l.amount > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-brand-soft text-brand')}>{l.amount > 0 ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</div>
          <div className="min-w-0 flex-1"><div className="text-sm font-medium">{LEDGER_TYPE[l.type] || l.type}</div><div className="truncate text-xs text-muted">{l.note} · {new Date(l.createdAt).toLocaleDateString('vi-VN')}</div></div>
          <div className={cn('font-mono text-sm font-bold', l.amount > 0 ? 'text-emerald-600' : 'text-fg')}>{l.amount > 0 ? '+' : ''}{l.amount}</div>
        </div>
      ))}
      {items.length === 0 && <div className="p-8 text-center text-sm text-muted">Chưa có giao dịch</div>}
    </div>
  );
}
