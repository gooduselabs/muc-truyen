'use client';
import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dialog({ open, onOpenChange, title, children, side, className }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode; side?: boolean; className?: string;
}) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-[fadeUp_.2s]" />
        <D.Content className={cn(
          'fixed z-50 flex flex-col border border-line bg-card text-fg shadow-2xl outline-none',
          side ? 'inset-y-0 right-0 w-full max-w-md rounded-l-3xl p-6 data-[state=open]:animate-[slideIn_.3s_cubic-bezier(.2,.7,.2,1)]'
            : 'left-1/2 top-1/2 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-3xl p-6 fade-up',
          className)}>
          <div className="mb-4 flex items-center justify-between">
            <D.Title className="font-serif text-xl font-bold">{title}</D.Title>
            <D.Close className="rounded-full p-2 text-muted hover:bg-bg-soft" aria-label="Đóng"><X className="size-5" /></D.Close>
          </div>
          <D.Description className="sr-only">{title}</D.Description>
          {children}
        </D.Content>
      </D.Portal>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:none}}`}</style>
    </D.Root>
  );
}
