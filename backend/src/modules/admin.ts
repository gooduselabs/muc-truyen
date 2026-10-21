import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { Roles } from '../common/auth';
import { WalletService } from './wallet';
import { NotificationsService } from './notifications';

@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private prisma: PrismaService, private wallet: WalletService, private notifications: NotificationsService) {}

  @Get('stats')
  async stats() {
    const [users, stories, chapters, openReports, pendingPayouts, coins] = await Promise.all([
      this.prisma.user.count(), this.prisma.story.count(), this.prisma.chapter.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.report.count({ where: { status: 'OPEN' } }), this.prisma.payoutRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amountVnd: true, coins: true } }),
    ]);
    return { users, stories, chapters, openReports, pendingPayouts, revenueVnd: coins._sum.amountVnd ?? 0, coinsSold: coins._sum.coins ?? 0 };
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
  async resolve(@Param('id') id: string, @Body() b: any) {
    const r = await this.prisma.report.findUnique({ where: { id } });
    if (!r) throw new BadRequestException('Không tìm thấy báo cáo');
    if (b.action === 'hide') await this.hide(r.targetType, r.targetId);
    if (b.action === 'ban') await this.banOwner(r.targetType, r.targetId);
    await this.prisma.report.update({ where: { id }, data: { status: b.action === 'dismiss' ? 'DISMISSED' : 'RESOLVED' } });
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
  async payout(@Param('id') id: string, @Body() b: any) {
    const p = await this.wallet.resolvePayout(id, b.action === 'approve');
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
      select: { id: true, username: true, name: true, email: true, role: true, banned: true, coins: true, earnings: true, createdAt: true },
    });
  }

  @Post('users/:id')
  async user(@Param('id') id: string, @Body() b: any) {
    return this.prisma.user.update({
      where: { id },
      data: { banned: b.banned !== undefined ? !!b.banned : undefined, role: ['READER', 'AUTHOR', 'ADMIN'].includes(b.role) ? b.role : undefined },
      select: { id: true, banned: true, role: true },
    });
  }
}
