import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuthUser, CurrentUser, Roles, int } from '../common/auth';
import { storyCard } from './stories';
import { WalletService } from './wallet';
import { NotificationsService } from './notifications';

@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private prisma: PrismaService, private wallet: WalletService, private notifications: NotificationsService) {}

  private audit(me: AuthUser, action: string, target = '', meta?: any) {
    return this.prisma.auditLog.create({ data: { actorId: me.id, actor: me.username, action, target, meta } });
  }

  @Get('stats')
  async stats() {
    const [users, stories, chapters, openReports, pendingPayouts, coins, pendingStories] = await Promise.all([
      this.prisma.user.count(), this.prisma.story.count(), this.prisma.chapter.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.report.count({ where: { status: 'OPEN' } }), this.prisma.payoutRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amountVnd: true, coins: true } }),
      this.prisma.story.count({ where: { visibility: 'PENDING' } }),
    ]);
    return { users, stories, chapters, openReports, pendingPayouts, pendingStories, revenueVnd: coins._sum.amountVnd ?? 0, coinsSold: coins._sum.coins ?? 0 };
  }

  /** Dashboard time series: new users, DAU (distinct readers), chapter views, revenue, coins spent. */
  @Get('dashboard')
  async dashboard(@Query('days') d?: string) {
    const days = int(d, 30, 7, 180);
    const since = new Date(Date.now() - days * 864e5);
    const q = (sql: TemplateStringsArray, ...v: any[]) => this.prisma.$queryRaw<any[]>(sql, ...v);
    const [users, reads, revenue, spent, stats, topStories, genres] = await Promise.all([
      q`SELECT date_trunc('day', "createdAt")::date AS d, count(*)::int AS n FROM "User" WHERE "createdAt" >= ${since} GROUP BY 1`,
      q`SELECT date_trunc('day', "createdAt")::date AS d, count(*)::int AS views, count(DISTINCT "userId")::int AS dau FROM "ChapterRead" WHERE "createdAt" >= ${since} GROUP BY 1`,
      q`SELECT date_trunc('day', "createdAt")::date AS d, coalesce(sum("amountVnd"),0)::int AS vnd, coalesce(sum(coins),0)::int AS coins FROM "Payment" WHERE status = 'SUCCEEDED' AND "createdAt" >= ${since} GROUP BY 1`,
      q`SELECT date_trunc('day', "createdAt")::date AS d, coalesce(-sum(amount),0)::int AS n FROM "LedgerEntry" WHERE account = 'COINS' AND amount < 0 AND "createdAt" >= ${since} GROUP BY 1`,
      this.stats(),
      this.prisma.story.findMany({ orderBy: { views: 'desc' }, take: 5, select: storyCard }),
      q`SELECT genre, count(*)::int AS n, coalesce(sum(views),0)::int AS views FROM "Story" GROUP BY genre ORDER BY views DESC`,
    ]);
    const key = (x: any) => new Date(x).toISOString().slice(0, 10);
    const series = Array.from({ length: days }, (_, i) => {
      const day = new Date(Date.now() - (days - 1 - i) * 864e5).toISOString().slice(0, 10);
      const f = (rows: any[]) => rows.find((r) => key(r.d) === day);
      return { day, users: f(users)?.n ?? 0, dau: f(reads)?.dau ?? 0, views: f(reads)?.views ?? 0, vnd: f(revenue)?.vnd ?? 0, coins: f(revenue)?.coins ?? 0, spent: f(spent)?.n ?? 0 };
    });
    const sum = (k: keyof (typeof series)[0]) => series.reduce((a, s) => a + (s[k] as number), 0);
    return {
      ...stats, series, topStories, genres,
      totals: { newUsers: sum('users'), views: sum('views'), revenueVnd: sum('vnd'), coinsSold: sum('coins'), coinsSpent: sum('spent'), dauToday: series[series.length - 1].dau, dauAvg: Math.round(sum('dau') / days) },
    };
  }

  @Get('audit')
  auditLog(@Query('q') q = '') {
    return this.prisma.auditLog.findMany({
      where: q ? { OR: [{ action: { contains: q } }, { actor: { contains: q } }, { target: { contains: q } }] } : {},
      orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  // ---------- Stories moderation & curation ----------
  @Get('stories')
  stories(@Query('q') q = '', @Query('visibility') visibility?: string) {
    return this.prisma.story.findMany({
      where: {
        ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
        ...(visibility ? { visibility: visibility as any } : {}),
      },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }], take: 100,
      select: { ...storyCard, visibility: true, createdAt: true, updatedAt: true },
    });
  }

  /** action: approve | hide | publish | pin | unpin | feature | unfeature | boost (value) */
  @Post('stories/:id')
  async story(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() b: any) {
    const map: Record<string, any> = {
      approve: { visibility: 'PUBLISHED' }, publish: { visibility: 'PUBLISHED' }, hide: { visibility: 'HIDDEN' },
      pin: { pinned: true }, unpin: { pinned: false }, feature: { featured: true }, unfeature: { featured: false },
      boost: { rankBoost: int(b.value, 0, -10, 10) },
    };
    const data = map[b.action];
    if (!data) throw new BadRequestException('Hành động không hợp lệ');
    const s = await this.prisma.story.update({ where: { id }, data, select: { id: true, title: true, authorId: true, visibility: true, pinned: true, featured: true, rankBoost: true, slug: true } });
    if (b.action === 'approve') await this.notifications.notify([s.authorId], { type: 'story', title: 'Truyện của bạn đã được duyệt', body: s.title, link: `/truyen/${s.slug}` });
    await this.audit(me, `story.${b.action}`, s.title, data);
    return s;
  }

  // ---------- Banners (hero carousel) ----------
  @Get('banners') banners() { return this.prisma.banner.findMany({ orderBy: { position: 'asc' } }); }
  @Post('banners') async addBanner(@CurrentUser() me: AuthUser, @Body() b: any) {
    const r = await this.prisma.banner.create({ data: { ...bannerData(b), position: await this.prisma.banner.count() } });
    await this.audit(me, 'banner.create', r.title); return r;
  }
  @Patch('banners/:id') async editBanner(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() b: any) {
    const r = await this.prisma.banner.update({ where: { id }, data: bannerData(b, true) });
    await this.audit(me, 'banner.update', r.title, b); return r;
  }
  @Delete('banners/:id') async delBanner(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const r = await this.prisma.banner.delete({ where: { id } }); await this.audit(me, 'banner.delete', r.title); return { ok: true };
  }
  @Post('banners-order') async orderBanners(@CurrentUser() me: AuthUser, @Body() b: any) {
    await this.prisma.$transaction((b.ids as string[]).map((id, position) => this.prisma.banner.update({ where: { id }, data: { position } })));
    await this.audit(me, 'banner.reorder'); return { ok: true };
  }

  // ---------- Curated homepage sections ----------
  @Get('curations') curations() { return this.prisma.curation.findMany({ orderBy: { position: 'asc' } }); }
  @Post('curations') async addCuration(@CurrentUser() me: AuthUser, @Body() b: any) {
    const r = await this.prisma.curation.create({ data: { ...curationData(b), position: await this.prisma.curation.count() } });
    await this.audit(me, 'curation.create', r.title); return r;
  }
  @Patch('curations/:id') async editCuration(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() b: any) {
    const r = await this.prisma.curation.update({ where: { id }, data: curationData(b, true) });
    await this.audit(me, 'curation.update', r.title, b); return r;
  }
  @Delete('curations/:id') async delCuration(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const r = await this.prisma.curation.delete({ where: { id } }); await this.audit(me, 'curation.delete', r.title); return { ok: true };
  }
  @Post('curations-order') async orderCurations(@CurrentUser() me: AuthUser, @Body() b: any) {
    await this.prisma.$transaction((b.ids as string[]).map((id, position) => this.prisma.curation.update({ where: { id }, data: { position } })));
    await this.audit(me, 'curation.reorder'); return { ok: true };
  }

  // ---------- Categories & tags ----------
  @Get('categories') async categories() {
    const [cats, counts, tags] = await Promise.all([
      this.prisma.category.findMany({ orderBy: { position: 'asc' } }),
      this.prisma.story.groupBy({ by: ['genre'], _count: true }),
      this.prisma.$queryRaw<any[]>`SELECT t AS tag, count(*)::int AS n FROM "Story", unnest(tags) t GROUP BY t ORDER BY n DESC, t LIMIT 200`,
    ]);
    return { categories: cats.map((c) => ({ ...c, stories: counts.find((x) => x.genre === c.name)?._count ?? 0 })), tags };
  }
  @Post('categories') async addCategory(@CurrentUser() me: AuthUser, @Body() b: any) {
    const name = String(b.name || '').trim();
    if (!name) throw new BadRequestException('Thiếu tên thể loại');
    const r = await this.prisma.category.create({ data: { name, position: await this.prisma.category.count() } });
    await this.audit(me, 'category.create', name); return r;
  }
  @Patch('categories/:id') async editCategory(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() b: any) {
    const old = await this.prisma.category.findUniqueOrThrow({ where: { id } });
    const r = await this.prisma.category.update({ where: { id }, data: { name: b.name?.trim() || undefined, active: b.active ?? undefined, position: b.position ?? undefined } });
    if (b.name && b.name !== old.name) await this.prisma.story.updateMany({ where: { genre: old.name }, data: { genre: r.name } });
    await this.audit(me, 'category.update', r.name, b); return r;
  }
  /** Rename/merge a tag across all stories (to = '' deletes it). */
  @Post('tags') async tag(@CurrentUser() me: AuthUser, @Body() b: any) {
    const from = String(b.from || '').toLowerCase().trim(), to = String(b.to || '').toLowerCase().trim();
    if (!from) throw new BadRequestException('Thiếu thẻ');
    const n = to
      ? await this.prisma.$executeRaw`UPDATE "Story" SET tags = (SELECT array_agg(DISTINCT x) FROM unnest(array_replace(tags, ${from}, ${to})) x) WHERE ${from} = ANY(tags)`
      : await this.prisma.$executeRaw`UPDATE "Story" SET tags = array_remove(tags, ${from}) WHERE ${from} = ANY(tags)`;
    await this.audit(me, to ? 'tag.merge' : 'tag.delete', from, { to, stories: n }); return { stories: n };
  }

  // ---------- Coin packages & promotions ----------
  @Get('packages') async packages() {
    const rows = await this.prisma.coinPackage.findMany({ orderBy: { position: 'asc' } });
    return rows;
  }
  @Post('packages') async upsertPackage(@CurrentUser() me: AuthUser, @Body() b: any) {
    const id = String(b.id || '').trim();
    if (!/^[a-z0-9_-]{2,20}$/.test(id)) throw new BadRequestException('Mã gói không hợp lệ');
    const data = {
      coins: int(b.coins, 0, 1, 1_000_000), bonus: int(b.bonus, 0, 0, 1_000_000), vnd: int(b.vnd, 0, 1000, 100_000_000),
      label: String(b.label || ''), promoBonus: int(b.promoBonus, 0, 0, 1_000_000), promoUntil: b.promoUntil ? new Date(b.promoUntil) : null,
      active: b.active !== false, position: int(b.position, 0, 0, 100),
    };
    const r = await this.prisma.coinPackage.upsert({ where: { id }, create: { id, ...data }, update: data });
    await this.audit(me, 'package.upsert', id, data); return r;
  }

  // ---------- Announcements ----------
  @Get('announcements') announcements() { return this.prisma.announcement.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }); }
  /** Broadcast an in-app notification to ALL / AUTHORS / READERS. */
  @Post('announcements') async announce(@CurrentUser() me: AuthUser, @Body() b: any) {
    const title = String(b.title || '').trim();
    if (!title) throw new BadRequestException('Thiếu tiêu đề');
    const audience = ['ALL', 'AUTHOR', 'READER'].includes(b.audience) ? b.audience : 'ALL';
    const users = await this.prisma.user.findMany({ where: { banned: false, ...(audience === 'ALL' ? {} : { role: audience }) }, select: { id: true } });
    await this.notifications.notify(users.map((u) => u.id), { type: 'announcement', title, body: String(b.body || ''), link: String(b.link || '') || undefined });
    const r = await this.prisma.announcement.create({ data: { title, body: String(b.body || ''), link: String(b.link || ''), audience, recipients: users.length } });
    await this.audit(me, 'announcement.send', title, { audience, recipients: users.length }); return r;
  }

  @Get('reports')
  async reports(@Query('status') status = 'OPEN') {
    const reports = await this.prisma.report.findMany({
      where: { status: status as any }, orderBy: { createdAt: 'desc' }, take: 100,
      include: { reporter: { select: { username: true, name: true } } },
    });
    // Attach a preview of each target so moderators can decide without leaving the page.
    return Promise.all(reports.map(async (r) => ({ ...r, target: await this.preview(r.targetType, r.targetId) })));
  }

  private async preview(type: string, id: string) {
    if (type === 'comment') return this.prisma.comment.findUnique({ where: { id }, select: { body: true, hidden: true, user: { select: { username: true } } } });
    if (type === 'review') return this.prisma.review.findUnique({ where: { id }, select: { body: true, rating: true, hidden: true, user: { select: { username: true } } } });
    if (type === 'story') return this.prisma.story.findUnique({ where: { id }, select: { title: true, slug: true, visibility: true, ageRating: true } });
    if (type === 'chapter') return this.prisma.chapter.findUnique({ where: { id }, select: { title: true, number: true, story: { select: { slug: true, title: true } } } });
    if (type === 'user') return this.prisma.user.findUnique({ where: { id }, select: { username: true, name: true, banned: true } });
    return null;
  }

  /** action: dismiss | hide (hide target) | ban (ban target's owner/user) */
  @Post('reports/:id')
  async resolve(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() b: any) {
    const r = await this.prisma.report.findUnique({ where: { id } });
    if (!r) throw new BadRequestException('Không tìm thấy báo cáo');
    if (b.action === 'hide') await this.hide(r.targetType, r.targetId);
    if (b.action === 'ban') await this.banOwner(r.targetType, r.targetId);
    await this.prisma.report.update({ where: { id }, data: { status: b.action === 'dismiss' ? 'DISMISSED' : 'RESOLVED' } });
    await this.audit(me, `report.${b.action}`, `${r.targetType}:${r.targetId}`);
    await this.notifications.notify([r.reporterId], { type: 'report', title: 'Báo cáo của bạn đã được xử lý', body: 'Cảm ơn bạn đã giúp cộng đồng an toàn hơn.' });
    return { ok: true };
  }

  async hide(type: string, id: string) {
    if (type === 'comment') await this.prisma.comment.update({ where: { id }, data: { hidden: true } });
    else if (type === 'review') await this.prisma.review.update({ where: { id }, data: { hidden: true } });
    else if (type === 'story') await this.prisma.story.update({ where: { id }, data: { visibility: 'HIDDEN' } });
    else if (type === 'chapter') await this.prisma.chapter.update({ where: { id }, data: { status: 'DRAFT' } });
  }

  async banOwner(type: string, id: string) {
    let userId: string | undefined;
    if (type === 'user') userId = id;
    else if (type === 'comment') userId = (await this.prisma.comment.findUnique({ where: { id } }))?.userId;
    else if (type === 'review') userId = (await this.prisma.review.findUnique({ where: { id } }))?.userId;
    else if (type === 'story') userId = (await this.prisma.story.findUnique({ where: { id } }))?.authorId;
    if (userId) await this.prisma.user.update({ where: { id: userId }, data: { banned: true } });
  }

  @Get('payouts')
  payouts() {
    return this.prisma.payoutRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { user: { select: { username: true, name: true, email: true } } } });
  }

  @Post('payouts/:id')
  async payout(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() b: any) {
    const p = await this.wallet.resolvePayout(id, b.action === 'approve');
    await this.audit(me, `payout.${b.action}`, id, { coins: p.coins });
    await this.notifications.notify([p.userId], {
      type: 'payout', title: b.action === 'approve' ? 'Yêu cầu rút tiền đã được duyệt' : 'Yêu cầu rút tiền bị từ chối',
      body: `${p.coins} xu ≈ ${p.amountVnd.toLocaleString('vi-VN')}đ`, link: '/studio/thu-nhap',
    });
    return p;
  }

  @Get('users')
  users(@Query('q') q = '') {
    return this.prisma.user.findMany({
      where: q ? { OR: [{ username: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {},
      orderBy: { createdAt: 'desc' }, take: 50,
      select: { id: true, username: true, name: true, email: true, role: true, banned: true, verified: true, coins: true, earnings: true, createdAt: true, _count: { select: { stories: true } } },
    });
  }

  @Post('users/:id')
  async user(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() b: any) {
    if (id === me.id && (b.banned || (b.role && b.role !== 'ADMIN'))) throw new BadRequestException('Không thể tự khoá / hạ quyền chính mình');
    const r = await this.prisma.user.update({
      where: { id },
      data: {
        banned: b.banned !== undefined ? !!b.banned : undefined, verified: b.verified !== undefined ? !!b.verified : undefined,
        role: ['READER', 'AUTHOR', 'ADMIN'].includes(b.role) ? b.role : undefined,
      },
      select: { id: true, username: true, banned: true, role: true, verified: true },
    });
    await this.audit(me, 'user.update', '@' + r.username, b);
    return r;
  }
}

const date = (v: any) => (v ? new Date(v) : null);
function bannerData(b: any, partial = false) {
  const d: any = {};
  for (const k of ['title', 'subtitle', 'kicker', 'link']) if (!partial || b[k] !== undefined) d[k] = String(b[k] ?? '').slice(0, 300);
  if (!partial && !d.title) throw new BadRequestException('Thiếu tiêu đề banner');
  if (b.storyId !== undefined) d.storyId = b.storyId || null;
  if (b.hue !== undefined) d.hue = int(b.hue, 12, 0, 360);
  if (b.active !== undefined) d.active = !!b.active;
  if (b.startsAt !== undefined) d.startsAt = date(b.startsAt);
  if (b.endsAt !== undefined) d.endsAt = date(b.endsAt);
  return d;
}
function curationData(b: any, partial = false) {
  const d: any = {};
  for (const k of ['title', 'subtitle']) if (!partial || b[k] !== undefined) d[k] = String(b[k] ?? '').slice(0, 200);
  if (!partial && !d.title) throw new BadRequestException('Thiếu tên mục');
  if (b.style !== undefined) d.style = ['shelf', 'spotlight', 'list'].includes(b.style) ? b.style : 'shelf';
  if (b.storyIds !== undefined) d.storyIds = (b.storyIds as string[]).slice(0, 24);
  if (b.active !== undefined) d.active = !!b.active;
  if (b.startsAt !== undefined) d.startsAt = date(b.startsAt);
  if (b.endsAt !== undefined) d.endsAt = date(b.endsAt);
  return d;
}
