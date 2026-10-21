/** Economy constants — single source of truth (also exposed via GET /wallet/config). */
export const COIN_VND = 100; // 1 xu = 100đ
export const RENTAL_HOURS = 48;
export const RENTAL_RATIO = 0.4; // thuê 48h = 40% giá mua
export const AUTHOR_SHARE = 0.7; // tác giả nhận 70% doanh thu chương
export const TIP_SHARE = 0.9; // tác giả nhận 90% tiền ủng hộ
export const MIN_PAYOUT = 500; // xu thu nhập tối thiểu để rút
export const PACKAGES = [
  { id: 'p50', coins: 50, bonus: 0, vnd: 5_000 },
  { id: 'p120', coins: 100, bonus: 20, vnd: 10_000 },
  { id: 'p300', coins: 250, bonus: 50, vnd: 25_000 },
  { id: 'p650', coins: 500, bonus: 150, vnd: 50_000 },
];
export const rentalPrice = (price: number) => (price <= 0 ? 0 : Math.max(1, Math.ceil(price * RENTAL_RATIO)));
export const authorCut = (amount: number, share = AUTHOR_SHARE) => Math.floor(amount * share);
