import { useEffect, useState } from 'react';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import pool from './pool';
import { getRelays } from '@/lib/nostr';

export interface ZapEvent {
  id: string;
  from: string;
  amount: number;
  created_at: number;
}

interface ZapHistory {
  events: ZapEvent[];
  totalAmount: number;
  totalCount: number;
}

export default function useZapHistory(): ZapHistory {
  const [events, setEvents] = useState<ZapEvent[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nostr = (window as any).nostr;
    if (!nostr) return;
    let sub: { close: () => void } | null = null;

    (async () => {
      try {
        const pubkey = await nostr.getPublicKey();
        const relays = getRelays();
        sub = pool.subscribeMany(relays, [{ kinds: [9735], '#p': [pubkey] }], {
          onevent: (ev: NostrEvent) => {
            const amt = ev.tags.find((t) => t[0] === 'amount');
            const amount = amt ? Math.round(parseInt(amt[1] || '0', 10) / 1000) : 0;
            setEvents((prev) => {
              if (prev.find((p) => p.id === ev.id)) return prev;
              const next = [
                {
                  id: ev.id,
                  from: ev.pubkey,
                  amount,
                  created_at: ev.created_at,
                },
                ...prev,
              ]
                .sort((a, b) => b.created_at - a.created_at)
                .slice(0, 50);
              return next;
            });
          },
        });
      } catch {
        /* ignore */
      }
    })();

    return () => {
      sub?.close();
    };
  }, []);

  const totalAmount = events.reduce((sum, e) => sum + e.amount, 0);
  const totalCount = events.length;

  return { events, totalAmount, totalCount };
}

export { useZapHistory };
