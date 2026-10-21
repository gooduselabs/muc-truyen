'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from './ui/button';
import { Skeleton } from './ui/misc';
export function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'AUTHOR' | 'ADMIN' }) {
  const { me, ready } = useAuth();
  if (!ready) return <div className="mx-auto max-w-5xl px-6 py-16"><Skeleton className="h-64" /></div>;
  if (!me) return (
    <div className="mx-auto max-w-md px-6 py-32 text-center">
      <h1 className="font-serif text-3xl font-bold">Bạn cần đăng nhập</h1>
      <p className="mt-2 text-muted">Đăng nhập để tiếp tục.</p>
      <Button asChild className="mt-6"><Link href="/dang-nhap">Đăng nhập</Link></Button>
    </div>
  );
  if (role === 'ADMIN' && me.role !== 'ADMIN') return <div className="py-32 text-center font-serif text-2xl">Trang chỉ dành cho quản trị viên.</div>;
  return <>{children}</>;
}
