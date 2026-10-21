import Link from 'next/link';
import { ArrowRight, Clock, Sparkles, PenLine, MessageSquareQuote, Coins } from 'lucide-react';
import { sget } from '@/lib/api';
import { Cover } from '@/components/cover';
import { HeroCarousel, type Banner } from '@/components/hero';
import { Reveal, Stagger, Tilt } from '@/components/motion';
import { Lantern, Seal } from '@/components/brand';
import { StoryCard, StoryRow, type StoryCardData } from '@/components/story-card';
import { SectionTitle, Badge } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { ContinueReading } from '@/components/continue-reading';

export const dynamic = 'force-dynamic';

type Section = { id: string; title: string; subtitle: string; style: string; stories: StoryCardData[] };
type Home = { banners: Banner[]; sections: Section[]; featured: StoryCardData[]; trending: StoryCardData[]; updated: StoryCardData[]; completed: StoryCardData[]; newest: StoryCardData[]; topLiked: StoryCardData[]; genres: string[]; tags: { tag: string; n: number }[] };

function Spotlight({ s }: { s: Section }) {
  const [lead, ...rest] = s.stories;
  return (
    <section className="relative overflow-hidden rounded-[2.2rem] bg-[#16142a] px-6 py-10 text-[#f2e8d5] md:px-12 md:py-14">
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#ff7a4d]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-10 size-80 rounded-full bg-[#8da2ff]/15 blur-3xl" />
      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <Seal text="Tuyển chọn" className="border-[#ff9b73] text-[#ff9b73]" />
          <h2 className="mt-5 font-display text-4xl font-black md:text-5xl">{s.title}</h2>
          <p className="mt-3 max-w-md font-serif text-lg italic text-white/70">{s.subtitle}</p>
          {lead && (
            <Link href={`/truyen/${lead.slug}`} className="group mt-8 flex gap-5 rounded-3xl border border-white/10 bg-white/[.04] p-4 transition hover:border-[#f1b84b]/50">
              <Cover title={lead.title} seed={lead.coverSeed} url={lead.coverUrl} size="sm" className="w-24 shrink-0" />
              <div>
                <div className="font-display text-2xl font-bold group-hover:text-[#f1b84b]">{lead.title}</div>
                <div className="mt-1 text-sm text-white/60">{lead.author.name} · {lead.genre}</div>
                <p className="mt-2 line-clamp-3 font-serif text-sm leading-relaxed text-white/75">{lead.synopsis}</p>
              </div>
            </Link>
          )}
        </Reveal>
        <Stagger className="grid grid-cols-2 gap-6 sm:grid-cols-3" gap={0.12}>
          {[lead, ...rest].filter(Boolean).slice(0, 3).map((x) => (
            <Link key={x.id} href={`/truyen/${x.slug}`} className="group block">
              <Tilt max={14}><Cover title={x.title} seed={x.coverSeed} url={x.coverUrl} genre={x.genre} /></Tilt>
              <div className="mt-3 line-clamp-1 font-display text-lg font-bold group-hover:text-[#f1b84b]">{x.title}</div>
              <div className="text-xs text-white/55">{x.author.name}</div>
            </Link>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function Shelf({ s }: { s: Section }) {
  return (
    <section>
      <SectionTitle kicker="Biên tập viên chọn" title={s.title} />
      {s.subtitle && <p className="-mt-2 mb-6 font-serif italic text-muted">{s.subtitle}</p>}
      <div className="relative">
        <Stagger className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
          {s.stories.map((x) => <StoryCard key={x.id} s={x} />)}
        </Stagger>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const data = await sget<Home>('/discover/home');
  if (!data) return <div className="mx-auto max-w-xl px-6 py-32 text-center"><h1 className="font-display text-3xl font-bold">Chưa kết nối được máy chủ</h1><p className="mt-2 text-muted">Hãy chạy backend (cổng 4000) rồi tải lại trang.</p></div>;
  const banners: Banner[] = data.banners.length ? data.banners : data.featured.slice(0, 3).map((s) => ({ id: s.id, title: s.title, subtitle: s.synopsis, kicker: 'Nổi bật', link: '', hue: (s.coverSeed * 47) % 360, story: s }));
  const [first, ...moreSections] = data.sections;
  return (
    <div>
      <HeroCarousel banners={banners} />

      <div className="mx-auto max-w-7xl space-y-24 px-6 pt-6">
        <ContinueReading />
        {first && (first.style === 'spotlight' ? <Spotlight s={first} /> : <Shelf s={first} />)}

        <section className="grid gap-12 lg:grid-cols-[1fr_380px]">
          <div>
            <SectionTitle kicker="Mới cập nhật" title="Chương mới mỗi ngày" action={<Link href="/kham-pha?sort=new" className="text-sm font-semibold text-brand hover:underline">Xem tất cả</Link>} />
            <Stagger className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 md:grid-cols-4">
              {data.updated.slice(0, 8).map((s) => <StoryCard key={s.id} s={s} />)}
            </Stagger>
          </div>
          <aside>
            <SectionTitle kicker="Bảng xếp hạng" title="Thịnh hành tuần" />
            <Reveal className="sheet rounded-3xl p-3">
              {data.trending.slice(0, 7).map((s, i) => <StoryRow key={s.id} s={s} rank={i} />)}
              <Link href="/bang-xep-hang" className="mt-2 flex items-center justify-center gap-1 rounded-2xl py-3 text-sm font-semibold text-brand hover:bg-bg-soft">Toàn bộ bảng xếp hạng <ArrowRight className="size-4" /></Link>
            </Reveal>
          </aside>
        </section>

        {moreSections.map((s) => (s.style === 'spotlight' ? <Spotlight key={s.id} s={s} /> : <Shelf key={s.id} s={s} />))}

        <section>
          <SectionTitle kicker="Thể loại" title="Hôm nay bạn muốn đọc gì?" />
          <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" gap={0.04}>
            {data.genres.map((g, i) => {
              const hue = [12, 38, 262, 168, 222, 345][i % 6];
              return (
                <Link key={g} href={`/kham-pha?genre=${encodeURIComponent(g)}`} className="group relative block h-24 overflow-hidden rounded-2xl border border-line bg-card p-4 transition hover:-translate-y-1 hover:border-transparent hover:shadow-xl">
                  <span className="absolute -bottom-6 -right-4 font-display text-7xl font-black italic opacity-[.12] transition group-hover:scale-110 group-hover:opacity-25" style={{ color: `hsl(${hue} 60% 45%)` }}>{g.charAt(0)}</span>
                  <span className="absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 50% / .16), transparent)` }} />
                  <span className="relative font-display text-lg font-bold">{g}</span>
                </Link>
              );
            })}
          </Stagger>
          <div className="mt-6 flex flex-wrap gap-2">
            {data.tags.map((t) => <Link key={t.tag} href={`/kham-pha?tag=${encodeURIComponent(t.tag)}`}><Badge className="hover:border-brand hover:text-brand">#{t.tag} <span className="opacity-60">{t.n}</span></Badge></Link>)}
          </div>
        </section>

        <Stagger className="grid gap-6 md:grid-cols-3" gap={0.1}>
          {[
            { icon: MessageSquareQuote, t: 'Bình luận bên lề', d: 'Chạm vào đoạn văn bất kỳ để bàn luận, như ghi chú bên lề một cuốn sách chung.' },
            { icon: Clock, t: 'Chờ là miễn phí', d: 'Mỗi 24 giờ nhận một vé mở chương miễn phí. Không muốn chờ? Thuê 48 giờ hoặc mua vĩnh viễn.' },
            { icon: Coins, t: 'Tác giả nhận 70%', d: 'Mỗi xu bạn chi cho chương truyện, 70% về tay tác giả. Ủng hộ trực tiếp: tác giả nhận 90%.' },
          ].map((f) => (
            <div key={f.t} className="sheet relative h-full overflow-hidden rounded-3xl p-7">
              <div className="grid size-12 place-items-center rounded-[14px] bg-brand text-white shadow-[0_10px_20px_-10px_var(--brand)]"><f.icon className="size-5" /></div>
              <div className="mt-5 font-display text-xl font-bold">{f.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.d}</p>
            </div>
          ))}
        </Stagger>

        <section>
          <SectionTitle kicker="Trọn bộ" title="Đã hoàn thành — đọc một mạch" />
          <Stagger className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4 lg:grid-cols-6">
            {[...data.completed, ...data.newest].filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i).slice(0, 6).map((s) => <StoryCard key={s.id} s={s} />)}
          </Stagger>
        </section>

        <Reveal>
          <section className="relative overflow-hidden rounded-[2.2rem] bg-[#16142a] px-8 py-16 text-[#f2e8d5] md:px-14">
            <div className="absolute -right-24 -top-24 size-80 rounded-full bg-[#ff7a4d]/35 blur-3xl" />
            <Lantern className="absolute bottom-0 right-16 hidden h-72 md:block" />
            <div className="relative max-w-xl">
              <Sparkles className="size-8 text-[#f1b84b]" />
              <h2 className="mt-4 font-display text-4xl font-black md:text-5xl">Mỗi người đều có <em className="text-[#ff9b73]">một câu chuyện.</em></h2>
              <p className="mt-4 text-white/70">Studio của Mực có trình soạn thảo đẹp, tự lưu bản nháp, hẹn giờ đăng, đặt giá chương và thống kê độc giả bỏ ngang ở đoạn nào. Bắt đầu miễn phí.</p>
              <Button asChild size="lg" variant="gold" className="mt-8"><Link href="/studio"><PenLine />Mở Studio tác giả</Link></Button>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
