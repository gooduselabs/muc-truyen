import {
  BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, Post, Query, Req,
} from '@nestjs/common';
import { Account, LedgerType, Prisma, UnlockKind } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { AuthUser, CurrentUser, Public, int, need } from '../common/auth';
import { NotificationsService } from './notifications';
import {
  AUTHOR_SHARE, COIN_VND, MIN_PAYOUT, PACKAGES, RENTAL_HOURS, RENTAL_RATIO, TIP_SHARE, authorCut, rentalPrice,
} from './economy';
import { PROVIDERS } from './payments';

type Tx = Prisma.TransactionClient;

export type AccessReason = 'FREE' | 'AUTHOR' | 'PURCHASED' | 'RENTAL' | 'WAIT_FREE' | 'LOCKED';
export interface Access {
  canRead: boolean; reason: AccessReason; price: number; rentPrice: number;
  expiresAt: Date | null; waitFree: { enabled: boolean; hours: number | null; availableAt: Date | null };
}

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  /** Atomic balance change + ledger row. Debits fail (no partial writes) when balance is insufficient. */
  async move(tx: Tx, userId: string, account: Account, amount: number, type: LedgerType, refId?: string, note?: string) {
    if (!Number.isInteger(amount) || amount === 0) throw new BadRequestException('Số xu không hợp lệ');
    const field = account === 'COINS' ? 'coins' : 'earnings';
    if (amount < 0) {
      const r = await tx.user.updateMany({ where: { id: userId, [field]: { gte: -amount } }, data: { [field]: { increment: amount } } });
      if (r.count === 0) throw new BadRequestException(account === 'COINS' ? 'Không đủ xu, vui lòng nạp thêm' : 'Không đủ số dư thu nhập');
    } else {
      await tx.user.update({ where: { id: userId }, data: { [field]: { increment: amount } } });
    }
    const u = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { coins: true, earnings: true } });
    const balanceAfter = account === 'COINS' ? u.coins : u.earnings;
    await tx.ledgerEntry.create({ data: { userId, account, type, amount, balanceAfter, refId, note } });
    return balanceAfter;
  }

  async access(userId: string | undefined, chapterId: string, now = new Date()): Promise<Access> {
    const ch = await this.prisma.chapter.findUnique({ where: { id: chapterId }, include: { story: true } });
    if (!ch) throw new NotFoundException('Không tìm thấy chương');
    const wf = ch.story.waitFreeHours;
    const base: Access = {
      canRead: false, reason: 'LOCKED', price: ch.price, rentPrice: rentalPrice(ch.price), expiresAt: null,
      waitFree: { enabled: !!wf && ch.price > 0, hours: wf, availableAt: null },
    };
    if (ch.price <= 0) return { ...base, canRead: true, reason: 'FREE' };
    if (!userId) return base;
    if (ch.story.authorId === userId) return { ...base, canRead: true, reason: 'AUTHOR' };
    const unlocks = await this.prisma.unlock.findMany({ where: { userId, chapterId } });
    const perm = unlocks.find((u) => u.kind !== 'RENTAL');
    if (perm) return { ...base, canRead: true, reason: perm.kind === 'WAIT_FREE' ? 'WAIT_FREE' : 'PURCHASED' };
    const rent = unlocks.filter((u) => u.kind === 'RENTAL' && u.expiresAt && u.expiresAt > now)
      .sort((a, b) => +b.expiresAt! - +a.expiresAt!)[0];
    if (wf) {
      const t = await this.prisma.waitFreeTimer.findUnique({ where: { userId_storyId: { userId, storyId: ch.storyId } } });
      base.waitFree.availableAt = t && t.nextAvailableAt > now ? t.nextAvailableAt : now;
    }
    if (rent) return { ...base, canRead: true, reason: 'RENTAL', expiresAt: rent.expiresAt };
    return base;
  }

  async unlock(userId: string, chapterId: string, mode: 'buy' | 'rent' | 'wait', now = new Date()) {
    const acc = await this.access(userId, chapterId, now);
    if (acc.canRead && acc.reason !== 'RENTAL') return { ok: true, already: true, access: acc };
    if (acc.reason === 'RENTAL' && mode !== 'buy') return { ok: true, already: true, access: acc };
    const ch = await this.prisma.chapter.findUniqueOrThrow({ where: { id: chapterId }, include: { story: true } });
    if (ch.status !== 'PUBLISHED') throw new BadRequestException('Chương chưa phát hành');
    await this.prisma.$transaction(async (tx) => {
      if (mode === 'wait') {
        const hours = ch.story.waitFreeHours;
        if (!hours) throw new BadRequestException('Truyện này không hỗ trợ "Chờ là miễn phí"');
        const next = new Date(now.getTime() + hours * 3600e3);
        const t = await tx.waitFreeTimer.findUnique({ where: { userId_storyId: { userId, storyId: ch.storyId } } });
        if (t) {
          const r = await tx.waitFreeTimer.updateMany({
            where: { userId, storyId: ch.storyId, nextAvailableAt: { lte: now } }, data: { nextAvailableAt: next },
          });
          if (r.count === 0) throw new BadRequestException(`Vé miễn phí tiếp theo có lúc ${t.nextAvailableAt.toISOString()}`);
        } else {
          await tx.waitFreeTimer.create({ data: { userId, storyId: ch.storyId, nextAvailableAt: next } });
        }
        await tx.unlock.create({ data: { userId, chapterId, kind: UnlockKind.WAIT_FREE } });
        return;
      }
      const cost = mode === 'buy' ? ch.price : rentalPrice(ch.price);
      const type = mode === 'buy' ? LedgerType.UNLOCK : LedgerType.RENTAL;
      const unlock = await tx.unlock.create({
        data: {
          userId, chapterId, coins: cost, kind: mode === 'buy' ? UnlockKind.PURCHASE : UnlockKind.RENTAL,
          expiresAt: mode === 'rent' ? new Date(now.getTime() + RENTAL_HOURS * 3600e3) : null,
        },
      });
      await this.move(tx, userId, 'COINS', -cost, type, unlock.id, `${ch.story.title} · Chương ${ch.number}`);
      const cut = authorCut(cost);
      if (cut > 0) await this.move(tx, ch.story.authorId, 'EARNINGS', cut, LedgerType.SALE, unlock.id, `${mode === 'buy' ? 'Bán' : 'Cho thuê'} chương ${ch.number} · ${ch.story.title}`);
    });
    return { ok: true, access: await this.access(userId, chapterId, now) };
  }

  async tip(userId: string, storyId: string, coins: number, message = '') {
    if (!Number.isInteger(coins) || coins < 1 || coins > 100_000) throw new BadRequestException('Số xu ủng hộ không hợp lệ');
    const s = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!s) throw new NotFoundException('Không tìm thấy truyện');
    if (s.authorId === userId) throw new BadRequestException('Không thể tự ủng hộ chính mình');
    await this.prisma.$transaction(async (tx) => {
      await this.move(tx, userId, 'COINS', -coins, 'TIP_SENT', s.id, `Ủng hộ "${s.title}"`);
      await this.move(tx, s.authorId, 'EARNINGS', authorCut(coins, TIP_SHARE), 'TIP_RECEIVED', s.id, message.slice(0, 200) || `Ủng hộ "${s.title}"`);
    });
    const me = await this.prisma.user.findUnique({ where: { id: userId } });
    await this.notifications.notify([s.authorId], {
      type: 'tip', title: `${me?.name} ủng hộ ${coins} xu`, body: message || `cho truyện "${s.title}"`, link: `/truyen/${s.slug}`,
    });
    return { ok: true };
  }

  async topup(userId: string, packageId: string, providerId: string, returnUrl: string) {
    const pkg = PACKAGES.find((p) => p.id === packageId);
    if (!pkg) throw new BadRequestException('Gói xu không tồn tại');
    const provider = PROVIDERS.find((p) => p.id === providerId);
    if (!provider || !provider.enabled()) throw new BadRequestException('Cổng thanh toán chưa được cấu hình');
    const payment = await this.prisma.payment.create({
      data: { userId, provider: provider.id, packageId, amountVnd: pkg.vnd, coins: pkg.coins + pkg.bonus },
    });
    const r = await provider.create({ paymentId: payment.id, amountVnd: pkg.vnd, description: `Nap ${pkg.coins + pkg.bonus} xu Muc`, returnUrl });
    if (r.status === 'SUCCEEDED') await this.completePayment(payment.id, true, r.providerRef);
    return { paymentId: payment.id, status: r.status, payUrl: r.payUrl };
  }

  /** Idempotent: credits coins exactly once. */
  async completePayment(paymentId: string, success: boolean, providerRef?: string) {
    await this.prisma.$transaction(async (tx) => {
      const r = await tx.payment.updateMany({
        where: { id: paymentId, status: 'PENDING' }, data: { status: success ? 'SUCCEEDED' : 'FAILED', providerRef },
      });
      if (r.count === 0 || !success) return;
      const p = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
      await this.move(tx, p.userId, 'COINS', p.coins, 'TOPUP', p.id, `Nạp ${p.coins} xu qua ${p.provider}`);
    });
  }

  async requestPayout(userId: string, coins: number, method: string, account: string) {
    if (!Number.isInteger(coins) || coins < MIN_PAYOUT) throw new BadRequestException(`Rút tối thiểu ${MIN_PAYOUT} xu`);
    need(account, 'Thiếu thông tin tài khoản nhận');
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.payoutRequest.create({ data: { userId, coins, amountVnd: coins * COIN_VND, method, account } });
      await this.move(tx, userId, 'EARNINGS', -coins, 'PAYOUT', req.id, `Yêu cầu rút ${coins} xu`);
      return req;
    });
  }

  async resolvePayout(id: string, approve: boolean) {
    return this.prisma.$transaction(async (tx) => {
      const r = await tx.payoutRequest.updateMany({ where: { id, status: 'PENDING' }, data: { status: approve ? 'PAID' : 'REJECTED' } });
      if (r.count === 0) throw new BadRequestException('Yêu cầu đã được xử lý');
      const p = await tx.payoutRequest.findUniqueOrThrow({ where: { id } });
      if (!approve) await this.move(tx, p.userId, 'EARNINGS', p.coins, 'PAYOUT_REFUND', p.id, 'Hoàn lại yêu cầu rút bị từ chối');
      return p;
    });
  }
}

@Controller('wallet')
export class WalletController {
  constructor(private wallet: WalletService, private prisma: PrismaService) {}

  @Public() @Get('config')
  config() {
    return {
      coinVnd: COIN_VND, rentalHours: RENTAL_HOURS, rentalRatio: RENTAL_RATIO, authorShare: AUTHOR_SHARE, tipShare: TIP_SHARE,
      minPayout: MIN_PAYOUT, packages: PACKAGES,
      providers: PROVIDERS.map((p) => ({ id: p.id, label: p.label, enabled: p.enabled() })),
    };
  }

  @Get()
  async me(@CurrentUser() u: AuthUser) {
    const [user, ledger, payouts] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: u.id }, select: { coins: true, earnings: true } }),
      this.prisma.ledgerEntry.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.payoutRequest.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    return { ...user, ledger, payouts };
  }

  @Post('topup')
  topup(@CurrentUser() u: AuthUser, @Body() b: any) {
    return this.wallet.topup(u.id, b.packageId, b.provider || 'sandbox', b.returnUrl || `${process.env.WEB_URL || ''}/vi`);
  }

  @Public() @Post('ipn/:provider')
  async ipn(@Param('provider') pid: string, @Body() body: any, @Query() q: any) {
    const provider = PROVIDERS.find((p) => p.id === pid);
    const v = provider?.verify({ ...q, ...body });
    if (!v) throw new ForbiddenException('Chữ ký không hợp lệ');
    await this.wallet.completePayment(v.paymentId, v.success);
    return { RspCode: '00', resultCode: 0 };
  }

  @Get('access/:chapterId')
  access(@CurrentUser() u: AuthUser, @Param('chapterId') id: string) { return this.wallet.access(u.id, id); }

  @Post('unlock/:chapterId')
  unlock(@CurrentUser() u: AuthUser, @Param('chapterId') id: string, @Body() b: any) {
    const mode = b.mode === 'rent' ? 'rent' : b.mode === 'wait' ? 'wait' : 'buy';
    return this.wallet.unlock(u.id, id, mode);
  }

  @Post('tip/:storyId')
  tip(@CurrentUser() u: AuthUser, @Param('storyId') id: string, @Body() b: any) {
    return this.wallet.tip(u.id, id, int(b.coins, 0, 0, 100_000), b.message || '');
  }

  @Post('payouts')
  payout(@CurrentUser() u: AuthUser, @Body() b: any) {
    return this.wallet.requestPayout(u.id, int(b.coins, 0), b.method || 'bank', b.account || '');
  }
}
