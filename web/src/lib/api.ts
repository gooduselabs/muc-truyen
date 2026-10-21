export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SERVER_URL = process.env.API_INTERNAL_URL || API_URL;

export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('muc_token');
}

export async function api<T = any>(path: string, opts: { method?: string; body?: any; token?: string | null; form?: FormData } = {}): Promise<T> {
  const isServer = typeof window === 'undefined';
  const token = opts.token !== undefined ? opts.token : getToken();
  const res = await fetch(`${isServer ? SERVER_URL : API_URL}/api${path}`, {
    method: opts.method || (opts.body || opts.form ? 'POST' : 'GET'),
    headers: { ...(opts.form ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: opts.form || (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    cache: 'no-store',
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, (Array.isArray(data?.message) ? data.message[0] : data?.message) || 'Có lỗi xảy ra');
  return data as T;
}

/** Server-side fetch that never throws (returns null), so pages render even when the API is down. */
export async function sget<T = any>(path: string): Promise<T | null> {
  try { return await api<T>(path, { token: null }); } catch { return null; }
}
