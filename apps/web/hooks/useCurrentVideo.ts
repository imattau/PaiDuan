import { createContext, useContext, useState } from 'react';

type VM = { eventId: string; pubkey: string; caption: string; posterUrl?: string };
const Ctx = createContext<{ current: VM | null; setCurrent: (v: VM | null) => void } | null>(null);

export function CurrentVideoProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<VM | null>(null);
  return <Ctx.Provider value={{ current, setCurrent }}>{children}</Ctx.Provider>;
}
export const useCurrentVideo = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrentVideo outside provider');
  return ctx;
};
