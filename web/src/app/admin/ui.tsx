'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Panel({ title, sub, action, children, className }: { title?: string; sub?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={cn('sheet rounded-3xl p-5 md:p-6', className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>{title && <h3 className="font-display text-xl font-bold">{title}</h3>}{sub && <p className="text-sm text-muted">{sub}</p>}</div>
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export function Pill({ on, children, onClick, tone = 'brand' }: { on?: boolean; children: React.ReactNode; onClick?: () => void; tone?: 'brand' | 'jade' | 'gold' | 'muted' }) {
  const c = { brand: 'border-brand/40 bg-brand/10 text-brand', jade: 'border-jade/40 bg-jade/10 text-jade', gold: 'border-gold/40 bg-gold/10 text-gold', muted: 'border-line bg-bg-soft text-muted' }[tone];
  return (
    <button type="button" onClick={onClick} className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition', on ? c : 'border-line text-muted hover:border-fg/30', !onClick && 'cursor-default')}>
      {children}
    </button>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', on ? 'bg-jade' : 'bg-line')}>
      <motion.span layout className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow', on ? 'right-0.5' : 'left-0.5')} />
    </button>
  );
}

export function Kpi({ icon: I, label, value, sub, tone = 'brand', i = 0 }: { icon: any; label: string; value: React.ReactNode; sub?: string; tone?: string; i?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="sheet relative overflow-hidden rounded-3xl p-5">
      <div className="absolute -right-6 -top-6 size-24 rounded-full opacity-15" style={{ background: `var(--${tone})` }} />
      <div className="grid size-9 place-items-center rounded-xl text-white" style={{ background: `var(--${tone})` }}><I className="size-4" /></div>
      <div className="mt-3 font-display text-[28px] font-bold leading-none">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">{label}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </motion.div>
  );
}

export const toLocal = (d?: string | null) => (d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
export const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

export function scheduleLabel(x: { active: boolean; startsAt?: string | null; endsAt?: string | null }) {
  const now = Date.now();
  if (!x.active) return { t: 'Tắt', tone: 'muted' as const };
  if (x.startsAt && new Date(x.startsAt).getTime() > now) return { t: 'Đã lên lịch', tone: 'gold' as const };
  if (x.endsAt && new Date(x.endsAt).getTime() <= now) return { t: 'Hết hạn', tone: 'muted' as const };
  return { t: 'Đang chạy', tone: 'jade' as const };
}
