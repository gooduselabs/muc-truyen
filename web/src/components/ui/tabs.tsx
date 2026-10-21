'use client';
import * as T from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
export const Tabs = T.Root;
export const TabsContent = (p: T.TabsContentProps) => <T.Content {...p} className={cn('fade-up outline-none', p.className)} />;
export const TabsList = (p: T.TabsListProps) => <T.List {...p} className={cn('mb-6 inline-flex gap-1 rounded-full border border-line bg-bg-soft p-1', p.className)} />;
export const TabsTrigger = (p: T.TabsTriggerProps) =>
  <T.Trigger {...p} className={cn('rounded-full px-4 py-2 text-sm font-semibold text-muted transition data-[state=active]:bg-card data-[state=active]:text-fg data-[state=active]:shadow', p.className)} />;
