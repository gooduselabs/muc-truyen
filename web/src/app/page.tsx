import Link from 'next/link';
import { ArrowRight, Clock, Flame, Sparkles, PenLine, MessageSquareQuote, Coins } from 'lucide-react';
import { sget } from '@/lib/api';
import { Cover } from '@/components/cover';
import { StoryCard, StoryRow, type StoryCardData } from '@/components/story-card';
import { SectionTitle, Badge } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { STATUS_LABEL } from '@/lib/utils';
import { ContinueReading } from '@/components/continue-reading';

export const dynamic = 'force-dynamic';

type Home = { featured: StoryCardData[]; trending: StoryCardData[]; updated: StoryCardData[]; completed: StoryCardData[]; newest: StoryCardData[]; topLiked: StoryCardData[]; genres: string[]; tags: { tag: string; n: number }[] };

export default async function HomePage() {
  const data = await sget<Home>('/discover/home');
  if (!data) return <div className="mx-auto max-w-xl px-6 py-32 text-center"><h1 className="font-serif text-3xl font-bold">Chưa kết nối được máy chủ</h1><p className="mt-2 text-muted">Hãy chạy backend (cổng 4000) rồi tải lại trang.</p></div>;
  const hero = data.featured[0];
  return (
    <div>
      {hero && (
        <section className="relative overflow-hidden border-b border-line">
          <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-brand/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 size-[420px] rounded-full bg-gold/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-[1.15fr_.85fr] md:py-20">
            <div className="fade-up">
              <Badge className="border-brand/30 bg-brand-soft text-brand"><Flame className="size-3" />Đang được đọc nhiều nhất tuần</Badge>
              <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">{hero.title}</h1>
              <p className="mt-4 text-sm font-medium text-muted">bởi <Link href={`/u/${hero.author.username}`} className="text-fg underline-offset-4 hover:underline">{hero.author.name}</Link> · {hero.genre} · {STATUS_LABEL[hero.status]}</p>
              <p className="mt-5 max-w-xl font-serif text-lg leading-relaxed text-fg/80">{hero.synopsis}</p>
              <div className="mt-6 flex flex-wrap gap-2">{hero.tags.map((t) => <Link key={t} href={`/kham-pha?tag=${encodeURIComponent(t)}`}><Badge className="hover:border-brand hover:text-brand">#{t}</Badge></Link>)}</div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg"><Link href={`/truyen/${hero.slug}/1`}>Đọc ngay <ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link href={`/truyen/${hero.slug}`}>Xem chi tiết</Link></Button>
              </div>
            </div>
            <div className="relative mx-auto flex w-full max-w-md items-end justify-center">
              {data.featured.slice(1, 3).map((s, i) => (
                <Link key={s.id} href={`/truyen/${s.slug}`} className={`absolute bottom-6 w-[46%] transition duration-500 hover:z-20 hover:-translate-y-2 ${i === 0 ? '-left-2 -rotate-[8deg]' : '-right-2 rotate-[8deg]'}`}>
                  <Cover title={s.title} seed={s.coverSeed} url={s.coverUrl} genre={s.genre} className="opacity-90" />
                </Link>
              ))}
              <Link href={`/truyen/${hero.slug}`} className="relative z-10 w-[58%] transition duration-500 hover:-translate-y-2">
                <Cover title={hero.title} seed={hero.coverSeed} url={hero.coverUrl} genre={hero.genre} author={hero.author.name} size="lg" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl space-y-20 px-6 pt-14">
        <ContinueReading />
        <section className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <div>
            <SectionTitle kicker="Mới cập nhật" title="Chương mới mỗi ngày" action={<Link href="/kham-pha?sort=new" className="text-sm font-semibold text-brand hover:underline">Xem tất cả</Link>} />
            <div className="stagger grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
              {data.updated.slice(0, 8).map((s) => <StoryCard key={s.id} s={s} />)}
            </div>
          </div>
          <aside>
            <SectionTitle kicker="Bảng xếp hạng" title="Thịnh hành tuần" />
            <div className="rounded-3xl border border-line bg-card p-3">
              {data.trending.slice(0, 7).map((s, i) => <StoryRow key={s.id} s={s} rank={i} />)}
              <Link href="/bang-xep-hang" className="mt-2 flex items-center justify-center gap-1 rounded-2xl py-3 text-sm font-semibold text-brand hover:bg-bg-soft">Toàn bộ bảng xếp hạng <ArrowRight className="size-4" /></Link>
            </div>
          </aside>
        </section>

        <section>
          <SectionTitle kicker="Thể loại" title="Bạn muốn đọc gì hôm nay?" />
          <div className="flex flex-wrap gap-3">
            {data.genres.map((g, i) => (
              <Link key={g} href={`/kham-pha?genre=${encodeURIComponent(g)}`} className="group relative overflow-hidden rounded-2xl border border-line bg-card px-5 py-4 font-semibold transition hover:-translate-y-0.5 hover:border-brand">
                <span className="absolute inset-y-0 left-0 w-1 transition-all group-hover:w-full group-hover:opacity-10" style={{ background: ['#d9452f', '#c08a2b', '#4b2a7b', '#1f7a6d', '#2f4b8f', '#a8324a'][i % 6] }} />
                <span className="relative">{g}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {data.tags.map((t) => <Link key={t.tag} href={`/kham-pha?tag=${encodeURIComponent(t.tag)}`}><Badge className="hover:border-brand hover:text-brand">#{t.tag} <span className="opacity-60">{t.n}</span></Badge></Link>)}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            { icon: MessageSquareQuote, t: 'Bình luận theo từng đoạn', d: 'Chạm vào đoạn văn bất kỳ để bàn luận, như ghi chú bên lề một cuốn sách chung.' },
            { icon: Clock, t: 'Chờ là miễn phí', d: 'Mỗi 24 giờ nhận một vé mở chương miễn phí. Không muốn chờ? Thuê 48 giờ hoặc mua vĩnh viễn.' },
            { icon: Coins, t: 'Tác giả nhận 70%', d: 'Mỗi xu bạn chi cho chương truyện, 70% về tay tác giả. Ủng hộ trực tiếp: tác giả nhận 90%.' },
          ].map((f) => (
            <div key={f.t} className="rounded-3xl border border-line bg-card p-6">
              <div className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand"><f.icon className="size-5" /></div>
              <div className="mt-4 font-serif text-lg font-bold">{f.t}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.d}</p>
            </div>
          ))}
        </section>

        <section>
          <SectionTitle kicker="Trọn bộ" title="Đã hoàn thành — đọc một mạch" />
          <div className="stagger grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
            {[...data.completed, ...data.newest].filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i).slice(0, 6).map((s) => <StoryCard key={s.id} s={s} />)}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] bg-[#1d1838] px-8 py-14 text-white md:px-14">
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand/40 blur-3xl" />
          <div className="absolute bottom-0 right-10 hidden font-serif text-[220px] font-bold leading-none text-white/5 md:block">Viết</div>
          <div className="relative max-w-xl">
            <Sparkles className="size-8 text-gold" />
            <h2 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Mỗi người đều có một câu chuyện.</h2>
            <p className="mt-3 text-white/70">Studio của Mực có trình soạn thảo đẹp, tự lưu bản nháp, hẹn giờ đăng, đặt giá chương và thống kê độc giả bỏ ngang ở đoạn nào. Bắt đầu miễn phí.</p>
            <Button asChild size="lg" variant="gold" className="mt-7"><Link href="/studio"><PenLine />Mở Studio tác giả</Link></Button>
          </div>
        </section>
      </div>
    </div>
  );
}
