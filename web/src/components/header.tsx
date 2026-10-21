'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as DM from '@radix-ui/react-dropdown-menu';
import { Bell, Coins, LogOut, Moon, PenLine, Search, Shield, Sun, User, Wallet, Library, Rss } from 'lucide-react';
import { Logo } from './logo';
import { InkDivider, Lantern } from './brand';
import { Button } from './ui/button';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cn, fmt } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { switchTheme } from './motion';

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains('dark')); }, []);
  const toggle = (e?: { clientX: number; clientY: number }) => {
    const d = !dark; setDark(d);
    switchTheme(d ? 'dark' : 'light', e ? { x: e.clientX, y: e.clientY } : undefined);
  };
  return { dark, toggle };
}

const NAV = [
  { href: '/', label: 'Trang chủ' }, { href: '/kham-pha', label: 'Khám phá' }, { href: '/bang-xep-hang', label: 'Xếp hạng' },
  { href: '/bang-tin', label: 'Bảng tin' }, { href: '/tu-sach', label: 'Tủ sách' },
];

export function Header() {
  const { me, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [unread, setUnread] = useState(0);
  useEffect(() => { if (me) api('/notifications').then((r) => setUnread(r.unread)).catch(() => {}); }, [me, path]);
  if (path.match(/^\/truyen\/[^/]+\/\d+/) || path.startsWith('/studio/chuong')) return null; // reader & editor have their own chrome

  return (
    <header className="glass sticky top-0 z-40 border-b border-line/80">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-6 px-4 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={cn('relative whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:text-fg', path === n.href && 'text-fg')}>
              {path === n.href && <motion.span layoutId="nav-ink" className="absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full bg-brand" style={{ borderRadius: '40% 60% 50% 50%' }} />}
              {n.label}
            </Link>
          ))}
        </nav>
        <form className="relative ml-auto hidden w-72 md:block" onSubmit={(e) => { e.preventDefault(); router.push(`/kham-pha?q=${encodeURIComponent(q)}`); }}>
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm truyện, tác giả, thẻ…"
            className="h-10 w-full rounded-full border border-line bg-card pl-10 pr-4 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-[var(--ring)]" />
        </form>
        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <button onClick={(e) => toggle(e)} className="grid size-10 place-items-center overflow-hidden rounded-full text-muted transition hover:bg-bg-soft hover:text-fg" aria-label="Đổi giao diện">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={dark ? 'sun' : 'moon'} initial={{ y: 18, rotate: -90, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: -18, rotate: 90, opacity: 0 }}>
                {dark ? <Sun className="size-[18px] text-gold" /> : <Moon className="size-[18px]" />}
              </motion.span>
            </AnimatePresence>
          </button>
          {me ? (
            <>
              <Link href="/vi" className="hidden h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f3d27a]/30 to-[#c08a2b]/20 px-3 text-sm font-bold text-gold sm:inline-flex">
                <Coins className="size-4" />{fmt(me.coins)}
              </Link>
              <Link href="/thong-bao" className="relative grid size-10 place-items-center rounded-full text-muted hover:bg-bg-soft hover:text-fg" aria-label="Thông báo">
                <Bell className="size-[18px]" />
                {unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{unread}</span>}
              </Link>
              <DM.Root>
                <DM.Trigger className="ml-1 grid size-10 place-items-center rounded-full bg-gradient-to-br from-brand to-gold font-bold text-white outline-none ring-offset-2 ring-offset-bg focus:ring-2 focus:ring-brand">
                  {me.name.charAt(0)}
                </DM.Trigger>
                <DM.Portal>
                  <DM.Content align="end" sideOffset={8} className="fade-up z-50 w-60 rounded-2xl border border-line bg-card p-2 text-fg shadow-2xl">
                    <div className="px-3 py-2"><div className="font-semibold">{me.name}</div><div className="text-xs text-muted">@{me.username}</div></div>
                    <DM.Separator className="my-1 h-px bg-line" />
                    {[
                      { href: `/u/${me.username}`, icon: User, label: 'Hồ sơ của tôi' },
                      { href: '/tu-sach', icon: Library, label: 'Tủ sách' },
                      { href: '/bang-tin', icon: Rss, label: 'Bảng tin' },
                      { href: '/vi', icon: Wallet, label: `Ví xu · ${fmt(me.coins)}` },
                      { href: '/studio', icon: PenLine, label: 'Studio tác giả' },
                      ...(me.role === 'ADMIN' ? [{ href: '/admin', icon: Shield, label: 'Quản trị' }] : []),
                    ].map((i) => (
                      <DM.Item key={i.href} asChild>
                        <Link href={i.href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm outline-none hover:bg-bg-soft data-[highlighted]:bg-bg-soft"><i.icon className="size-4 text-muted" />{i.label}</Link>
                      </DM.Item>
                    ))}
                    <DM.Separator className="my-1 h-px bg-line" />
                    <DM.Item onSelect={() => { logout(); router.push('/'); }} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-brand outline-none data-[highlighted]:bg-bg-soft">
                      <LogOut className="size-4" />Đăng xuất
                    </DM.Item>
                  </DM.Content>
                </DM.Portal>
              </DM.Root>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/dang-nhap">Đăng nhập</Link></Button>
              <Button asChild size="sm"><Link href="/dang-ky">Tham gia</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const path = usePathname();
  if (path.match(/^\/truyen\/[^/]+\/\d+/) || path.startsWith('/studio/chuong')) return null;
  return (
    <footer className="relative mt-24 overflow-hidden">
      <InkDivider className="mx-auto max-w-7xl px-6" />
      <Lantern className="pointer-events-none absolute -right-6 top-6 hidden h-56 opacity-80 md:block" />
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted">Cộng đồng đọc &amp; viết truyện của người Việt. Truyện gốc, có bản quyền, tác giả được trả công xứng đáng.</p>
        </div>
        <div className="text-sm"><div className="mb-3 font-semibold">Độc giả</div><div className="space-y-2 text-muted"><Link href="/kham-pha" className="block hover:text-fg">Khám phá</Link><Link href="/bang-xep-hang" className="block hover:text-fg">Bảng xếp hạng</Link><Link href="/vi" className="block hover:text-fg">Nạp xu</Link></div></div>
        <div className="text-sm"><div className="mb-3 font-semibold">Tác giả</div><div className="space-y-2 text-muted"><Link href="/studio" className="block hover:text-fg">Studio</Link><Link href="/studio/thong-ke" className="block hover:text-fg">Thống kê</Link><Link href="/studio/thu-nhap" className="block hover:text-fg">Thu nhập</Link></div></div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">© 2026 Mực · Mã nguồn mở MIT · Thanh toán đang ở chế độ thử nghiệm (sandbox)</div>
    </footer>
  );
}
