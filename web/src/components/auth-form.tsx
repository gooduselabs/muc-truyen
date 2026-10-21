'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { BookOpen, PenLine } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from './ui/button';
import { Input, Label } from './ui/misc';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

function Form({ mode }: { mode: 'login' | 'register' }) {
  const { login } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const [f, setF] = useState({ email: '', password: '', name: '', asAuthor: false });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await api(mode === 'login' ? '/auth/login' : '/auth/register', { body: f });
      login(r.token, r.user);
      router.push(f.asAuthor ? '/studio' : next);
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#1d1838] p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 -top-20 size-96 rounded-full bg-brand/40 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-96 rounded-full bg-gold/30 blur-3xl" />
        <div className="relative"><Logo /></div>
        <blockquote className="relative max-w-md font-serif text-3xl leading-snug">
          “Đèn còn sáng thì họ còn thấy đường về.”
          <footer className="mt-4 font-sans text-sm text-white/60">— Người Gác Đèn Ở Cù Lao Mây, Linh An</footer>
        </blockquote>
        <div className="relative text-sm text-white/50">Một cộng đồng đọc — nơi người viết được trân trọng.</div>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <form onSubmit={submit} className="fade-up w-full max-w-sm">
          <h1 className="font-serif text-4xl font-bold">{mode === 'login' ? 'Chào mừng trở lại' : 'Tham gia Mực'}</h1>
          <p className="mt-2 text-sm text-muted">{mode === 'login' ? 'Đăng nhập để đồng bộ tủ sách và tiến độ đọc.' : 'Miễn phí. Đọc, viết, theo dõi tác giả bạn yêu thích.'}</p>
          <div className="mt-8 space-y-4">
            {mode === 'register' && <div><Label>Tên hiển thị</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ví dụ: Minh Thư" /></div>}
            <div><Label>Email</Label><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="ban@email.com" /></div>
            <div><Label>Mật khẩu</Label><Input type="password" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="Tối thiểu 8 ký tự" /></div>
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-2">
                {[{ v: false, i: BookOpen, l: 'Tôi muốn đọc' }, { v: true, i: PenLine, l: 'Tôi muốn viết' }].map((o) => (
                  <button type="button" key={o.l} onClick={() => setF({ ...f, asAuthor: o.v })} className={cn('rounded-2xl border-2 p-3 text-sm font-semibold transition', f.asAuthor === o.v ? 'border-brand bg-brand-soft/50 text-brand' : 'border-line')}>
                    <o.i className="mx-auto mb-1 size-5" />{o.l}
                  </button>
                ))}
              </div>
            )}
          </div>
          {err && <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 text-sm text-brand">{err}</p>}
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</Button>
          <p className="mt-6 text-center text-sm text-muted">
            {mode === 'login' ? <>Chưa có tài khoản? <Link href="/dang-ky" className="font-semibold text-brand">Đăng ký</Link></> : <>Đã có tài khoản? <Link href="/dang-nhap" className="font-semibold text-brand">Đăng nhập</Link></>}
          </p>
          {mode === 'login' && <p className="mt-6 rounded-2xl border border-dashed border-line p-3 text-center text-xs text-muted">Tài khoản demo: <b>docgia@muc.vn</b> · <b>linhan@muc.vn</b> · <b>admin@muc.vn</b><br />mật khẩu <b>muc12345</b></p>}
        </form>
      </div>
    </div>
  );
}
export const AuthForm = ({ mode }: { mode: 'login' | 'register' }) => <Suspense><Form mode={mode} /></Suspense>;
