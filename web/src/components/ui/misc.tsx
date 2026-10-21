import * as React from 'react';
import { cn } from '@/lib/utils';
import { BrushStroke, EmptyArt } from '../brand';

export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('sheet rounded-3xl', className)} {...p} />;

export const Badge = ({ className, ...p }: React.HTMLAttributes<HTMLSpanElement>) =>
  <span className={cn('inline-flex items-center gap-1 rounded-full border border-line bg-bg-soft px-2.5 py-0.5 text-xs font-medium text-muted', className)} {...p} />;

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) =>
  <input ref={ref} className={cn('h-11 w-full rounded-2xl border border-line bg-card px-4 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-[var(--ring)] placeholder:text-muted', className)} {...p} />);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) =>
  <textarea ref={ref} className={cn('min-h-24 w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-[var(--ring)] placeholder:text-muted', className)} {...p} />);
Textarea.displayName = 'Textarea';

export const Select = ({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) =>
  <select className={cn('h-11 w-full rounded-2xl border border-line bg-card px-4 text-sm outline-none focus:border-brand', className)} {...p} />;

export const Label = ({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) =>
  <label className={cn('mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted', className)} {...p} />;

export const Skeleton = ({ className }: { className?: string }) => <div className={cn('shimmer rounded-2xl', className)} />;

export function SectionTitle({ kicker, title, action }: { kicker?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {kicker && <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.25em] text-brand"><span className="size-2 rotate-45 rounded-[2px] bg-brand" />{kicker}</div>}
        <h2 className="brush font-display text-[28px] font-bold tracking-tight md:text-[34px]">{title}<BrushStroke /></h2>
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon, title, hint, children }: { icon?: React.ReactNode; title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line px-6 py-14 text-center">
      <EmptyArt className="mb-4 h-28 text-fg" />
      {icon && <div className="mb-2 text-brand">{icon}</div>}
      <div className="font-display text-xl font-semibold">{title}</div>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
