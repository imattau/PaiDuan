import { createContext, useContext, useState } from 'react';

type VideoMeta = { eventId: string; pubkey: string; caption: string; posterUrl?: string };

const Ctx = createContext<{ current: VideoMeta | null; setCurrent: (v: VideoMeta | null) => void } | null>(null);

export function CurrentVideoProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<VideoMeta | null>(null);
  return <Ctx.Provider value={{ current, setCurrent }}>{children}</Ctx.Provider>;
}

export function useCurrentVideo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrentVideo outside provider');
  return ctx;
}
