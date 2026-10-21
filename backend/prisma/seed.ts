import { GENRES } from '../src/modules/stories';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { docFromText, slugify, toParagraphs, wordCount } from '../src/common/content';
import { STORIES } from './stories';

const prisma = new PrismaClient();
const DAY = 864e5;
let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = <T>(a: T[]) => a[Math.floor(rnd() * a.length)];

async function ledger(userId: string, account: 'COINS' | 'EARNINGS', type: any, amount: number, note: string, at: Date) {
  const u = await prisma.user.update({ where: { id: userId }, data: account === 'COINS' ? { coins: { increment: amount } } : { earnings: { increment: amount } } });
  await prisma.ledgerEntry.create({ data: { userId, account, type, amount, note, balanceAfter: account === 'COINS' ? u.coins : u.earnings, createdAt: at } });
}

async function main() {
  if (process.env.SEED_IF_EMPTY && (await prisma.user.count()) > 0) return console.log('Đã có dữ liệu — bỏ qua seed.');
  console.log('Xoá dữ liệu cũ…');
  await prisma.$executeRawUnsafe(`TRUNCATE "User","Story","Chapter","Unlock","LedgerEntry","Payment","PayoutRequest","LibraryItem","ReadingProgress","ChapterRead","Comment","ChapterLike","StoryLike","Review","ReadingList","ReadingListItem","Notification","Report","Follow","WaitFreeTimer","Banner","Curation","Category","CoinPackage","Announcement","AuditLog" CASCADE`);
  const hash = await bcrypt.hash('muc12345', 10);
  const mk = (email: string, username: string, name: string, role: any, bio = '') =>
    prisma.user.create({ data: { email, username, name, role, bio, passwordHash: hash } });

  const admin = await mk('admin@muc.vn', 'quantri', 'Ban Quản Trị', 'ADMIN', 'Đội ngũ vận hành Mực.');
  const authors: Record<string, any> = {
    linhan: await mk('linhan@muc.vn', 'linhan', 'Linh An', 'AUTHOR', 'Viết về những điều dịu dàng và hơi kỳ lạ. Sống ở Cần Thơ, nuôi hai con mèo.'),
    quanghuy: await mk('quanghuy@muc.vn', 'quanghuy', 'Quang Huy', 'AUTHOR', 'Kỹ sư phần mềm ban ngày, kiếm khách ban đêm. Mê lịch sử Thăng Long và khoa học viễn tưởng.'),
    thaonguyen: await mk('thaonguyen@muc.vn', 'thaonguyen', 'Thảo Nguyên', 'AUTHOR', 'Bắt đầu viết năm 41 tuổi. Trinh thám, ngôn tình và những trang tản văn lúc 5 giờ sáng.'),
  };
  const demo = await mk('docgia@muc.vn', 'minhthu', 'Minh Thư', 'READER', 'Mọt truyện chính hiệu. Thích huyền huyễn và trinh thám.');
  const names = ['Hoàng Nam', 'Bảo Ngọc', 'Tuấn Kiệt', 'Thu Hà', 'Gia Bảo', 'Khánh Linh', 'Đức Anh', 'Phương Vy', 'Quốc Trung', 'Mai Chi'];
  const readers = [demo];
  for (const n of names) readers.push(await mk(`${slugify(n).replace(/-/g, '')}@muc.vn`, slugify(n).replace(/-/g, ''), n, 'READER'));

  const now = Date.now();
  for (const r of readers) await ledger(r.id, 'COINS', 'BONUS', 300, 'Quà chào mừng thành viên mới', new Date(now - 20 * DAY));
  await prisma.payment.create({ data: { userId: demo.id, provider: 'sandbox', packageId: 'p300', amountVnd: 25000, coins: 300, status: 'SUCCEEDED', createdAt: new Date(now - 10 * DAY) } });
  await ledger(demo.id, 'COINS', 'TOPUP', 300, 'Nạp 300 xu qua sandbox', new Date(now - 10 * DAY));

  console.log('Tạo truyện…');
  const stories: any[] = [];
  for (const [i, s] of STORIES.entries()) {
    const created = new Date(now - (30 - i * 2) * DAY);
    const story = await prisma.story.create({
      data: {
        slug: slugify(s.title), title: s.title, synopsis: s.synopsis, genre: s.genre, tags: s.tags, ageRating: s.ageRating, status: s.status,
        waitFreeHours: s.waitFreeHours ?? null, visibility: 'PUBLISHED', coverSeed: i * 137 + 11, authorId: authors[s.author].id, createdAt: created,
      },
    });
    const chapters: any[] = [];
    for (const [j, c] of s.chapters.entries()) {
      const doc = docFromText(c.text);
      const ps = toParagraphs(doc);
      const at = new Date(created.getTime() + j * 3 * DAY);
      chapters.push(await prisma.chapter.create({
        data: { storyId: story.id, number: j + 1, title: c.title, contentJson: doc, paragraphs: ps as any, wordCount: wordCount(ps), price: c.price ?? 0, status: 'PUBLISHED', publishedAt: at, createdAt: at },
      }));
    }
    await prisma.story.update({ where: { id: story.id }, data: { lastChapterAt: chapters[chapters.length - 1].publishedAt } });
    stories.push({ ...story, chapters, author: authors[s.author] });
  }
  // A draft + a scheduled chapter for the studio demo.
  const s0 = stories[0];
  await prisma.chapter.create({ data: { storyId: s0.id, number: 6, title: 'Bản nháp: Mùa nước nổi', contentJson: docFromText('Nước lên tới bậc thềm thứ ba của ngọn hải đăng…\n\n(đang viết)'), paragraphs: toParagraphs(docFromText('Nước lên tới bậc thềm thứ ba của ngọn hải đăng…\n\n(đang viết)')) as any, wordCount: 12, status: 'DRAFT' } });
  await prisma.chapter.create({ data: { storyId: s0.id, number: 7, title: 'Hẹn giờ: Chiếc xuồng thứ hai', contentJson: docFromText('Sáng mùng một, có một chiếc xuồng thứ hai cập cù lao.'), paragraphs: toParagraphs(docFromText('Sáng mùng một, có một chiếc xuồng thứ hai cập cù lao.')) as any, wordCount: 12, price: 6, status: 'SCHEDULED', publishAt: new Date(now + 3 * DAY) } });

  console.log('Tạo tương tác, lượt đọc, bình luận…');
  const comments = [
    'Đoạn này đọc nổi da gà luôn 😭', 'Văn mượt quá tác giả ơi!', 'Chi tiết này chắc chắn là hint cho mấy chương sau.', 'Ủa khoan, vậy là ông Tư biết từ trước hả?',
    'Hay quá, hóng chương mới!', 'Câu này phải chép vào sổ tay mới được.', 'Tui đọc lúc 2h sáng và giờ không dám tắt đèn 😅', 'Miêu tả cảnh đẹp như phim.',
    'Thương nhân vật này ghê.', 'Ai cũng có một mùa hạ như vậy ha.',
  ];
  const reviews = [
    [5, 'Một trong những truyện huyền huyễn Việt hay nhất mình từng đọc. Không khí sông nước miền Tây được tả rất thật, nhân vật có chiều sâu.'],
    [5, 'Đọc một mạch không dứt ra được. Tác giả viết rất có hồn.'], [4, 'Mở đầu hơi chậm nhưng càng đọc càng cuốn. Mong tác giả ra chương đều.'],
    [4, 'Ý tưởng mới lạ, lời văn đẹp. Trừ một sao vì chương ngắn quá đọc không đã!'], [5, 'Chữa lành thật sự. Cảm ơn tác giả.'],
  ];
  for (const st of stories) {
    const popularity = 0.4 + rnd() * 0.6;
    for (const r of readers) {
      if (rnd() > popularity) continue;
      let maxCh = 0;
      for (const ch of st.chapters) {
        if (ch.price > 0 && rnd() < 0.45) break;
        if (rnd() < 0.18) break; // drop-off
        const total = (ch.paragraphs as any[]).length;
        const reached = rnd() < 0.8 ? total - 1 : Math.floor(rnd() * total);
        await prisma.chapterRead.create({ data: { storyId: st.id, chapterId: ch.id, userId: r.id, maxParagraph: reached, completed: reached >= total - 1, createdAt: new Date(now - Math.floor(rnd() * 14) * DAY - Math.floor(rnd() * DAY)) } });
        await prisma.chapter.update({ where: { id: ch.id }, data: { views: { increment: 1 + Math.floor(rnd() * 30) } } });
        if (ch.price > 0) {
          const rent = rnd() < 0.4;
          const cost = rent ? Math.max(1, Math.ceil(ch.price * 0.4)) : ch.price;
          const at = new Date(now - Math.floor(rnd() * 10) * DAY);
          await prisma.unlock.create({ data: { userId: r.id, chapterId: ch.id, kind: rent ? 'RENTAL' : 'PURCHASE', coins: cost, expiresAt: rent ? new Date(at.getTime() + 2 * DAY) : null, createdAt: at } });
          await ledger(r.id, 'COINS', rent ? 'RENTAL' : 'UNLOCK', -cost, `${st.title} · Chương ${ch.number}`, at);
          await ledger(st.authorId, 'EARNINGS', 'SALE', Math.floor(cost * 0.7), `${rent ? 'Cho thuê' : 'Bán'} chương ${ch.number} · ${st.title}`, at);
        }
        if (rnd() < 0.3) {
          const p = rnd() < 0.7 ? Math.floor(rnd() * total) : null;
          await prisma.comment.create({ data: { chapterId: ch.id, userId: r.id, paragraph: p, body: pick(comments), createdAt: new Date(now - Math.floor(rnd() * 10) * DAY) } });
        }
        if (rnd() < 0.4) await prisma.chapterLike.create({ data: { userId: r.id, chapterId: ch.id } });
        maxCh = ch.number;
      }
      if (maxCh) {
        const last = st.chapters[maxCh - 1];
        await prisma.readingProgress.create({ data: { userId: r.id, storyId: st.id, chapterId: last.id, chapterNo: maxCh, paragraph: 0 } });
        if (rnd() < 0.6) await prisma.libraryItem.create({ data: { userId: r.id, storyId: st.id } });
        if (rnd() < 0.5) await prisma.storyLike.create({ data: { userId: r.id, storyId: st.id } });
        if (rnd() < 0.35) { const [rating, body] = pick(reviews); await prisma.review.create({ data: { userId: r.id, storyId: st.id, rating: rating as number, body: body as string } }); }
      }
    }
    await prisma.story.update({ where: { id: st.id }, data: { views: (await prisma.chapter.aggregate({ where: { storyId: st.id }, _sum: { views: true } }))._sum.views ?? 0 } });
  }
  // Tips
  for (let k = 0; k < 6; k++) {
    const r = pick(readers.slice(1)); const st = pick(stories); const coins = pick([10, 20, 50]);
    const at = new Date(now - Math.floor(rnd() * 7) * DAY);
    await ledger(r.id, 'COINS', 'TIP_SENT', -coins, `Ủng hộ "${st.title}"`, at);
    await ledger(st.authorId, 'EARNINGS', 'TIP_RECEIVED', Math.floor(coins * 0.9), `Ủng hộ "${st.title}"`, at);
  }
  // Demo reader state
  await prisma.libraryItem.createMany({ data: stories.slice(0, 4).map((s) => ({ userId: demo.id, storyId: s.id })), skipDuplicates: true });
  for (const a of Object.values(authors)) await prisma.follow.create({ data: { followerId: demo.id, followingId: a.id } });
  for (const r of readers.slice(1, 8)) {
    await prisma.follow.create({ data: { followerId: r.id, followingId: authors.linhan.id } });
    await prisma.follow.createMany({ data: [{ followerId: demo.id, followingId: r.id }], skipDuplicates: true });
  }
  const list = await prisma.readingList.create({ data: { ownerId: demo.id, name: 'Đọc để chữa lành 🌿', description: 'Những truyện nhẹ nhàng cho tối thứ Sáu.' } });
  await prisma.readingListItem.createMany({ data: [stories[0], stories[2], stories[7]].map((s) => ({ listId: list.id, storyId: s.id })) });
  const list2 = await prisma.readingList.create({ data: { ownerId: readers[2].id, name: 'Trinh thám & kinh dị đọc đêm', description: 'Bật đèn lên trước khi đọc.' } });
  await prisma.readingListItem.createMany({ data: [stories[3], stories[6]].map((s) => ({ listId: list2.id, storyId: s.id })) });
  await prisma.notification.createMany({ data: [
    { userId: demo.id, type: 'chapter', title: `${stories[0].title} có chương mới`, body: 'Chương 5: Chuyện Lộc không kể', link: `/truyen/${stories[0].slug}/5` },
    { userId: demo.id, type: 'follow', title: '@baongoc đã theo dõi bạn', body: '', link: '/u/baongoc' },
  ] });
  // Reports + payout for the admin page
  const someComment = await prisma.comment.findFirst();
  if (someComment) await prisma.report.create({ data: { reporterId: readers[3].id, targetType: 'comment', targetId: someComment.id, reason: 'Tiết lộ nội dung (spoiler)', detail: 'Bình luận tiết lộ kết truyện mà không cảnh báo.' } });
  await prisma.report.create({ data: { reporterId: readers[4].id, targetType: 'story', targetId: stories[6].id, reason: 'Sai nhãn độ tuổi', detail: 'Truyện có cảnh đáng sợ, nên để 16+ (đã là T16?).' } });
  const tn = authors.thaonguyen;
  const bal = (await prisma.user.findUniqueOrThrow({ where: { id: tn.id } })).earnings;
  if (bal >= 20) {
    const amt = Math.floor(bal / 2);
    const p = await prisma.payoutRequest.create({ data: { userId: tn.id, coins: amt, amountVnd: amt * 100, method: 'momo', account: '0909 xxx 123 (MoMo)' } });
    await ledger(tn.id, 'EARNINGS', 'PAYOUT', -amt, `Yêu cầu rút ${amt} xu`, new Date());
    void p;
  }
  const pkgs = [['p50', 50, 5000], ['p120', 120, 10000], ['p300', 300, 25000], ['p650', 650, 50000]] as const;
  for (let i = 0; i < 26; i++) {
    const [pid, coins, vnd] = pkgs[(i * 7) % 4];
    const u = readers[1 + (i % (readers.length - 1))];
    const at = new Date(now - ((i * 11) % 29) * DAY - (i % 5) * 3600e3);
    await prisma.payment.create({ data: { userId: u.id, provider: 'sandbox', packageId: pid, amountVnd: vnd, coins, status: 'SUCCEEDED', createdAt: at } });
    await ledger(u.id, 'COINS', 'TOPUP', coins, `Nạp ${coins} xu qua sandbox`, at);
  }
  console.log('Tạo dữ liệu quản trị: banner, mục tuyển chọn, gói xu, nhật ký…');
  const by = (t: string) => stories.find((x) => x.title === t)!;
  for (const a of Object.values(authors)) await prisma.user.update({ where: { id: a.id }, data: { verified: true } });
  for (const [i, name] of GENRES.entries()) await prisma.category.create({ data: { name, position: i } });
  const pk = [
    { id: 'p50', coins: 50, bonus: 0, vnd: 5000, label: '' },
    { id: 'p120', coins: 100, bonus: 20, vnd: 10000, label: 'Phổ biến' },
    { id: 'p300', coins: 250, bonus: 50, vnd: 25000, label: '', promoBonus: 30, promoUntil: new Date(now + 7 * DAY) },
    { id: 'p650', coins: 500, bonus: 150, vnd: 50000, label: 'Hời nhất' },
  ];
  for (const [i, p] of pk.entries()) await prisma.coinPackage.create({ data: { ...p, position: i } });
  const lh = by('Người Gác Đèn Ở Cù Lao Mây'), mh = by('Mùa Hạ Năm Ấy Có Cậu'), hs = by('Hồ Sơ Mật Chung Cư 404');
  await prisma.story.update({ where: { id: lh.id }, data: { pinned: true, featured: true } });
  await prisma.story.update({ where: { id: hs.id }, data: { featured: true, rankBoost: 2 } });
  await prisma.story.update({ where: { id: mh.id }, data: { featured: true } });
  await prisma.banner.createMany({ data: [
    { title: lh.title, kicker: 'Biên tập viên chọn', subtitle: 'Một ngọn hải đăng giữ cho cả thế giới khỏi trôi đi. Truyện cổ tích miền Tây dành cho người lớn.', storyId: lh.id, hue: 18, position: 0 },
    { title: 'Mùa thi viết “Đêm Trung Thu”', kicker: 'Sự kiện · đến 30/11', subtitle: 'Gửi truyện ngắn dưới 5.000 chữ, giải thưởng 10 triệu đồng và xuất bản trên trang chủ.', link: '/kham-pha', hue: 38, position: 1 },
    { title: hs.title, kicker: 'Trinh thám hot', subtitle: 'Căn hộ 404 không ai nhớ đã từng có người ở. Cho tới khi một shipper biến mất.', storyId: hs.id, hue: 250, position: 2 },
    { title: 'Ưu đãi nạp xu', kicker: 'Hết hạn', subtitle: 'Banner đã hết lịch — không hiển thị.', link: '/vi', hue: 120, position: 3, endsAt: new Date(now - DAY) },
  ] });
  await prisma.curation.createMany({ data: [
    { title: 'Biên tập viên chọn', subtitle: 'Những trang viết chúng tôi muốn bạn đọc trước tiên', style: 'spotlight', storyIds: [lh.id, mh.id, by('Kiếm Khách Phố Hàng Bạc').id], position: 0 },
    { title: 'Chữa lành cuối tuần', subtitle: 'Dịu dàng, ấm áp, đọc xong thấy nhẹ lòng', style: 'shelf', storyIds: stories.filter((x) => x.tags.includes('chữa lành') || x.genre === 'Thơ & Tản văn').map((x) => x.id), position: 1 },
    { title: 'Rợn người đêm khuya', subtitle: 'Đừng đọc một mình', style: 'shelf', storyIds: [by('Chuyện Ma Làng Gốm').id, hs.id], position: 2 },
  ] });
  // A story waiting for moderation.
  const pending = await prisma.story.create({ data: {
    slug: 'gio-nam-tren-pho-hien', title: 'Gió Nam Trên Phố Hiến', synopsis: 'Thương cảng Phố Hiến thế kỷ XVII, một cô gái giữ sổ sách cho thương thuyền Hà Lan và bí mật của chiếc rương khoá đồng.',
    genre: 'Lịch sử', tags: ['phố hiến', 'thương cảng', 'cổ trang'], visibility: 'PENDING', coverSeed: 1234, authorId: tn.id,
  } });
  const pd = docFromText('Năm ấy gió nam thổi sớm, và thuyền Hà Lan cập bến khi hoa gạo còn chưa rụng hết.');
  await prisma.chapter.create({ data: { storyId: pending.id, number: 1, title: 'Chiếc rương khoá đồng', contentJson: pd, paragraphs: toParagraphs(pd) as any, wordCount: 20, status: 'PUBLISHED', publishedAt: new Date() } });
  const ann = await prisma.announcement.create({ data: { title: 'Chào mừng đến với Mực 🎉', body: 'Phiên bản 0.1 đã ra mắt: đọc offline, nghe truyện, chờ là miễn phí.', audience: 'ALL', recipients: readers.length + 4, createdAt: new Date(now - 2 * DAY) } });
  const logs = [
    ['announcement.send', ann.title], ['banner.create', lh.title], ['story.pin', lh.title], ['story.feature', hs.title], ['story.boost', hs.title],
    ['curation.create', 'Biên tập viên chọn'], ['package.upsert', 'p300'], ['user.update', '@linhan'], ['report.dismiss', 'comment'],
  ];
  for (const [i, [action, target]] of logs.entries()) await prisma.auditLog.create({ data: { actorId: admin.id, actor: admin.username, action, target, createdAt: new Date(now - (logs.length - i) * 5 * 3600e3) } });
  console.log(`Xong: ${stories.length} truyện, ${readers.length} độc giả. Đăng nhập: docgia@muc.vn / linhan@muc.vn / admin@muc.vn — mật khẩu muc12345`);
}

main().finally(() => prisma.$disconnect());
