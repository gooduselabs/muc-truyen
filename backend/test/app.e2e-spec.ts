import { INestApplication } from '@nestjs/common';
import request from 'supertest';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://story:story@localhost:5432/story_test';
process.env.JWT_SECRET = 'test';
import { createApp } from '../src/main';
import { PrismaService } from '../src/common/prisma.service';
import { WalletService } from '../src/modules/wallet';

let app: INestApplication, prisma: PrismaService, wallet: WalletService;
let http: ReturnType<typeof request>;
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const doc = (t: string) => ({ type: 'doc', content: t.split('\n').map((x) => ({ type: 'paragraph', content: [{ type: 'text', text: x }] })) });

let authorT: string, readerT: string, reader2T: string, authorId: string, readerId: string;
let storyId: string, slug: string, free: string, paid1: string, paid2: string, paid3: string;

beforeAll(async () => {
  app = await createApp();
  await app.init();
  prisma = app.get(PrismaService);
  wallet = app.get(WalletService);
  http = request(app.getHttpServer());
});
afterAll(() => app.close());

async function ledgerConsistent(userId: string) {
  const u = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const sum = async (account: any) => (await prisma.ledgerEntry.aggregate({ where: { userId, account }, _sum: { amount: true } }))._sum.amount ?? 0;
  expect(await sum('COINS')).toBe(u.coins);
  expect(await sum('EARNINGS')).toBe(u.earnings);
  expect(u.coins).toBeGreaterThanOrEqual(0);
}

describe('Auth', () => {
  it('đăng ký, đăng nhập, /me', async () => {
    const a = await http.post('/api/auth/register').send({ email: 'TacGia@test.vn', password: 'matkhau123', name: 'Tác Giả', asAuthor: true }).expect(201);
    authorT = a.body.token; authorId = a.body.user.id;
    expect(a.body.user.role).toBe('AUTHOR');
    const r = await http.post('/api/auth/register').send({ email: 'docgia@test.vn', password: 'matkhau123', name: 'Độc Giả' }).expect(201);
    readerT = r.body.token; readerId = r.body.user.id;
    reader2T = (await http.post('/api/auth/register').send({ email: 'docgia2@test.vn', password: 'matkhau123', name: 'Độc Giả Hai' })).body.token;
    await http.post('/api/auth/register').send({ email: 'docgia@test.vn', password: 'matkhau123', name: 'X' }).expect(409);
    await http.post('/api/auth/register').send({ email: 'x@test.vn', password: 'ngan', name: 'X' }).expect(400);
    await http.post('/api/auth/login').send({ email: 'tacgia@test.vn', password: 'sai-mat-khau' }).expect(401);
    const l = await http.post('/api/auth/login').send({ email: 'tacgia@test.vn', password: 'matkhau123' }).expect(201);
    expect(l.body.token).toBeTruthy();
    await http.get('/api/auth/me').expect(401);
    const me = await http.get('/api/auth/me').set(auth(readerT)).expect(200);
    expect(me.body.user.email).toBe('docgia@test.vn');
  });
  it('độc giả không vào được studio', async () => {
    await http.get('/api/studio/stories').set(auth(readerT)).expect(403);
  });
});

describe('Studio + đọc truyện', () => {
  it('tạo truyện, chương nháp, phát hành, hẹn giờ', async () => {
    const s = await http.post('/api/studio/stories').set(auth(authorT))
      .send({ title: 'Truyện Thử Nghiệm', synopsis: 'x', genre: 'Huyền huyễn', tags: 'thử, Test', visibility: 'PUBLISHED', waitFreeHours: 24 }).expect(201);
    storyId = s.body.id; slug = s.body.slug;
    expect(slug).toBe('truyen-thu-nghiem');
    expect(s.body.tags).toEqual(['thử', 'test']);
    free = (await http.post(`/api/studio/stories/${storyId}/chapters`).set(auth(authorT)).send({ title: 'Một', content: doc('a\nb\nc'), status: 'PUBLISHED' }).expect(201)).body.id;
    paid1 = (await http.post(`/api/studio/stories/${storyId}/chapters`).set(auth(authorT)).send({ title: 'Hai', content: doc('d\ne\nf'), price: 10, status: 'PUBLISHED' })).body.id;
    paid2 = (await http.post(`/api/studio/stories/${storyId}/chapters`).set(auth(authorT)).send({ title: 'Ba', content: doc('g\nh'), price: 5, status: 'PUBLISHED' })).body.id;
    paid3 = (await http.post(`/api/studio/stories/${storyId}/chapters`).set(auth(authorT)).send({ title: 'Bốn', content: doc('i'), price: 5, status: 'PUBLISHED' })).body.id;
    const draft = await http.post(`/api/studio/stories/${storyId}/chapters`).set(auth(authorT)).send({ title: 'Nháp', content: doc('z') }).expect(201);
    expect(draft.body.status).toBe('DRAFT');
    await http.patch(`/api/studio/chapters/${draft.body.id}`).set(auth(authorT)).send({ status: 'SCHEDULED', publishAt: new Date(Date.now() - 1000).toISOString() }).expect(400);
    await http.patch(`/api/studio/chapters/${draft.body.id}`).set(auth(authorT)).send({ status: 'SCHEDULED', publishAt: new Date(Date.now() + 3600e3).toISOString() }).expect(200);
    await http.get(`/api/stories/${slug}/chapters/5`).expect(404);
    await prisma.chapter.update({ where: { id: draft.body.id }, data: { publishAt: new Date(Date.now() - 1000) } });
    // follower gets notified when the scheduler publishes
    await http.post('/api/users/tacgia/follow').set(auth(readerT)).expect(201);
    const { StoriesService } = await import('../src/modules/stories');
    expect(await app.get(StoriesService).publishDue()).toBe(1);
    await http.get(`/api/stories/${slug}/chapters/5`).expect(200);
    const n = await http.get('/api/notifications').set(auth(readerT)).expect(200);
    expect(n.body.items.some((x: any) => x.type === 'chapter')).toBe(true);
  });

  it('chương khoá chỉ trả 2 đoạn xem trước', async () => {
    const r = await http.get(`/api/stories/${slug}/chapters/2`).set(auth(readerT)).expect(200);
    expect(r.body.access).toMatchObject({ canRead: false, reason: 'LOCKED', price: 10, rentPrice: 4 });
    expect(r.body.chapter.paragraphs).toHaveLength(2);
    const free1 = await http.get(`/api/stories/${slug}/chapters/1`).expect(200);
    expect(free1.body.access.reason).toBe('FREE');
    const own = await http.get(`/api/stories/${slug}/chapters/2`).set(auth(authorT)).expect(200);
    expect(own.body.access.reason).toBe('AUTHOR');
  });
});

describe('Ví xu, mở khoá, thuê, chờ miễn phí', () => {
  it('nạp xu sandbox ghi sổ cái', async () => {
    await http.post('/api/wallet/topup').set(auth(readerT)).send({ packageId: 'nope' }).expect(400);
    const t = await http.post('/api/wallet/topup').set(auth(readerT)).send({ packageId: 'p50', provider: 'sandbox' }).expect(201);
    expect(t.body.status).toBe('SUCCEEDED');
    await wallet.completePayment(t.body.paymentId, true); // idempotent
    const w = await http.get('/api/wallet').set(auth(readerT)).expect(200);
    expect(w.body.coins).toBe(50);
    await ledgerConsistent(readerId);
  });

  it('mua chương: trừ xu, tác giả nhận 70%, không trừ hai lần', async () => {
    const r = await http.post(`/api/wallet/unlock/${paid1}`).set(auth(readerT)).send({ mode: 'buy' }).expect(201);
    expect(r.body.access.reason).toBe('PURCHASED');
    const again = await http.post(`/api/wallet/unlock/${paid1}`).set(auth(readerT)).send({ mode: 'buy' }).expect(201);
    expect(again.body.already).toBe(true);
    const u = await prisma.user.findUniqueOrThrow({ where: { id: readerId } });
    expect(u.coins).toBe(40);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: authorId } })).earnings).toBe(7);
    const c = await http.get(`/api/stories/${slug}/chapters/2`).set(auth(readerT)).expect(200);
    expect(c.body.chapter.paragraphs).toHaveLength(3);
    await ledgerConsistent(readerId); await ledgerConsistent(authorId);
  });

  it('thuê 48h: hết hạn thì khoá lại', async () => {
    const r = await http.post(`/api/wallet/unlock/${paid2}`).set(auth(readerT)).send({ mode: 'rent' }).expect(201);
    expect(r.body.access.reason).toBe('RENTAL');
    const exp = new Date(r.body.access.expiresAt).getTime();
    expect(Math.round((exp - Date.now()) / 3600e3)).toBe(48);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: readerId } })).coins).toBe(38); // 40 - ceil(5*0.4)=2
    const later = await wallet.access(readerId, paid2, new Date(Date.now() + 49 * 3600e3));
    expect(later).toMatchObject({ canRead: false, reason: 'LOCKED' });
    // upgrading a rental to a purchase is allowed
    const buy = await wallet.unlock(readerId, paid2, 'buy');
    expect(buy.access.reason).toBe('PURCHASED');
    await ledgerConsistent(readerId);
  });

  it('chờ là miễn phí: 1 vé mỗi 24h mỗi truyện, không tốn xu', async () => {
    const before = (await prisma.user.findUniqueOrThrow({ where: { id: readerId } })).coins;
    const r = await http.post(`/api/wallet/unlock/${paid3}`).set(auth(readerT)).send({ mode: 'wait' }).expect(201);
    expect(r.body.access.reason).toBe('WAIT_FREE');
    expect((await prisma.user.findUniqueOrThrow({ where: { id: readerId } })).coins).toBe(before);
    const r2 = await http.post(`/api/wallet/unlock/${paid3}`).set(auth(reader2T)).send({ mode: 'wait' }).expect(201);
    expect(r2.body.access.reason).toBe('WAIT_FREE');
    const extra = (await http.post(`/api/studio/stories/${storyId}/chapters`).set(auth(authorT)).send({ title: 'Sáu', content: doc('k'), price: 5, status: 'PUBLISHED' })).body.id;
    const fail = await http.post(`/api/wallet/unlock/${extra}`).set(auth(reader2T)).send({ mode: 'wait' }).expect(400);
    expect(fail.body.message).toMatch(/Vé miễn phí tiếp theo/);
    // after 24h the ticket recharges
    const r2id = (await prisma.user.findUniqueOrThrow({ where: { email: 'docgia2@test.vn' } })).id;
    const ok = await wallet.unlock(r2id, extra, 'wait', new Date(Date.now() + 25 * 3600e3));
    expect(ok.access.reason).toBe('WAIT_FREE');
  });

  it('không đủ xu thì không mở khoá và không ghi sổ', async () => {
    const r2id = (await prisma.user.findUniqueOrThrow({ where: { email: 'docgia2@test.vn' } })).id;
    const n = await prisma.ledgerEntry.count({ where: { userId: r2id } });
    const res = await http.post(`/api/wallet/unlock/${paid1}`).set(auth(reader2T)).send({ mode: 'buy' }).expect(400);
    expect(res.body.message).toMatch(/Không đủ xu/);
    expect(await prisma.ledgerEntry.count({ where: { userId: r2id } })).toBe(n);
    expect(await prisma.unlock.count({ where: { userId: r2id, chapterId: paid1 } })).toBe(0);
  });

  it('mở khoá đồng thời không làm âm số dư', async () => {
    const r2id = (await prisma.user.findUniqueOrThrow({ where: { email: 'docgia2@test.vn' } })).id;
    await prisma.$transaction((tx) => wallet.move(tx, r2id, 'COINS', 12, 'ADJUST'));
    const ids: string[] = [];
    for (let i = 0; i < 4; i++) ids.push((await http.post(`/api/studio/stories/${storyId}/chapters`).set(auth(authorT)).send({ title: `C${i}`, content: doc('x'), price: 5, status: 'PUBLISHED' })).body.id);
    const results = await Promise.allSettled(ids.map((id) => wallet.unlock(r2id, id, 'buy')));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(2);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: r2id } })).coins).toBe(2);
    await ledgerConsistent(r2id);
  });

  it('ủng hộ tác giả 90% và rút tiền', async () => {
    await http.post(`/api/wallet/tip/${storyId}`).set(auth(readerT)).send({ coins: 10, message: 'Hay lắm!' }).expect(201);
    await http.post(`/api/wallet/tip/${storyId}`).set(auth(authorT)).send({ coins: 1 }).expect(400);
    const a = await prisma.user.findUniqueOrThrow({ where: { id: authorId } });
    expect(a.earnings).toBeGreaterThan(0);
    await http.post('/api/wallet/payouts').set(auth(authorT)).send({ coins: 10, account: 'x' }).expect(400); // < MIN_PAYOUT
    await prisma.$transaction((tx) => wallet.move(tx, authorId, 'EARNINGS', 600, 'ADJUST'));
    const p = await http.post('/api/wallet/payouts').set(auth(authorT)).send({ coins: 500, method: 'momo', account: '0909' }).expect(201);
    const rej = await wallet.resolvePayout(p.body.id, false);
    expect(rej.status).toBe('REJECTED');
    await expect(wallet.resolvePayout(p.body.id, true)).rejects.toThrow();
    await ledgerConsistent(authorId);
  });
});

describe('Cộng đồng & khám phá', () => {
  it('bình luận theo đoạn, đánh giá cần đã đọc, tìm kiếm không dấu', async () => {
    await http.post(`/api/chapters/${free}/comments`).set(auth(readerT)).send({ body: 'Đoạn hay!', paragraph: 1 }).expect(201);
    const cs = await http.get(`/api/chapters/${free}/comments?paragraph=1`).expect(200);
    expect(cs.body).toHaveLength(1);
    await http.post(`/api/stories/${storyId}/reviews`).set(auth(reader2T)).send({ rating: 1, body: 'chưa đọc' }).expect(400);
    await http.post('/api/reads').set(auth(readerT)).send({ chapterId: free, maxParagraph: 2 }).expect(201);
    await http.post(`/api/stories/${storyId}/reviews`).set(auth(readerT)).send({ rating: 5, body: 'Tuyệt' }).expect(201);
    const s = await http.get('/api/discover/search?q=truyen thu').expect(200);
    expect(s.body.items[0].slug).toBe(slug);
    const a = await http.get(`/api/studio/analytics/chapters/${free}`).set(auth(authorT)).expect(200);
    expect(a.body.paragraphs[2].reached).toBe(1);
  });
});
