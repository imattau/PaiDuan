'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export interface ModqueueItem {
  targetKind: string;
  targetId: string;
  reporterPubKey: string;
}

const Ctx = createContext<ModqueueItem[]>([]);

export function ModqueueProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ModqueueItem[]>([]);

  const load = () => {
    fetch('/api/modqueue')
      .then((r) => r.json())
      .then((d: ModqueueItem[]) => setData(d))
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
    const listener = () => load();
    window.addEventListener('modqueue', listener);
    return () => window.removeEventListener('modqueue', listener);
  }, []);

  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export function useModqueue() {
  return useContext(Ctx);
}

