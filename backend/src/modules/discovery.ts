import { Controller, Get, Param, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { AuthUser, CurrentUser, Public, int } from '../common/auth';
import { GENRES, storyCard } from './stories';

const PUB = { visibility: 'PUBLISHED' as const };

@Controller('discover')
export class DiscoveryController {
  constructor(private prisma: PrismaService) {}

  private async byIds(ids: string[]) {
    const rows = await this.prisma.story.findMany({ where: { id: { in: ids }, ...PUB }, select: storyCard });
    const m = new Map(rows.map((r) => [r.id, r]));
    return ids.map((id) => m.get(id)).filter(Boolean);
  }

  /** Weekly trending = chapter reads in the last 7 days (+ likes as tie-breaker). */
  async trending(days = 7, take = 10) {
    const since = new Date(Date.now() - days * 864e5);
    const rows = await this.prisma.chapterRead.groupBy({ by: ['storyId'], where: { createdAt: { gte: since } }, _count: true, orderBy: { _count: { storyId: 'desc' } }, take });
    const ids = rows.map((r) => r.storyId);
    if (ids.length < take) {
      const more = await this.prisma.story.findMany({ where: { ...PUB, id: { notIn: ids } }, orderBy: { views: 'desc' }, take: take - ids.length, select: { id: true } });
      ids.push(...more.map((m) => m.id));
    }
    return this.byIds(ids);
  }

  @Public() @Get('home')
  async home() {
    const [trending, updated, completed, newest, topLiked] = await Promise.all([
      this.trending(7, 10),
      this.prisma.story.findMany({ where: { ...PUB, lastChapterAt: { not: null } }, orderBy: { lastChapterAt: 'desc' }, take: 12, select: storyCard }),
      this.prisma.story.findMany({ where: { ...PUB, status: 'COMPLETED' }, orderBy: { views: 'desc' }, take: 8, select: storyCard }),
      this.prisma.story.findMany({ where: PUB, orderBy: { createdAt: 'desc' }, take: 8, select: storyCard }),
      this.prisma.story.findMany({ where: PUB, orderBy: { likes: { _count: 'desc' } }, take: 8, select: storyCard }),
    ]);
    const tagRows: any[] = await this.prisma.$queryRaw`SELECT t AS tag, count(*)::int AS n FROM "Story", unnest(tags) t WHERE visibility = 'PUBLISHED' GROUP BY t ORDER BY n DESC LIMIT 24`;
    return { featured: trending.slice(0, 3), trending, updated, completed, newest, topLiked, genres: GENRES, tags: tagRows };
  }

  @Public() @Get('rankings')
  async rankings(@Query('by') by = 'week', @Query('genre') genre?: string) {
    const where: Prisma.StoryWhereInput = { ...PUB, ...(genre ? { genre } : {}) };
    if (by === 'week' && !genre) return this.trending(7, 30);
    if (by === 'likes') return this.prisma.story.findMany({ where, orderBy: { likes: { _count: 'desc' } }, take: 30, select: storyCard });
    if (by === 'library') return this.prisma.story.findMany({ where, orderBy: { library: { _count: 'desc' } }, take: 30, select: storyCard });
    if (by === 'rating') {
      const rows = await this.prisma.review.groupBy({ by: ['storyId'], where: { hidden: false, story: where }, _avg: { rating: true }, _count: true, orderBy: { _avg: { rating: 'desc' } }, take: 30 });
      return this.byIds(rows.map((r) => r.storyId));
    }
    return this.prisma.story.findMany({ where, orderBy: { views: 'desc' }, take: 30, select: storyCard });
  }

  /** Vietnamese-aware search: Postgres unaccent full-text + substring fallback ("kiem hiep" finds "Kiếm hiệp"). */
  @Public() @Get('search')
  async search(@Query('q') q = '', @Query('tag') tag?: string, @Query('genre') genre?: string, @Query('status') status?: string, @Query('sort') sort = 'relevance', @Query('page') page?: string) {
    const take = 24, skip = (int(page, 1, 1) - 1) * take;
    const filters: Prisma.StoryWhereInput = {
      ...PUB, ...(tag ? { tags: { has: tag.toLowerCase() } } : {}), ...(genre ? { genre } : {}),
      ...(status && ['ONGOING', 'COMPLETED', 'HIATUS'].includes(status) ? { status: status as any } : {}),
    };
    let ids: string[] | null = null;
    const query = q.trim().slice(0, 100);
    if (query) {
      const like = `%${query}%`;
      const rows: { id: string }[] = await this.prisma.$queryRaw`
        SELECT s.id FROM "Story" s JOIN "User" u ON u.id = s."authorId"
        WHERE s.visibility = 'PUBLISHED' AND (
          to_tsvector('simple', f_unaccent(s.title || ' ' || s.synopsis || ' ' || array_to_string(s.tags, ' ') || ' ' || u.name)) @@ plainto_tsquery('simple', f_unaccent(${query}))
          OR f_unaccent(s.title) ILIKE f_unaccent(${like}) OR f_unaccent(u.name) ILIKE f_unaccent(${like}))
        ORDER BY (f_unaccent(s.title) ILIKE f_unaccent(${like})) DESC,
          ts_rank(to_tsvector('simple', f_unaccent(s.title || ' ' || s.synopsis)), plainto_tsquery('simple', f_unaccent(${query}))) DESC, s.views DESC
        LIMIT 200`;
      ids = rows.map((r) => r.id);
    }
    const where = { ...filters, ...(ids ? { id: { in: ids } } : {}) };
    const orderBy: Prisma.StoryOrderByWithRelationInput =
      sort === 'new' ? { lastChapterAt: 'desc' } : sort === 'likes' ? { likes: { _count: 'desc' } } : { views: 'desc' };
    const [items, total] = await Promise.all([
      this.prisma.story.findMany({ where, select: storyCard, orderBy, take: ids && sort === 'relevance' ? 200 : take, skip: ids && sort === 'relevance' ? 0 : skip }),
      this.prisma.story.count({ where }),
    ]);
    const sorted = ids && sort === 'relevance' ? ids.map((id) => items.find((i) => i.id === id)).filter(Boolean).slice(skip, skip + take) : items;
    return { items: sorted, total, page: int(page, 1, 1) };
  }

  /** "Đọc tiếp gì?" — tag/genre overlap with the seed story (or the user's library), ranked by popularity. */
  @Public() @Get('recommend')
  async recommend(@CurrentUser() me?: AuthUser, @Query('story') storyId?: string) {
    let tags: string[] = [], genres: string[] = [], exclude: string[] = [];
    if (storyId) {
      const s = await this.prisma.story.findUnique({ where: { id: storyId } });
      if (s) { tags = s.tags; genres = [s.genre]; exclude = [s.id]; }
    } else if (me) {
      const lib = await this.prisma.libraryItem.findMany({ where: { userId: me.id }, include: { story: true } });
      tags = lib.flatMap((l) => l.story.tags); genres = lib.map((l) => l.story.genre); exclude = lib.map((l) => l.storyId);
    }
    if (!tags.length && !genres.length) return this.trending(30, 8);
    const cands = await this.prisma.story.findMany({
      where: { ...PUB, id: { notIn: exclude }, OR: [{ tags: { hasSome: tags } }, { genre: { in: genres } }] }, select: storyCard, take: 60,
    });
    const tagSet = new Map<string, number>();
    tags.forEach((t) => tagSet.set(t, (tagSet.get(t) || 0) + 1));
    const score = (s: any) => s.tags.reduce((a: number, t: string) => a + (tagSet.get(t) || 0) * 3, 0) + (genres.includes(s.genre) ? 2 : 0) + Math.log10(1 + s.views);
    return cands.sort((a, b) => score(b) - score(a)).slice(0, 8);
  }

  @Public() @Get('tags/:tag')
  tag(@Param('tag') tag: string) { return this.search('', tag); }
}
