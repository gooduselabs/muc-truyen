import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) =>
  <div className={cn('rounded-3xl border border-line bg-card shadow-[0_1px_0_rgba(0,0,0,.02),0_12px_40px_-24px_rgba(40,20,60,.25)]', className)} {...p} />;

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

export const Skeleton = ({ className }: { className?: string }) => <div className={cn('animate-pulse rounded-2xl bg-bg-soft', className)} />;

export function SectionTitle({ kicker, title, action }: { kicker?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {kicker && <div className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-brand">{kicker}</div>}
        <h2 className="font-serif text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Empty({ icon, title, hint, children }: { icon?: React.ReactNode; title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line px-6 py-16 text-center">
      {icon && <div className="mb-3 text-brand">{icon}</div>}
      <div className="font-serif text-lg font-semibold">{title}</div>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
