import { Controller, ForbiddenException, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuthUser, CurrentUser, Roles, int } from '../common/auth';

@Controller('studio/analytics')
@Roles('AUTHOR', 'ADMIN')
export class AnalyticsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async overview(@CurrentUser() me: AuthUser, @Query('days') d?: string) {
    const days = int(d, 30, 7, 365);
    const since = new Date(Date.now() - days * 864e5);
    const stories = await this.prisma.story.findMany({
      where: { authorId: me.id }, select: { id: true, title: true, slug: true, views: true, coverSeed: true, genre: true, _count: { select: { library: true, likes: true } } },
    });
    const ids = stories.map((s) => s.id);
    const [daily, followers, earningsDaily, totals, ratings]: any[] = await Promise.all([
      this.prisma.$queryRaw`SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') AS day, count(*)::int AS reads, count(DISTINCT "userId")::int AS readers
        FROM "ChapterRead" WHERE "storyId" = ANY(${ids}) AND "createdAt" >= ${since} GROUP BY 1 ORDER BY 1`,
      this.prisma.follow.count({ where: { followingId: me.id } }),
      this.prisma.$queryRaw`SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD') AS day, sum(amount)::int AS coins
        FROM "LedgerEntry" WHERE "userId" = ${me.id} AND account = 'EARNINGS' AND amount > 0 AND "createdAt" >= ${since} GROUP BY 1 ORDER BY 1`,
      this.prisma.user.findUnique({ where: { id: me.id }, select: { earnings: true } }),
      this.prisma.review.aggregate({ where: { storyId: { in: ids } }, _avg: { rating: true }, _count: true }),
    ]);
    const reads = daily.reduce((a: number, r: any) => a + r.reads, 0);
    const earned = earningsDaily.reduce((a: number, r: any) => a + r.coins, 0);
    return {
      days, followers, reads, earned, balance: totals?.earnings ?? 0, rating: ratings._avg.rating ?? 0, reviews: ratings._count,
      daily, earningsDaily, stories: stories.sort((a, b) => b.views - a.views),
    };
  }

  /** Drop-off by chapter (unique readers per chapter) and completion rate. */
  @Get('stories/:id')
  async story(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const s = await this.prisma.story.findUnique({ where: { id } });
    if (!s) throw new NotFoundException();
    if (s.authorId !== me.id && me.role !== 'ADMIN') throw new ForbiddenException();
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT c.id, c.number, c.title, c.price, c.views,
        count(r.id)::int AS reads,
        count(DISTINCT coalesce(r."userId", r.id))::int AS readers,
        coalesce(avg(CASE WHEN r.completed THEN 1 ELSE 0 END), 0)::float AS completion,
        (SELECT count(*)::int FROM "Comment" m WHERE m."chapterId" = c.id) AS comments,
        (SELECT count(*)::int FROM "Unlock" u WHERE u."chapterId" = c.id) AS unlocks
      FROM "Chapter" c LEFT JOIN "ChapterRead" r ON r."chapterId" = c.id
      WHERE c."storyId" = ${id} AND c.status = 'PUBLISHED' GROUP BY c.id ORDER BY c.number`;
    const first = rows[0]?.readers || 0;
    return { story: { id: s.id, title: s.title, slug: s.slug }, chapters: rows.map((r) => ({ ...r, retention: first ? r.readers / first : 0 })) };
  }

  /** Drop-off by paragraph inside one chapter: share of readers who reached paragraph i. */
  @Get('chapters/:id')
  async chapter(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const c = await this.prisma.chapter.findUnique({ where: { id }, include: { story: true } });
    if (!c) throw new NotFoundException();
    if (c.story.authorId !== me.id && me.role !== 'ADMIN') throw new ForbiddenException();
    const ps = c.paragraphs as any[];
    const reads = await this.prisma.chapterRead.findMany({ where: { chapterId: id }, select: { maxParagraph: true } });
    const comments = await this.prisma.comment.groupBy({ by: ['paragraph'], where: { chapterId: id, paragraph: { not: null } }, _count: true });
    const cm = new Map(comments.map((x) => [x.paragraph, x._count]));
    const n = reads.length || 1;
    return {
      chapter: { id: c.id, number: c.number, title: c.title }, totalReads: reads.length,
      paragraphs: ps.map((p, i) => ({
        index: i, preview: (p.text || '').slice(0, 90), reached: reads.filter((r) => r.maxParagraph >= i).length / n, comments: cm.get(i) || 0,
      })),
    };
  }
}
