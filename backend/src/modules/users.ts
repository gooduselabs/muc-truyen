import { BadRequestException, Controller, Delete, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuthUser, CurrentUser, Public, int } from '../common/auth';
import { NotificationsService } from './notifications';
import { publicUser } from './auth';
import { storyCard } from './stories';

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  @Public() @Get(':username')
  async profile(@Param('username') username: string, @CurrentUser() me?: AuthUser) {
    const u = await this.prisma.user.findUnique({ where: { username }, select: publicUser });
    if (!u) throw new NotFoundException('Không tìm thấy người dùng');
    const [followers, following, stories, lists, reviews, isFollowing] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: u.id } }),
      this.prisma.follow.count({ where: { followerId: u.id } }),
      this.prisma.story.findMany({ where: { authorId: u.id, visibility: 'PUBLISHED' }, select: storyCard, orderBy: { updatedAt: 'desc' } }),
      this.prisma.readingList.findMany({
        where: { ownerId: u.id, isPublic: true },
        include: { items: { include: { story: { select: storyCard } }, take: 6 }, _count: { select: { items: true } } },
      }),
      this.prisma.review.findMany({ where: { userId: u.id, hidden: false }, include: { story: { select: storyCard } }, orderBy: { createdAt: 'desc' }, take: 10 }),
      me ? this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: me.id, followingId: u.id } } }) : null,
    ]);
    return { ...u, followers, following, stories, lists, reviews, isFollowing: !!isFollowing };
  }

  @Post(':username/follow')
  async follow(@CurrentUser() me: AuthUser, @Param('username') username: string) {
    const u = await this.prisma.user.findUnique({ where: { username } });
    if (!u) throw new NotFoundException();
    if (u.id === me.id) throw new BadRequestException('Không thể tự theo dõi');
    const existed = await this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: me.id, followingId: u.id } } });
    if (!existed) {
      await this.prisma.follow.create({ data: { followerId: me.id, followingId: u.id } });
      await this.notifications.notify([u.id], { type: 'follow', title: `@${me.username} đã theo dõi bạn`, body: '', link: `/u/${me.username}` });
    }
    return { following: true };
  }

  @Delete(':username/follow')
  async unfollow(@CurrentUser() me: AuthUser, @Param('username') username: string) {
    const u = await this.prisma.user.findUnique({ where: { username } });
    if (u) await this.prisma.follow.deleteMany({ where: { followerId: me.id, followingId: u.id } });
    return { following: false };
  }
}

@Controller('feed')
export class FeedController {
  constructor(private prisma: PrismaService) {}
  /** Activity feed: new chapters from followed authors + library, reviews & lists by followed users. */
  @Get()
  async feed(@CurrentUser() me: AuthUser, @Query('limit') limit?: string) {
    const take = int(limit, 30, 1, 100);
    const follows = await this.prisma.follow.findMany({ where: { followerId: me.id }, select: { followingId: true } });
    const ids = follows.map((f) => f.followingId);
    const lib = await this.prisma.libraryItem.findMany({ where: { userId: me.id }, select: { storyId: true } });
    const [chapters, reviews, lists] = await Promise.all([
      this.prisma.chapter.findMany({
        where: { status: 'PUBLISHED', story: { visibility: 'PUBLISHED', OR: [{ authorId: { in: ids } }, { id: { in: lib.map((l) => l.storyId) } }] } },
        orderBy: { publishedAt: 'desc' }, take,
        select: { id: true, number: true, title: true, price: true, publishedAt: true, story: { select: { ...storyCard } } },
      }),
      this.prisma.review.findMany({
        where: { userId: { in: ids }, hidden: false }, orderBy: { createdAt: 'desc' }, take,
        include: { user: { select: publicUser }, story: { select: storyCard } },
      }),
      this.prisma.readingList.findMany({
        where: { ownerId: { in: ids }, isPublic: true }, orderBy: { createdAt: 'desc' }, take: 10,
        include: { owner: { select: publicUser }, items: { include: { story: { select: storyCard } }, take: 4 } },
      }),
    ]);
    const items = [
      ...chapters.map((c) => ({ type: 'chapter', at: c.publishedAt, chapter: c })),
      ...reviews.map((r) => ({ type: 'review', at: r.createdAt, review: r })),
      ...lists.map((l) => ({ type: 'list', at: l.createdAt, list: l })),
    ].sort((a, b) => +new Date(b.at!) - +new Date(a.at!)).slice(0, take);
    return { items, followingCount: ids.length };
  }
}
