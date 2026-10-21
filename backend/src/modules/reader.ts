import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuthUser, CurrentUser, Public, int, need } from '../common/auth';
import { NotificationsService } from './notifications';
import { publicUser } from './auth';
import { storyCard } from './stories';

const userMini = { username: true, name: true, avatarUrl: true } as const;

@Controller('me')
export class LibraryController {
  constructor(private prisma: PrismaService) {}

  @Get('library')
  async library(@CurrentUser() me: AuthUser) {
    const [items, progress] = await Promise.all([
      this.prisma.libraryItem.findMany({ where: { userId: me.id }, orderBy: { addedAt: 'desc' }, include: { story: { select: storyCard } } }),
      this.prisma.readingProgress.findMany({ where: { userId: me.id } }),
    ]);
    const map = new Map(progress.map((p) => [p.storyId, p]));
    return items.map((i) => ({ ...i.story, progress: map.get(i.storyId) ?? null, addedAt: i.addedAt }));
  }

  @Get('history')
  async history(@CurrentUser() me: AuthUser) {
    const progress = await this.prisma.readingProgress.findMany({ where: { userId: me.id }, orderBy: { updatedAt: 'desc' }, take: 30 });
    const stories = await this.prisma.story.findMany({ where: { id: { in: progress.map((p) => p.storyId) } }, select: storyCard });
    const m = new Map(stories.map((s) => [s.id, s]));
    return progress.filter((p) => m.has(p.storyId)).map((p) => ({ ...m.get(p.storyId)!, progress: p }));
  }

  @Post('library/:storyId')
  async add(@CurrentUser() me: AuthUser, @Param('storyId') storyId: string) {
    await this.prisma.libraryItem.upsert({ where: { userId_storyId: { userId: me.id, storyId } }, create: { userId: me.id, storyId }, update: {} });
    return { inLibrary: true };
  }
  @Delete('library/:storyId')
  async remove(@CurrentUser() me: AuthUser, @Param('storyId') storyId: string) {
    await this.prisma.libraryItem.deleteMany({ where: { userId: me.id, storyId } });
    return { inLibrary: false };
  }

  /** Sync reading position (last write wins; mobile sends its offline queue here). */
  @Post('progress')
  async progress(@CurrentUser() me: AuthUser, @Body() b: any) {
    const ch = await this.prisma.chapter.findUnique({ where: { id: need(b.chapterId, 'Thiếu chương') } });
    if (!ch) throw new NotFoundException();
    const paragraph = int(b.paragraph, 0);
    const p = await this.prisma.readingProgress.upsert({
      where: { userId_storyId: { userId: me.id, storyId: ch.storyId } },
      create: { userId: me.id, storyId: ch.storyId, chapterId: ch.id, chapterNo: ch.number, paragraph },
      update: { chapterId: ch.id, chapterNo: ch.number, paragraph },
    });
    return p;
  }
}

@Controller('reads')
export class ReadsController {
  constructor(private prisma: PrismaService) {}
  /** Read beacon for analytics: called on open and as the reader scrolls (max paragraph reached). */
  @Public() @Post()
  async beacon(@CurrentUser() me: AuthUser | undefined, @Body() b: any) {
    const ch = await this.prisma.chapter.findUnique({ where: { id: need(b.chapterId, 'Thiếu chương') }, select: { id: true, storyId: true, paragraphs: true } });
    if (!ch) throw new NotFoundException();
    const total = (ch.paragraphs as any[]).length;
    const maxParagraph = Math.min(int(b.maxParagraph, 0), Math.max(0, total - 1));
    const completed = maxParagraph >= total - 1;
    if (b.readId) {
      await this.prisma.chapterRead.updateMany({ where: { id: String(b.readId), chapterId: ch.id, maxParagraph: { lt: maxParagraph } }, data: { maxParagraph, completed } });
      return { readId: b.readId };
    }
    const r = await this.prisma.chapterRead.create({ data: { chapterId: ch.id, storyId: ch.storyId, userId: me?.id, maxParagraph, completed } });
    return { readId: r.id };
  }
}

@Controller()
export class SocialController {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  @Public() @Get('chapters/:id/comments')
  comments(@Param('id') id: string, @Query('paragraph') paragraph?: string) {
    const p = paragraph === undefined ? undefined : paragraph === 'chapter' ? null : int(paragraph, 0);
    return this.prisma.comment.findMany({
      where: { chapterId: id, hidden: false, ...(p !== undefined ? { paragraph: p } : {}) },
      orderBy: { createdAt: 'asc' }, take: 200, include: { user: { select: userMini } },
    });
  }

  @Post('chapters/:id/comments')
  async comment(@CurrentUser() me: AuthUser, @Param('id') id: string, @Body() b: any) {
    const body = String(b.body || '').trim().slice(0, 2000);
    if (!body) throw new BadRequestException('Bình luận trống');
    const ch = await this.prisma.chapter.findUnique({ where: { id }, include: { story: true } });
    if (!ch) throw new NotFoundException();
    const paragraph = b.paragraph === undefined || b.paragraph === null ? null : int(b.paragraph, 0);
    const c = await this.prisma.comment.create({
      data: { chapterId: id, userId: me.id, paragraph, body, parentId: b.parentId || null }, include: { user: { select: userMini } },
    });
    if (ch.story.authorId !== me.id) {
      await this.notifications.notify([ch.story.authorId], {
        type: 'comment', title: `@${me.username} bình luận ${paragraph === null ? 'chương' : 'đoạn ' + (paragraph + 1)} · Chương ${ch.number}`,
        body: body.slice(0, 120), link: `/truyen/${ch.story.slug}/${ch.number}`,
      });
    }
    return c;
  }

  @Delete('comments/:id')
  async deleteComment(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const c = await this.prisma.comment.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    if (c.userId !== me.id && me.role !== 'ADMIN') throw new ForbiddenException();
    await this.prisma.comment.update({ where: { id }, data: { hidden: true } });
    return { ok: true };
  }

  @Post('chapters/:id/like')
  async like(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    const k = { userId_chapterId: { userId: me.id, chapterId: id } };
    if (await this.prisma.chapterLike.findUnique({ where: k })) { await this.prisma.chapterLike.delete({ where: k }); return { liked: false }; }
    await this.prisma.chapterLike.create({ data: { userId: me.id, chapterId: id } });
    return { liked: true };
  }

  /** Reviews only from readers who opened ≥1 chapter (anti review-bombing). */
  @Post('stories/:id/reviews')
  async review(@CurrentUser() me: AuthUser, @Param('id') storyId: string, @Body() b: any) {
    const rating = int(b.rating, 0, 0, 5);
    if (rating < 1) throw new BadRequestException('Chọn từ 1 đến 5 sao');
    const body = String(b.body || '').trim().slice(0, 5000);
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new NotFoundException();
    if (story.authorId === me.id) throw new BadRequestException('Tác giả không thể tự đánh giá');
    const read = await this.prisma.chapterRead.count({ where: { storyId, userId: me.id } });
    const prog = await this.prisma.readingProgress.count({ where: { storyId, userId: me.id } });
    if (!read && !prog) throw new BadRequestException('Hãy đọc ít nhất 1 chương trước khi đánh giá');
    return this.prisma.review.upsert({
      where: { userId_storyId: { userId: me.id, storyId } }, create: { userId: me.id, storyId, rating, body }, update: { rating, body },
    });
  }

  @Get('me/lists')
  myLists(@CurrentUser() me: AuthUser) {
    return this.prisma.readingList.findMany({
      where: { ownerId: me.id }, orderBy: { createdAt: 'desc' },
      include: { items: { include: { story: { select: storyCard } }, orderBy: { addedAt: 'desc' } } },
    });
  }
  @Public() @Get('lists/:id')
  async list(@Param('id') id: string, @CurrentUser() me?: AuthUser) {
    const l = await this.prisma.readingList.findUnique({
      where: { id }, include: { owner: { select: publicUser }, items: { include: { story: { select: storyCard } } } },
    });
    if (!l || (!l.isPublic && l.ownerId !== me?.id)) throw new NotFoundException();
    return l;
  }
  @Post('lists')
  createList(@CurrentUser() me: AuthUser, @Body() b: any) {
    return this.prisma.readingList.create({
      data: { ownerId: me.id, name: need(String(b.name || '').trim().slice(0, 80), 'Thiếu tên danh sách'), description: String(b.description || '').slice(0, 500), isPublic: b.isPublic !== false },
    });
  }
  @Post('lists/:id/items/:storyId')
  async addItem(@CurrentUser() me: AuthUser, @Param('id') id: string, @Param('storyId') storyId: string) {
    const l = await this.prisma.readingList.findUnique({ where: { id } });
    if (!l || l.ownerId !== me.id) throw new ForbiddenException();
    await this.prisma.readingListItem.upsert({ where: { listId_storyId: { listId: id, storyId } }, create: { listId: id, storyId }, update: {} });
    return { ok: true };
  }
  @Delete('lists/:id/items/:storyId')
  async removeItem(@CurrentUser() me: AuthUser, @Param('id') id: string, @Param('storyId') storyId: string) {
    const l = await this.prisma.readingList.findUnique({ where: { id } });
    if (!l || l.ownerId !== me.id) throw new ForbiddenException();
    await this.prisma.readingListItem.deleteMany({ where: { listId: id, storyId } });
    return { ok: true };
  }

  @Post('reports')
  async report(@CurrentUser() me: AuthUser, @Body() b: any) {
    if (!['story', 'chapter', 'comment', 'review', 'user'].includes(b.targetType)) throw new BadRequestException('Loại báo cáo không hợp lệ');
    return this.prisma.report.create({
      data: { reporterId: me.id, targetType: b.targetType, targetId: need(b.targetId, 'Thiếu đối tượng'), reason: need(String(b.reason || '').slice(0, 80), 'Thiếu lý do'), detail: String(b.detail || '').slice(0, 1000) },
    });
  }
}
