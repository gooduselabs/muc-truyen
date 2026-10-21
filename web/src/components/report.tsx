'use client';
import { useState } from 'react';
import { Flag } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Dialog } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/misc';
import { useToast } from './toast';
import { cn } from '@/lib/utils';

const REASONS = ['Nội dung vi phạm pháp luật', 'Đạo văn / vi phạm bản quyền', 'Sai nhãn độ tuổi', 'Quấy rối, xúc phạm', 'Spam / quảng cáo', 'Tiết lộ nội dung (spoiler)'];

export function ReportButton({ type, id, small }: { type: string; id: string; small?: boolean }) {
  const { me } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState('');
  if (!me) return null;
  const send = async () => {
    try { await api('/reports', { body: { targetType: type, targetId: id, reason, detail } }); toast('Đã gửi báo cáo. Cảm ơn bạn!'); setOpen(false); }
    catch (e: any) { toast(e.message, true); }
  };
  return (
    <>
      <button onClick={() => setOpen(true)} className={cn('inline-flex items-center gap-1 text-muted hover:text-brand', small ? 'text-xs' : 'text-sm')}><Flag className="size-3.5" />Báo cáo</button>
      <Dialog open={open} onOpenChange={setOpen} title="Báo cáo vi phạm">
        <div className="space-y-2">
          {REASONS.map((r) => (
            <label key={r} className={cn('flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm', reason === r ? 'border-brand bg-brand-soft/40' : 'border-line')}>
              <input type="radio" checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--brand)]" />{r}
            </label>
          ))}
        </div>
        <Textarea className="mt-3" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Mô tả thêm (không bắt buộc)" />
        <Button className="mt-4 w-full" onClick={send}>Gửi báo cáo</Button>
      </Dialog>
    </>
  );
}
