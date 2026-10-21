'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

export interface Me { id: string; username: string; name: string; email: string; role: 'READER' | 'AUTHOR' | 'ADMIN'; coins: number; earnings: number; avatarUrl?: string | null; bio: string }
interface Ctx { me: Me | null; ready: boolean; login: (token: string, me: Me) => void; logout: () => void; refresh: () => Promise<void> }
const AuthCtx = createContext<Ctx>({ me: null, ready: false, login: () => {}, logout: () => {}, refresh: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const refresh = useCallback(async () => {
    if (!localStorage.getItem('muc_token')) { setMe(null); setReady(true); return; }
    try { const r = await api('/auth/me'); setMe(r.user); } catch { localStorage.removeItem('muc_token'); setMe(null); }
    setReady(true);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const login = (token: string, u: Me) => { localStorage.setItem('muc_token', token); setMe(u); };
  const logout = () => { localStorage.removeItem('muc_token'); setMe(null); };
  return <AuthCtx.Provider value={{ me, ready, login, logout, refresh }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

/** Tiny data hook: refetches when key changes, exposes reload + local mutate. */
export function useApi<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try { setData(await api<T>(path)); setError(null); } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load, setData };
}
