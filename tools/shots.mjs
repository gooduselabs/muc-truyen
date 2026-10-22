import { chromium } from 'playwright-core';
const API = 'http://localhost:4000/api', WEB = 'http://localhost:3000', OUT = process.argv[2] || '/workspace/story/screens';
const login = async (email) => (await (await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'muc12345' }) })).json()).token;
const tokens = { reader: await login('docgia@muc.vn'), author: await login('linhan@muc.vn'), admin: await login('admin@muc.vn') };
const studio = await (await fetch(`${API}/studio/stories`, { headers: { authorization: `Bearer ${tokens.author}` } })).json();
const lighthouse = studio.find((s) => s.slug === 'nguoi-gac-den-o-cu-lao-may');
const detail = await (await fetch(`${API}/studio/stories/${lighthouse.id}`, { headers: { authorization: `Bearer ${tokens.author}` } })).json();
const ch3 = detail.chapters.find((c) => c.number === 3);

const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
async function shot(name, path, { who, theme = 'light', reader, full = false, h = 1000, w = 1440, before } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, locale: 'vi-VN', colorScheme: theme === 'dark' ? 'dark' : 'light' });
  await ctx.addInitScript(([t, th, r]) => {
    localStorage.setItem('muc_theme', th);
    if (t) localStorage.setItem('muc_token', t); else localStorage.removeItem('muc_token');
    if (r) localStorage.setItem('muc_reader', JSON.stringify(r));
  }, [who ? tokens[who] : null, theme, reader || null]);
  const page = await ctx.newPage();
  await page.goto(WEB + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  if (before) { await before(page); await page.waitForTimeout(900); }
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log('✓', name);
  await ctx.close();
}
const slug = 'nguoi-gac-den-o-cu-lao-may';
await shot('web-home-light', '/', { who: 'reader', full: true });
await shot('web-home-dark', '/', { who: 'reader', theme: 'dark', h: 1000 });
await shot('web-story-light', `/truyen/${slug}`, { who: 'reader', h: 1100 });
await shot('web-story-dark', `/truyen/${slug}`, { who: 'reader', theme: 'dark', h: 1100 });
await shot('web-reader-sepia', `/truyen/${slug}/1`, { who: 'reader', reader: { theme: 'sepia' }, before: (p) => p.mouse.wheel(0, 300) });
await shot('web-reader-dark', `/truyen/${slug}/2`, { who: 'reader', theme: 'dark', reader: { theme: 'dark' } });
await shot('web-reader-comments', `/truyen/${slug}/1`, { who: 'reader', reader: { theme: 'light' }, before: async (p) => { await p.locator('[data-p] button').nth(3).click({ force: true }); } });
await shot('web-reader-locked', `/truyen/kiem-khach-pho-hang-bac/3`, { who: 'reader', reader: { theme: 'light' }, before: (p) => p.mouse.wheel(0, 500) });
await shot('web-rankings', '/bang-xep-hang', { who: 'reader', h: 1150 });
await shot('web-wallet', '/vi', { who: 'reader' });
await shot('web-studio-editor', `/studio/chuong/${ch3.id}`, { who: 'author' });
await shot('web-studio-editor-dark', `/studio/chuong/${ch3.id}`, { who: 'author', theme: 'dark' });
await shot('web-studio-analytics', '/studio/thong-ke', { who: 'author', full: true });
await shot('web-studio-earnings', '/studio/thu-nhap', { who: 'author' });
await shot('web-admin', '/admin', { who: 'admin' });
await shot('web-login', '/dang-nhap', {});
await shot('web-mobile-reader', `/truyen/${slug}/1`, { who: 'reader', w: 390, h: 844, reader: { theme: 'sepia' } });
await browser.close();
