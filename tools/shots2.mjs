// Extra web screenshots (screens not covered by shots.mjs).
import { chromium } from 'playwright-core';
const API = 'http://localhost:4000/api', WEB = 'http://localhost:3000', OUT = process.argv[2] || '/tmp/ws';
const login = async (email) => (await (await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'muc12345' }) })).json()).token;
const tokens = { reader: await login('docgia@muc.vn'), author: await login('linhan@muc.vn'), admin: await login('admin@muc.vn') };
const studio = await (await fetch(`${API}/studio/stories`, { headers: { authorization: `Bearer ${tokens.author}` } })).json();
const lh = studio.find((s) => s.slug === 'nguoi-gac-den-o-cu-lao-may');
const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
async function shot(name, path, { who, theme = 'light', reader, full = false, h = 1000, w = 1440, dsf = 1, before } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, locale: 'vi-VN', colorScheme: theme, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.addInitScript(([t, th, r]) => {
    localStorage.setItem('muc_theme', th);
    if (t) localStorage.setItem('muc_token', t); else localStorage.removeItem('muc_token');
    if (r) localStorage.setItem('muc_reader', JSON.stringify(r));
  }, [who ? tokens[who] : null, theme, reader || null]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', name, e.message));
  await page.goto(WEB + path, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(1500);
  if (full) { for (let y = 0; y < 8000; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(100); } await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1200); }
  if (before) { await before(page); await page.waitForTimeout(1000); }
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log('✓', name);
  await ctx.close();
}
const slug = 'nguoi-gac-den-o-cu-lao-may';
const M = { w: 390, h: 844, dsf: 3 };
const list = [
  ['web-discover', '/kham-pha', { who: 'reader', h: 1100 }],
  ['web-rankings', '/bang-xep-hang', { who: 'reader', h: 1100 }],
  ['web-feed', '/bang-tin', { who: 'reader', h: 1100 }],
  ['web-notifications', '/thong-bao', { who: 'reader' }],
  ['web-library-light', '/tu-sach', { who: 'reader' }],
  ['web-author-profile', '/u/linhan', { who: 'reader', h: 1100 }],
  ['web-reader-profile', '/u/minhthu', { who: 'reader' }],
  ['web-login', '/dang-nhap', {}],
  ['web-register', '/dang-ky', {}],
  ['web-reader-comments', `/truyen/${slug}/1`, { who: 'reader', reader: { theme: 'light' }, before: async (p) => { await p.locator('[data-p] button').nth(1).click({ force: true }).catch(() => {}); } }],
  ['web-studio-dashboard', '/studio', { who: 'author' }],
  ['web-studio-story', `/studio/truyen/${lh.id}`, { who: 'author', h: 1100 }],
  ['web-studio-earnings', '/studio/thu-nhap', { who: 'author' }],
  ['web-studio-dashboard-dark', '/studio', { who: 'author', theme: 'dark' }],
  ...['xep-hang', 'the-loai', 'nguoi-dung', 'bao-cao', 'chi-tra', 'thong-bao'].map((s) => [`web-admin-${s}`, `/admin#${s}`, { who: 'admin' }]),
  ['webm-home', '/', { who: 'reader', ...M }],
  ['webm-story', `/truyen/${slug}`, { who: 'reader', ...M }],
  ['webm-reader-sepia', `/truyen/${slug}/1`, { who: 'reader', reader: { theme: 'sepia' }, ...M }],
  ['webm-locked', `/truyen/kiem-khach-pho-hang-bac/3`, { who: 'reader', reader: { theme: 'light' }, ...M, before: (p) => p.mouse.wheel(0, 900) }],
  ['webm-wallet', '/vi', { who: 'reader', ...M }],
  ['webm-feed', '/bang-tin', { who: 'reader', ...M }],
  ['webm-author-profile', '/u/linhan', { who: 'reader', ...M }],
];
const only = process.argv[3]?.split(',');
for (const [n, p, o] of list) if (!only || only.includes(n)) await shot(n, p, o).catch((e) => console.log('✗', n, e.message));
await browser.close();
