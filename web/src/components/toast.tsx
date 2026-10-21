'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type T = { id: number; text: string; error?: boolean };
const Ctx = createContext<(text: string, error?: boolean) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<T[]>([]);
  const push = useCallback((text: string, error = false) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, text, error }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        {items.map((t) => (
          <div key={t.id} className="fade-up flex items-center gap-2 rounded-full bg-fg px-5 py-3 text-sm font-medium text-bg shadow-2xl">
            {t.error ? <AlertCircle className="size-4 text-red-400" /> : <CheckCircle2 className="size-4 text-emerald-400" />}{t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
