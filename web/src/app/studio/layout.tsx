'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpenText, PenLine, Wallet, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { RequireAuth } from '@/components/require-auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/studio', label: 'Truyện của tôi', icon: BookOpenText },
  { href: '/studio/thong-ke', label: 'Thống kê', icon: BarChart3 },
  { href: '/studio/thu-nhap', label: 'Thu nhập', icon: Wallet },
];

function Shell({ children }: { children: React.ReactNode }) {
  const { me, refresh } = useAuth();
  const path = usePathname();
  if (path.startsWith('/studio/chuong')) return <>{children}</>;
  if (me?.role === 'READER') return (
    <div className="mx-auto max-w-xl px-6 py-28 text-center">
      <Sparkles className="mx-auto size-10 text-gold" />
      <h1 className="mt-4 font-serif text-4xl font-bold">Bắt đầu hành trình viết</h1>
      <p className="mt-3 text-muted">Mở Studio để đăng truyện, hẹn giờ chương, đặt giá và xem độc giả của bạn đọc tới đâu.</p>
      <Button size="lg" className="mt-8" onClick={async () => { await api('/auth/become-author', { method: 'POST' }); refresh(); }}><PenLine />Trở thành tác giả</Button>
    </div>
  );
  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-4 px-3 text-xs font-bold uppercase tracking-[.25em] text-brand">Studio</div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn('flex shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition', (n.href === '/studio' ? path === '/studio' || path.startsWith('/studio/truyen') : path.startsWith(n.href)) ? 'bg-fg text-bg' : 'text-muted hover:bg-bg-soft hover:text-fg')}>
              <n.icon className="size-4" />{n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
export default function StudioLayout({ children }: { children: React.ReactNode }) { return <RequireAuth><Shell>{children}</Shell></RequireAuth>; }
