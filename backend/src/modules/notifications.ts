import { Controller, Get, Injectable, Param, Post } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuthUser, CurrentUser } from '../common/auth';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}
  async notify(userIds: string[], n: { type: string; title: string; body: string; link?: string }) {
    const ids = [...new Set(userIds)];
    if (!ids.length) return;
    await this.prisma.notification.createMany({ data: ids.map((userId) => ({ userId, ...n })) });
  }
}

@Controller('notifications')
export class NotificationsController {
  constructor(private prisma: PrismaService) {}
  @Get()
  async list(@CurrentUser() u: AuthUser) {
    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.notification.count({ where: { userId: u.id, read: false } }),
    ]);
    return { items, unread };
  }
  @Post('read-all')
  async readAll(@CurrentUser() u: AuthUser) {
    await this.prisma.notification.updateMany({ where: { userId: u.id, read: false }, data: { read: true } });
    return { ok: true };
  }
  @Post(':id/read')
  async read(@CurrentUser() u: AuthUser, @Param('id') id: string) {
    await this.prisma.notification.updateMany({ where: { id, userId: u.id }, data: { read: true } });
    return { ok: true };
  }
}
