import { useEffect, useRef, useState } from 'react';
import { SimplePool, Event as NostrEvent, Filter } from 'nostr-tools';

function relayList(): string[] {
  if (typeof window === 'undefined') return ['wss://relay.damus.io', 'wss://nos.lol'];
  const nostr = (window as any).nostr;
  if (nostr?.getRelays) {
    try {
      const relays = nostr.getRelays();
      if (Array.isArray(relays)) return relays;
      if (relays && typeof relays === 'object') return Object.keys(relays);
    } catch {
      /* ignore */
    }
  }
  return ['wss://relay.damus.io', 'wss://nos.lol'];
}

export default function TreasuryPage() {
  const [authorised, setAuthorised] = useState(false);
  const [total, setTotal] = useState(0);
  const poolRef = useRef<SimplePool>();

  useEffect(() => {
    let sub: { close: () => void } | undefined;
    const init = async () => {
      const admin = process.env.NEXT_PUBLIC_ADMIN_PUBKEY;
      const treasury = process.env.NEXT_PUBLIC_TREASURY_LNADDR;
      if (!admin || !treasury) return;
      const nostr = (window as any).nostr;
      if (!nostr?.getPublicKey) return;
      const pk = await nostr.getPublicKey();
      if (pk !== admin) return;
      setAuthorised(true);
      const pool = (poolRef.current ||= new SimplePool());
      const since = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
      sub = pool.subscribeMany(relayList(), [{ kinds: [9736], since } as Filter], {
        onevent: (ev: NostrEvent) => {
          try {
            const content = JSON.parse(ev.content);
            const split = (content.splits || []).find((s: any) => s.lnaddr === treasury);
            if (split?.sats) {
              setTotal((t) => t + Number(split.sats));
            }
          } catch {
            /* ignore */
          }
        },
      });
    };
    init();
    return () => {
      sub?.close();
    };
  }, []);

  if (!authorised) {
    return <div className="p-4">Access denied</div>;
  }

  return <div className="p-4">Today&apos;s total: {total} sats</div>;
}
