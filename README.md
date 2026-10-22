<div align="center">

<img src="docs/logo.svg" width="96" alt="Mực" />

# Mực — truyện viết bằng tâm

**Nền tảng đọc & viết truyện chữ cho người Việt.** Có web cho độc giả, studio cho tác giả, bảng quản trị cho biên tập viên và app Android để đọc mọi nơi.

[![Release](https://img.shields.io/github/v/release/gooduselabs/muc-truyen?include_prereleases&label=b%E1%BA%A3n%20ph%C3%A1t%20h%C3%A0nh&color=c23b22)](https://github.com/gooduselabs/muc-truyen/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-b5832a.svg)](LICENSE)
![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs)
![Flutter](https://img.shields.io/badge/Flutter-3-02569B?logo=flutter)
![Postgres](https://img.shields.io/badge/PostgreSQL-17-336791?logo=postgresql&logoColor=white)
![Tests](https://img.shields.io/badge/tests-28%20passing-2f7d5b)

<img src="docs/screens/web-home-dark.png" width="88%" alt="Trang chủ Mực ở chế độ đêm đèn lồng" />

</div>

---

## ✒️ Vì sao là Mực?

Mực là mực viết, là nét bút lông trên giấy dó, và cũng là ánh đèn lồng đọc truyện đêm khuya. Giao diện được thiết kế theo hai tinh thần **giấy & mực** (ban ngày) và **đêm đèn lồng** (ban đêm). Chữ tiêu đề dùng Playfair Display, chữ đọc dùng Lora, chữ giao diện dùng Be Vietnam Pro, nên tiếng Việt có dấu hiển thị đẹp ở mọi kích cỡ.

## 📸 Ảnh chụp

> Tất cả ảnh đều là ảnh chụp thật từ mã nguồn trong repo với dữ liệu seed (`backend/prisma/seed.ts`). Bấm vào ảnh để xem cỡ đầy đủ.

- [📱 Mobile (Flutter)](#-mobile-flutter)
- [🌐 Web · độc giả](#-web--độc-giả)
- [✍️ Author studio](#️-author-studio)
- [🛡️ Admin](#️-admin)

### 📱 Mobile (Flutter)

| Splash | Trang chủ (khách) | Trang chủ (thành viên) | Trang chủ · đêm |
|---|---|---|---|
| <a href="docs/screens/mobile-splash-light.png"><img src="docs/screens/mobile-splash-light.png" width="180" alt="Splash"/></a> | <a href="docs/screens/mobile-home-light.png"><img src="docs/screens/mobile-home-light.png" width="180" alt="Trang chủ (khách)"/></a> | <a href="docs/screens/mobile-home-member-light.png"><img src="docs/screens/mobile-home-member-light.png" width="180" alt="Trang chủ (thành viên)"/></a> | <a href="docs/screens/mobile-home-member-dark.png"><img src="docs/screens/mobile-home-member-dark.png" width="180" alt="Trang chủ · đêm"/></a> |
| Khám phá · BXH | Tìm kiếm | Thể loại | Khám phá · đêm |
| <a href="docs/screens/mobile-discover-light.png"><img src="docs/screens/mobile-discover-light.png" width="180" alt="Khám phá · BXH"/></a> | <a href="docs/screens/mobile-search-light.png"><img src="docs/screens/mobile-search-light.png" width="180" alt="Tìm kiếm"/></a> | <a href="docs/screens/mobile-genre-light.png"><img src="docs/screens/mobile-genre-light.png" width="180" alt="Thể loại"/></a> | <a href="docs/screens/mobile-discover-dark.png"><img src="docs/screens/mobile-discover-dark.png" width="180" alt="Khám phá · đêm"/></a> |
| Chi tiết truyện | Truyện · đêm | Mục lục & đánh giá | Ủng hộ tác giả |
| <a href="docs/screens/mobile-story-light.png"><img src="docs/screens/mobile-story-light.png" width="180" alt="Chi tiết truyện"/></a> | <a href="docs/screens/mobile-story-dark.png"><img src="docs/screens/mobile-story-dark.png" width="180" alt="Truyện · đêm"/></a> | <a href="docs/screens/mobile-story-toc-light.png"><img src="docs/screens/mobile-story-toc-light.png" width="180" alt="Mục lục & đánh giá"/></a> | <a href="docs/screens/mobile-story-tip-light.png"><img src="docs/screens/mobile-story-tip-light.png" width="180" alt="Ủng hộ tác giả"/></a> |
| Trình đọc · sáng | Trình đọc · sepia | Trình đọc · đêm | Cuối chương |
| <a href="docs/screens/mobile-reader-light.png"><img src="docs/screens/mobile-reader-light.png" width="180" alt="Trình đọc · sáng"/></a> | <a href="docs/screens/mobile-reader-sepia-light.png"><img src="docs/screens/mobile-reader-sepia-light.png" width="180" alt="Trình đọc · sepia"/></a> | <a href="docs/screens/mobile-reader-dark.png"><img src="docs/screens/mobile-reader-dark.png" width="180" alt="Trình đọc · đêm"/></a> | <a href="docs/screens/mobile-reader-end-light.png"><img src="docs/screens/mobile-reader-end-light.png" width="180" alt="Cuối chương"/></a> |
| Cài đặt đọc | Cài đặt đọc · đêm | Bình luận đoạn | Bình luận · đêm |
| <a href="docs/screens/mobile-reader-settings-light.png"><img src="docs/screens/mobile-reader-settings-light.png" width="180" alt="Cài đặt đọc"/></a> | <a href="docs/screens/mobile-reader-settings-dark.png"><img src="docs/screens/mobile-reader-settings-dark.png" width="180" alt="Cài đặt đọc · đêm"/></a> | <a href="docs/screens/mobile-reader-comments-light.png"><img src="docs/screens/mobile-reader-comments-light.png" width="180" alt="Bình luận đoạn"/></a> | <a href="docs/screens/mobile-reader-comments-dark.png"><img src="docs/screens/mobile-reader-comments-dark.png" width="180" alt="Bình luận · đêm"/></a> |
| Chương khoá (khách) | Mở khoá: chờ / thuê / mua | Mở khoá · đêm | Ví xu |
| <a href="docs/screens/mobile-locked-light.png"><img src="docs/screens/mobile-locked-light.png" width="180" alt="Chương khoá (khách)"/></a> | <a href="docs/screens/mobile-unlock-options-light.png"><img src="docs/screens/mobile-unlock-options-light.png" width="180" alt="Mở khoá: chờ / thuê / mua"/></a> | <a href="docs/screens/mobile-unlock-options-dark.png"><img src="docs/screens/mobile-unlock-options-dark.png" width="180" alt="Mở khoá · đêm"/></a> | <a href="docs/screens/mobile-wallet-light.png"><img src="docs/screens/mobile-wallet-light.png" width="180" alt="Ví xu"/></a> |
| Ví xu · đêm | Tủ sách | Tủ sách · đêm | Tủ sách (khách) |
| <a href="docs/screens/mobile-wallet-dark.png"><img src="docs/screens/mobile-wallet-dark.png" width="180" alt="Ví xu · đêm"/></a> | <a href="docs/screens/mobile-library-light.png"><img src="docs/screens/mobile-library-light.png" width="180" alt="Tủ sách"/></a> | <a href="docs/screens/mobile-library-dark.png"><img src="docs/screens/mobile-library-dark.png" width="180" alt="Tủ sách · đêm"/></a> | <a href="docs/screens/mobile-library-guest-light.png"><img src="docs/screens/mobile-library-guest-light.png" width="180" alt="Tủ sách (khách)"/></a> |
| Thông báo | Thông báo · đêm | Tài khoản | Tài khoản (khách) |
| <a href="docs/screens/mobile-notifications-light.png"><img src="docs/screens/mobile-notifications-light.png" width="180" alt="Thông báo"/></a> | <a href="docs/screens/mobile-notifications-dark.png"><img src="docs/screens/mobile-notifications-dark.png" width="180" alt="Thông báo · đêm"/></a> | <a href="docs/screens/mobile-account-light.png"><img src="docs/screens/mobile-account-light.png" width="180" alt="Tài khoản"/></a> | <a href="docs/screens/mobile-account-guest-light.png"><img src="docs/screens/mobile-account-guest-light.png" width="180" alt="Tài khoản (khách)"/></a> |
| Cài đặt | Cài đặt · đêm | Đăng nhập | Đăng ký |
| <a href="docs/screens/mobile-settings-light.png"><img src="docs/screens/mobile-settings-light.png" width="180" alt="Cài đặt"/></a> | <a href="docs/screens/mobile-settings-dark.png"><img src="docs/screens/mobile-settings-dark.png" width="180" alt="Cài đặt · đêm"/></a> | <a href="docs/screens/mobile-login-light.png"><img src="docs/screens/mobile-login-light.png" width="180" alt="Đăng nhập"/></a> | <a href="docs/screens/mobile-register-light.png"><img src="docs/screens/mobile-register-light.png" width="180" alt="Đăng ký"/></a> |

> Ảnh app được dựng bằng widget test với font thật và phản hồi API thật đã ghi lại từ backend seed (`mobile/test_shots/all_test.dart`, ghi API bằng `tools/record_api.mjs`). Ảnh chụp từ APK release trên emulator: [`emu-home-light.png`](docs/screens/emu-home-light.png).

### 🌐 Web · độc giả

| Trang chủ | Trang chủ · đêm | Khám phá |
|---|---|---|
| <a href="docs/screens/web-home-light.png"><img src="docs/screens/web-home-light.png" alt="Trang chủ"/></a> | <a href="docs/screens/web-home-dark.png"><img src="docs/screens/web-home-dark.png" alt="Trang chủ · đêm"/></a> | <a href="docs/screens/web-discover.png"><img src="docs/screens/web-discover.png" alt="Khám phá"/></a> |
| Bảng xếp hạng | Chi tiết truyện | Truyện · đêm |
| <a href="docs/screens/web-rankings.png"><img src="docs/screens/web-rankings.png" alt="Bảng xếp hạng"/></a> | <a href="docs/screens/web-story-light.png"><img src="docs/screens/web-story-light.png" alt="Chi tiết truyện"/></a> | <a href="docs/screens/web-story-dark.png"><img src="docs/screens/web-story-dark.png" alt="Truyện · đêm"/></a> |
| Trình đọc · sepia | Trình đọc · đêm | Bình luận đoạn |
| <a href="docs/screens/web-reader-sepia.png"><img src="docs/screens/web-reader-sepia.png" alt="Trình đọc · sepia"/></a> | <a href="docs/screens/web-reader-dark.png"><img src="docs/screens/web-reader-dark.png" alt="Trình đọc · đêm"/></a> | <a href="docs/screens/web-reader-comments.png"><img src="docs/screens/web-reader-comments.png" alt="Bình luận đoạn"/></a> |
| Chương khoá | Bảng tin | Thông báo |
| <a href="docs/screens/web-reader-locked.png"><img src="docs/screens/web-reader-locked.png" alt="Chương khoá"/></a> | <a href="docs/screens/web-feed.png"><img src="docs/screens/web-feed.png" alt="Bảng tin"/></a> | <a href="docs/screens/web-notifications.png"><img src="docs/screens/web-notifications.png" alt="Thông báo"/></a> |
| Tủ sách | Tủ sách · đêm | Ví xu |
| <a href="docs/screens/web-library-light.png"><img src="docs/screens/web-library-light.png" alt="Tủ sách"/></a> | <a href="docs/screens/web-library-dark.png"><img src="docs/screens/web-library-dark.png" alt="Tủ sách · đêm"/></a> | <a href="docs/screens/web-wallet.png"><img src="docs/screens/web-wallet.png" alt="Ví xu"/></a> |
| Trang tác giả | Hồ sơ độc giả | Đăng nhập |
| <a href="docs/screens/web-author-profile.png"><img src="docs/screens/web-author-profile.png" alt="Trang tác giả"/></a> | <a href="docs/screens/web-reader-profile.png"><img src="docs/screens/web-reader-profile.png" alt="Hồ sơ độc giả"/></a> | <a href="docs/screens/web-login.png"><img src="docs/screens/web-login.png" alt="Đăng nhập"/></a> |
| Đăng ký |   |   |
| <a href="docs/screens/web-register.png"><img src="docs/screens/web-register.png" alt="Đăng ký"/></a> |   |   |

**Web trên điện thoại (390×844)**

| Trang chủ | Truyện | Trình đọc | Chương khoá |
|---|---|---|---|
| <a href="docs/screens/webm-home.png"><img src="docs/screens/webm-home.png" width="180" alt="Trang chủ"/></a> | <a href="docs/screens/webm-story.png"><img src="docs/screens/webm-story.png" width="180" alt="Truyện"/></a> | <a href="docs/screens/webm-reader-sepia.png"><img src="docs/screens/webm-reader-sepia.png" width="180" alt="Trình đọc"/></a> | <a href="docs/screens/webm-locked.png"><img src="docs/screens/webm-locked.png" width="180" alt="Chương khoá"/></a> |
| Ví xu | Bảng tin | Tác giả | Trang chủ · đêm |
| <a href="docs/screens/webm-wallet.png"><img src="docs/screens/webm-wallet.png" width="180" alt="Ví xu"/></a> | <a href="docs/screens/webm-feed.png"><img src="docs/screens/webm-feed.png" width="180" alt="Bảng tin"/></a> | <a href="docs/screens/webm-author-profile.png"><img src="docs/screens/webm-author-profile.png" width="180" alt="Tác giả"/></a> | <a href="docs/screens/web-mobile-dark.png"><img src="docs/screens/web-mobile-dark.png" width="180" alt="Trang chủ · đêm"/></a> |

### ✍️ Author studio

| Truyện của tôi | Truyện của tôi · đêm | Sửa truyện & mục lục |
|---|---|---|
| <a href="docs/screens/web-studio-dashboard.png"><img src="docs/screens/web-studio-dashboard.png" alt="Truyện của tôi"/></a> | <a href="docs/screens/web-studio-dashboard-dark.png"><img src="docs/screens/web-studio-dashboard-dark.png" alt="Truyện của tôi · đêm"/></a> | <a href="docs/screens/web-studio-story.png"><img src="docs/screens/web-studio-story.png" alt="Sửa truyện & mục lục"/></a> |
| Trình soạn chương | Thống kê | Thu nhập |
| <a href="docs/screens/web-studio-editor.png"><img src="docs/screens/web-studio-editor.png" alt="Trình soạn chương"/></a> | <a href="docs/screens/web-studio-analytics.png"><img src="docs/screens/web-studio-analytics.png" alt="Thống kê"/></a> | <a href="docs/screens/web-studio-earnings.png"><img src="docs/screens/web-studio-earnings.png" alt="Thu nhập"/></a> |

### 🛡️ Admin

| Tổng quan · đêm | Tổng quan | Duyệt truyện |
|---|---|---|
| <a href="docs/screens/web-admin-dashboard-dark.png"><img src="docs/screens/web-admin-dashboard-dark.png" alt="Tổng quan · đêm"/></a> | <a href="docs/screens/web-admin-dashboard-light.png"><img src="docs/screens/web-admin-dashboard-light.png" alt="Tổng quan"/></a> | <a href="docs/screens/web-admin-stories.png"><img src="docs/screens/web-admin-stories.png" alt="Duyệt truyện"/></a> |
| Trang chủ & banner | Xếp hạng | Thể loại & thẻ |
| <a href="docs/screens/web-admin-homepage.png"><img src="docs/screens/web-admin-homepage.png" alt="Trang chủ & banner"/></a> | <a href="docs/screens/web-admin-xep-hang.png"><img src="docs/screens/web-admin-xep-hang.png" alt="Xếp hạng"/></a> | <a href="docs/screens/web-admin-the-loai.png"><img src="docs/screens/web-admin-the-loai.png" alt="Thể loại & thẻ"/></a> |
| Người dùng | Báo cáo | Chi trả |
| <a href="docs/screens/web-admin-nguoi-dung.png"><img src="docs/screens/web-admin-nguoi-dung.png" alt="Người dùng"/></a> | <a href="docs/screens/web-admin-bao-cao.png"><img src="docs/screens/web-admin-bao-cao.png" alt="Báo cáo"/></a> | <a href="docs/screens/web-admin-chi-tra.png"><img src="docs/screens/web-admin-chi-tra.png" alt="Chi trả"/></a> |
| Gói xu & khuyến mãi | Thông báo hệ thống | Nhật ký |
| <a href="docs/screens/web-admin-packages.png"><img src="docs/screens/web-admin-packages.png" alt="Gói xu & khuyến mãi"/></a> | <a href="docs/screens/web-admin-thong-bao.png"><img src="docs/screens/web-admin-thong-bao.png" alt="Thông báo hệ thống"/></a> | <a href="docs/screens/web-admin-audit.png"><img src="docs/screens/web-admin-audit.png" alt="Nhật ký"/></a> |

> Ảnh web chụp bằng Playwright (Chrome headless) từ web + backend chạy local: `node tools/shots.mjs`, `node tools/shots2.mjs`.

## ✨ Tính năng

**Độc giả**
- Trang chủ do biên tập viên sắp đặt: carousel banner có parallax và hẹn giờ, mục "Biên tập viên chọn", kệ chủ đề, truyện được ghim lên đầu.
- Khám phá theo thể loại/thẻ, bảng xếp hạng ngày/tuần/tháng, tìm kiếm tiếng Việt **không dấu** ("nguoi gac den" vẫn ra).
- Trình đọc có 3 nền (sáng / sepia / đêm), cỡ chữ, giãn dòng, hiệu ứng lật trang, bình luận theo đoạn, đọc to (TTS) trên app, lưu chương offline.
- Tủ sách, theo dõi, lịch sử đọc tiếp, thông báo chương mới.

**Kinh tế xu** (1 xu = 100đ)
- 3 cách mở chương: chờ miễn phí (vé 24h), **thuê 48 giờ** với giá 40%, hoặc mua vĩnh viễn. Mở khoá xong có hiệu ứng mưa xu.
- Ủng hộ tác giả. Tác giả nhận **70%** doanh thu chương và **90%** tiền ủng hộ, rút tiền từ 500 xu.
- Sổ cái kép có khoá nguyên tử, không bao giờ âm số dư.

**Tác giả (Studio)**
- Soạn chương với trình soạn thảo giàu định dạng, hẹn giờ đăng, đặt giá.
- Thống kê lượt đọc, tỉ lệ đọc hết, doanh thu theo ngày; yêu cầu chi trả.

**Quản trị (11 mục)**
- Tổng quan KPI và biểu đồ: người dùng, DAU, lượt xem, doanh thu, xu nạp/tiêu.
- Duyệt / ẩn / nổi bật / ghim truyện; tăng hạng (ranking override).
- Banner trang chủ có thứ tự và lịch chạy; mục tuyển chọn (spotlight/kệ/danh sách).
- Thể loại & thẻ (đổi tên, gộp, xoá); người dùng (khoá, vai trò, xác minh tác giả ✓).
- Hàng đợi báo cáo, duyệt chi trả, gói xu & khuyến mãi có hạn, phát thông báo theo nhóm, **nhật ký kiểm toán** ghi mọi thao tác.

**Chuyển động**: chuyển trang, nghiêng bìa 3D, các thẻ hiện dần, tim bùng nổ khi thích, skeleton lấp lánh, đổi theme bằng vòng mực loang. Tất cả tôn trọng `prefers-reduced-motion` (web) và *Giảm chuyển động* (Android).

## 🏗️ Kiến trúc

```mermaid
flowchart LR
  subgraph Clients
    W[Web · Next.js 15<br/>App Router · Tailwind v4 · framer-motion]
    M[App · Flutter<br/>Android]
  end
  subgraph API[Backend · NestJS]
    A[Auth · JWT + vai trò]
    S[Truyện · Chương · Bình luận]
    D[Khám phá · Xếp hạng · Tìm kiếm]
    L[Ví xu · Sổ cái · Chi trả]
    AD[Quản trị · Kiểm toán]
  end
  DB[(PostgreSQL 17<br/>Prisma · unaccent)]
  W -- /api --> API
  M -- /api --> API
  API --> DB
```

```
muc-truyen/
├── backend/   NestJS + Prisma (schema, migrations, seed, unit + e2e tests)
├── web/       Next.js 15 (độc giả, studio, quản trị)
├── mobile/    Flutter (app đọc truyện Android)
├── docs/      logo, ảnh chụp
└── docker-compose.yml
```

## 🚀 Chạy thử

### Cách nhanh: Docker Compose

```bash
git clone https://github.com/gooduselabs/muc-truyen && cd muc-truyen
docker compose up --build
# Web: http://localhost:3000   ·   API: http://localhost:4000/api
```

Lần chạy đầu API sẽ tự migrate và nạp dữ liệu mẫu.

### Chạy từng phần (dev)

```bash
# 1) Postgres
docker run -d --name muc-db -e POSTGRES_USER=story -e POSTGRES_PASSWORD=story -e POSTGRES_DB=story -p 5432:5432 postgres:17-alpine

# 2) Backend
cd backend && cp .env.example .env && npm i
npx prisma migrate deploy && npx ts-node prisma/seed.ts
npm run build && npm start          # :4000

# 3) Web
cd ../web && npm i
NEXT_PUBLIC_API_URL=http://localhost:4000 npm run dev   # :3000

# 4) App
cd ../mobile && flutter pub get && flutter run          # emulator gọi 10.0.2.2:4000
```

Hoặc cài APK trong [Releases](https://github.com/gooduselabs/muc-truyen/releases) và đổi địa chỉ máy chủ ở *Tài khoản → Máy chủ*.

### Tài khoản mẫu (mật khẩu `muc12345`)

| Email | Vai trò |
|---|---|
| `admin@muc.vn` | Quản trị viên |
| `linhan@muc.vn`, `quanghuy@muc.vn`, `thaonguyen@muc.vn` | Tác giả (đã xác minh) |
| `docgia@muc.vn` | Độc giả (có sẵn xu) |

### Kiểm thử

```bash
cd backend && npm test && npm run test:e2e     # 6 unit + 16 e2e
cd web && npm run build
cd mobile && flutter analyze && flutter test    # 6 widget/unit tests
```

## 🗺️ Lộ trình

- [x] v0.1: đọc/viết, xu & thuê chương, studio, quản trị đầy đủ, app Android
- [ ] Cổng thanh toán thật (MoMo, VNPay, ZaloPay) và đối soát
- [ ] Meilisearch cho tìm kiếm mờ và gợi ý
- [ ] Bản iOS và In-App Purchase theo chính sách cửa hàng
- [ ] Thông báo đẩy (FCM), đồng bộ offline hai chiều
- [ ] Kiểm duyệt nội dung bán tự động, chống sao chép
- [ ] Lưu ảnh bìa lên S3/R2 và CDN

## ⚠️ Giới hạn hiện tại

Đây là bản **thử nghiệm (pre-release)**:

- **Thanh toán chỉ ở chế độ sandbox.** Nạp xu được cộng ngay, chưa kết nối MoMo/VNPay thật và chưa kiểm thử với các cổng này.
- Mua xu trên app di động sẽ phải tuân theo quy định In-App Purchase của Google/Apple. Bản này chưa xử lý phần đó.
- Tìm kiếm dùng `unaccent` + `ILIKE` của Postgres. Meilisearch **chưa** được triển khai.
- Chỉ build và thử Android. **iOS chưa được build.**
- `docker-compose.yml` đã được viết nhưng **chưa chạy thử** trong môi trường phát triển (không có Docker). Backend, web và app đã được kiểm thử chạy trực tiếp.
- APK release đã cài và mở được trên emulator Android 14 không có tăng tốc phần cứng. Emulator chậm nên trong ảnh chụp có hộp thoại "System UI isn't responding" của hệ thống, không phải lỗi app.
- Ảnh bìa là bìa vải vẽ bằng code, chưa hỗ trợ tải ảnh bìa riêng.
- APK chưa ký bằng khoá phát hành riêng (đang dùng debug signing).

## 📄 Giấy phép

[MIT](LICENSE) © 2026 gooduselabs
