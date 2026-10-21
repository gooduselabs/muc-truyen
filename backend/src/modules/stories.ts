import {
  BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Injectable, Logger, NotFoundException, Param, Patch, Post,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Chapter, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { AuthUser, CurrentUser, Public, Roles, int, need } from '../common/auth';
import { slugify, toParagraphs, wordCount } from '../common/content';
import { NotificationsService } from './notifications';
import { WalletService } from './wallet';

export const storyCard = {
  id: true, slug: true, title: true, synopsis: true, coverUrl: true, coverSeed: true, genre: true, tags: true,
  ageRating: true, status: true, views: true, lastChapterAt: true, waitFreeHours: true,
  author: { select: { username: true, name: true, avatarUrl: true } },
  _count: { select: { chapters: { where: { status: 'PUBLISHED' } }, likes: true, library: true } },
} satisfies Prisma.StorySelect;

export const GENRES = ['Ngôn tình', 'Huyền huyễn', 'Kiếm hiệp', 'Đô thị', 'Trinh thám', 'Kinh dị', 'Khoa học viễn tưởng', 'Lịch sử', 'Học đường', 'Đời thường', 'Phiêu lưu', 'Thơ & Tản văn'];
const AGE = ['ALL', 'T13', 'T16', 'T18'];
const STATUS = ['ONGOING', 'COMPLETED', 'HIATUS'];

@Injectable()
export class StoriesService {
  private log = new Logger('Stories');
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  async uniqueSlug(title: string) {
    const base = slugify(title);
    let slug = base, i = 2;
    while (await this.prisma.story.findUnique({ where: { slug } })) slug = `${base}-${i++}`;
    return slug;
  }

  async publish(ch: Chapter) {
    const now = new Date();
    const updated = await this.prisma.chapter.update({ where: { id: ch.id }, data: { status: 'PUBLISHED', publishedAt: now }, include: { story: true } });
    await this.prisma.story.update({ where: { id: ch.storyId }, data: { lastChapterAt: now } });
    if (updated.story.visibility !== 'PUBLISHED') return updated;
    const [followers, lib] = await Promise.all([
      this.prisma.follow.findMany({ where: { followingId: updated.story.authorId }, select: { followerId: true } }),
      this.prisma.libraryItem.findMany({ where: { storyId: ch.storyId }, select: { userId: true } }),
    ]);
    await this.notifications.notify([...followers.map((f) => f.followerId), ...lib.map((l) => l.userId)], {
      type: 'chapter', title: `${updated.story.title} có chương mới`, body: `Chương ${updated.number}: ${updated.title}`,
      link: `/truyen/${updated.story.slug}/${updated.number}`,
    });
    return updated;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async publishDue() {
    const due = await this.prisma.chapter.findMany({ where: { status: 'SCHEDULED', publishAt: { lte: new Date() } } });
    for (const ch of due) await this.publish(ch);
    if (due.length) this.log.log(`Đã phát hành ${due.length} chương hẹn giờ`);
    return due.length;
  }
}

@Controller('stories')
export class StoriesController {
  constructor(private prisma: PrismaService, private wallet: WalletService) {}

  @Public() @Get('genres')
  genres() { return GENRES; }

  @Public() @Get(':slug')
  async detail(@Param('slug') slug: string, @CurrentUser() me?: AuthUser) {
    const s = await this.prisma.story.findUnique({
      where: { slug },
      select: {
        ...storyCard, createdAt: true, authorId: true, visibility: true,
        author: { select: { id: true, username: true, name: true, avatarUrl: true, bio: true } },
        chapters: {
          where: { status: 'PUBLISHED' }, orderBy: { number: 'asc' },
          select: { id: true, number: true, title: true, price: true, publishedAt: true, wordCount: true, views: true },
        },
      },
    });
    if (!s || (s.visibility !== 'PUBLISHED' && s.authorId !== me?.id && me?.role !== 'ADMIN')) throw new NotFoundException('Không tìm thấy truyện');
    const [rating, reviews, followers] = await Promise.all([
      this.prisma.review.aggregate({ where: { storyId: s.id, hidden: false }, _avg: { rating: true }, _count: true }),
      this.prisma.review.findMany({
        where: { storyId: s.id, hidden: false }, orderBy: { createdAt: 'desc' }, take: 20,
        include: { user: { select: { username: true, name: true, avatarUrl: true } } },
      }),
      this.prisma.follow.count({ where: { followingId: s.authorId } }),
    ]);
    let mine: any = null;
    if (me) {
      const [inLib, liked, progress, unlocks, following] = await Promise.all([
        this.prisma.libraryItem.findUnique({ where: { userId_storyId: { userId: me.id, storyId: s.id } } }),
        this.prisma.storyLike.findUnique({ where: { userId_storyId: { userId: me.id, storyId: s.id } } }),
        this.prisma.readingProgress.findUnique({ where: { userId_storyId: { userId: me.id, storyId: s.id } } }),
        this.prisma.unlock.findMany({ where: { userId: me.id, chapter: { storyId: s.id } }, select: { chapterId: true, kind: true, expiresAt: true } }),
        this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: me.id, followingId: s.authorId } } }),
      ]);
      const now = new Date();
      mine = {
        inLibrary: !!inLib, liked: !!liked, progress, followingAuthor: !!following,
        unlocked: unlocks.filter((u) => u.kind !== 'RENTAL' || (u.expiresAt && u.expiresAt > now)).map((u) => u.chapterId),
        isAuthor: s.authorId === me.id,
      };
    }
    return { ...s, rating: { avg: rating._avg.rating ?? 0, count: rating._count }, reviews, authorFollowers: followers, mine };
  }

  @Public() @Get(':slug/chapters/:number')
  async chapter(@Param('slug') slug: string, @Param('number') num: string, @CurrentUser() me?: AuthUser) {
    const story = await this.prisma.story.findUnique({ where: { slug }, select: { ...storyCard, authorId: true, visibility: true } });
    if (!story) throw new NotFoundException('Không tìm thấy truyện');
    const isOwner = me && (me.id === story.authorId || me.role === 'ADMIN');
    if (story.visibility !== 'PUBLISHED' && !isOwner) throw new NotFoundException('Không tìm thấy truyện');
    const ch = await this.prisma.chapter.findUnique({ where: { storyId_number: { storyId: story.id, number: int(num, 1, 1) } } });
    if (!ch || (ch.status !== 'PUBLISHED' && !isOwner)) throw new NotFoundException('Chương chưa phát hành');
    const access = await this.wallet.access(me?.id, ch.id);
    const [prev, next, counts, likes, liked] = await Promise.all([
      this.prisma.chapter.findFirst({ where: { storyId: story.id, status: 'PUBLISHED', number: { lt: ch.number } }, orderBy: { number: 'desc' }, select: { number: true, title: true } }),
      this.prisma.chapter.findFirst({ where: { storyId: story.id, status: 'PUBLISHED', number: { gt: ch.number } }, orderBy: { number: 'asc' }, select: { number: true, title: true, price: true } }),
      this.prisma.comment.groupBy({ by: ['paragraph'], where: { chapterId: ch.id, hidden: false }, _count: true }),
      this.prisma.chapterLike.count({ where: { chapterId: ch.id } }),
      me ? this.prisma.chapterLike.findUnique({ where: { userId_chapterId: { userId: me.id, chapterId: ch.id } } }) : null,
    ]);
    if (access.canRead) {
      await this.prisma.$transaction([
        this.prisma.chapter.update({ where: { id: ch.id }, data: { views: { increment: 1 } } }),
        this.prisma.story.update({ where: { id: story.id }, data: { views: { increment: 1 } } }),
      ]);
    }
    const paragraphs = ch.paragraphs as any[];
    const commentCounts: Record<string, number> = {};
    for (const c of counts) commentCounts[c.paragraph === null ? 'chapter' : String(c.paragraph)] = c._count;
    return {
      story, access, likes, liked: !!liked, prev, next, commentCounts,
      chapter: {
        id: ch.id, number: ch.number, title: ch.title, price: ch.price, wordCount: ch.wordCount, publishedAt: ch.publishedAt, status: ch.status,
        paragraphs: access.canRead ? paragraphs : paragraphs.slice(0, 2),
        totalParagraphs: paragraphs.length,
      },
    };
  }

  @Post(':id/like')
  async like(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const k = { userId_storyId: { userId: me.id, storyId: id } };
    if (await this.prisma.storyLike.findUnique({ where: k })) { await this.prisma.storyLike.delete({ where: k }); return { liked: false }; }
    await this.prisma.storyLike.create({ data: { userId: me.id, storyId: id } });
    return { liked: true };
  }
}

function storyData(b: any, partial = false) {
  const d: any = {};
  if (!partial || b.title !== undefined) d.title = need(String(b.title || '').trim().slice(0, 120), 'Thiếu tên truyện');
  if (!partial || b.synopsis !== undefined) d.synopsis = String(b.synopsis || '').slice(0, 3000);
  if (!partial || b.genre !== undefined) {
    if (!GENRES.includes(b.genre)) throw new BadRequestException('Thể loại không hợp lệ');
    d.genre = b.genre;
  }
  if (b.tags !== undefined) d.tags = [...new Set((Array.isArray(b.tags) ? b.tags : String(b.tags).split(',')).map((t: string) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 12);
  if (b.ageRating !== undefined) { if (!AGE.includes(b.ageRating)) throw new BadRequestException('Độ tuổi không hợp lệ'); d.ageRating = b.ageRating; }
  if (b.status !== undefined) { if (!STATUS.includes(b.status)) throw new BadRequestException('Trạng thái không hợp lệ'); d.status = b.status; }
  if (b.visibility !== undefined) { if (!['DRAFT', 'PUBLISHED'].includes(b.visibility)) throw new BadRequestException('Hiển thị không hợp lệ'); d.visibility = b.visibility; }
  if (b.coverUrl !== undefined) d.coverUrl = b.coverUrl || null;
  if (b.waitFreeHours !== undefined) d.waitFreeHours = b.waitFreeHours ? int(b.waitFreeHours, 24, 1, 24 * 14) : null;
  return d;
}

@Controller('studio')
@Roles('AUTHOR', 'ADMIN')
export class StudioController {
  constructor(private prisma: PrismaService, private stories: StoriesService) {}

  private async ownStory(me: AuthUser, id: string) {
    const s = await this.prisma.story.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Không tìm thấy truyện');
    if (s.authorId !== me.id && me.role !== 'ADMIN') throw new ForbiddenException('Không phải truyện của bạn');
    return s;
  }
  private async ownChapter(me: AuthUser, id: string) {
    const c = await this.prisma.chapter.findUnique({ where: { id }, include: { story: true } });
    if (!c) throw new NotFoundException('Không tìm thấy chương');
    if (c.story.authorId !== me.id && me.role !== 'ADMIN') throw new ForbiddenException('Không phải truyện của bạn');
    return c;
  }

  @Get('stories')
  list(@CurrentUser() me: AuthUser) {
    return this.prisma.story.findMany({
      where: { authorId: me.id }, orderBy: { updatedAt: 'desc' },
      select: { ...storyCard, visibility: true, updatedAt: true, _count: { select: { chapters: true, likes: true, library: true, reviews: true } } },
    });
  }

  @Post('stories')
  async create(@CurrentUser() me: AuthUser, @Body() b: any) {
    const d = storyData(b);
    return this.prisma.story.create({ data: { ...d, slug: await this.stories.uniqueSlug(d.title), coverSeed: Math.floor(Math.random() * 1000), authorId: me.id } });
  }

  @Get('stories/:id')
  async get(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    await this.ownStory(me, id);
    return this.prisma.story.findUnique({
      where: { id },
      include: { chapters: { orderBy: { number: 'asc' }, select: { id: true, number: true, title: true, status: true, price: true, publishAt: true, publishedAt: true, wordCount: true, views: true, updatedAt: true } } },
    });
  }

  @Patch('stories/:id')
  async update(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() b: any) {
    await this.ownStory(me, id);
    return this.prisma.story.update({ where: { id }, data: storyData(b, true) });
  }

  @Delete('stories/:id')
  async remove(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    await this.ownStory(me, id);
    await this.prisma.story.delete({ where: { id } });
    return { ok: true };
  }

  private chapterData(b: any) {
    const d: any = {};
    if (b.title !== undefined) d.title = String(b.title).trim().slice(0, 160) || 'Chương không tên';
    if (b.content !== undefined) {
      if (!b.content || b.content.type !== 'doc') throw new BadRequestException('Nội dung không hợp lệ');
      const ps = toParagraphs(b.content);
      d.contentJson = b.content; d.paragraphs = ps as any; d.wordCount = wordCount(ps);
    }
    if (b.price !== undefined) d.price = int(b.price, 0, 0, 1000);
    return d;
  }

  private async applyStatus(ch: Chapter, b: any) {
    if (b.status === 'PUBLISHED' && ch.status !== 'PUBLISHED') return this.stories.publish(ch);
    if (b.status === 'SCHEDULED') {
      const at = new Date(b.publishAt);
      if (Number.isNaN(+at) || at <= new Date()) throw new BadRequestException('Thời gian hẹn đăng phải ở tương lai');
      return this.prisma.chapter.update({ where: { id: ch.id }, data: { status: 'SCHEDULED', publishAt: at } });
    }
    if (b.status === 'DRAFT' && ch.status === 'SCHEDULED') return this.prisma.chapter.update({ where: { id: ch.id }, data: { status: 'DRAFT', publishAt: null } });
    return ch;
  }

  @Post('stories/:id/chapters')
  async createChapter(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() b: any) {
    await this.ownStory(me, id);
    const last = await this.prisma.chapter.findFirst({ where: { storyId: id }, orderBy: { number: 'desc' } });
    const d = this.chapterData({ title: 'Chương mới', content: { type: 'doc', content: [] }, ...b });
    const ch = await this.prisma.chapter.create({ data: { ...d, storyId: id, number: (last?.number ?? 0) + 1 } });
    return this.applyStatus(ch, b);
  }

  @Get('chapters/:id')
  async getChapter(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const c = await this.ownChapter(me, id);
    return { ...c, story: { id: c.story.id, title: c.story.title, slug: c.story.slug } };
  }

  @Patch('chapters/:id')
  async updateChapter(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() b: any) {
    await this.ownChapter(me, id);
    const ch = await this.prisma.chapter.update({ where: { id }, data: this.chapterData(b) });
    return this.applyStatus(ch, b);
  }

  @Delete('chapters/:id')
  async deleteChapter(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const c = await this.ownChapter(me, id);
    if (c.status === 'PUBLISHED' && (await this.prisma.unlock.count({ where: { chapterId: id } })) > 0)
      throw new BadRequestException('Chương đã có người mua, không thể xoá (hãy chỉnh sửa nội dung)');
    await this.prisma.chapter.delete({ where: { id } });
    return { ok: true };
  }
}
