// Records live API responses (as demo reader docgia@muc.vn) into mobile/test_shots/api for the Flutter screenshot tests.
import fs from 'fs';
const API = 'http://localhost:4000', DIR = process.argv[2] || '/workspace/story/repo/mobile/test_shots/api';
const lines = fs.readFileSync(process.argv[3] || '/workspace/story/repo/mobile/test_shots/missing.txt', 'utf8').split('\n').filter(Boolean);
const tok = (await (await fetch(`${API}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'docgia@muc.vn', password: 'muc12345' }) })).json()).token;
for (const l of new Set(lines)) {
  const [, path] = l.split(' ');
  const u = new URL(API + path);
  let k = u.pathname.replace('/api', ''); if (u.search.length > 1) k += '?' + u.search.slice(1);
  k = k.replace(/[^A-Za-z0-9._-]+/g, '_');
  const r = await fetch(API + path, { headers: { authorization: `Bearer ${tok}` } });
  const body = await r.text(); let j; try { j = JSON.parse(body); if (j && j.token) delete j.token; } catch {} fs.writeFileSync(`${DIR}/${k}.json`, j ? JSON.stringify(j) : body);
  console.log(r.status, k);
}
