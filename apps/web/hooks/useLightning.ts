import { SimplePool } from 'nostr-tools/pool';
import type { Filter } from 'nostr-tools/filter';
import { useAuth } from './useAuth';

interface ZapArgs {
  lightningAddress: string;
  amount: number;
  comment?: string;
  eventId?: string;
  pubkey?: string;
}

interface Split {
  lnaddr: string;
  pct: number;
}

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

export default function useLightning() {
  const pool = new SimplePool();
  const { state } = useAuth();

  const payLn = async (lnaddr: string, sats: number, comment?: string) => {
    const [name, domain] = lnaddr.split('@');
    const payRes = await fetch(`https://${domain}/.well-known/lnurlp/${name}`);
    const payData = await payRes.json();
    const callback: string = payData.callback;
    const invoiceRes = await fetch(`${callback}?amount=${sats * 1000}&comment=${encodeURIComponent(comment ?? '')}`);
    const invoiceData = await invoiceRes.json();
    const invoice: string = invoiceData.pr;
    if (typeof window !== 'undefined') {
      window.open(`lightning:${invoice}`);
    }
    return { invoice, result: invoiceData };
  };

  const createZap = async ({ lightningAddress, amount, comment, eventId, pubkey }: ZapArgs) => {
    let splits: Split[] = [];
    if (pubkey) {
      try {
        const ev = await pool.get(relayList(), {
          kinds: [0],
          authors: [pubkey],
          limit: 1,
        } as Filter);
        if (ev) {
          const content = JSON.parse(ev.content);
          if (Array.isArray(content.zapSplits)) {
            splits = content.zapSplits.filter(
              (s: any) => typeof s.lnaddr === 'string' && typeof s.pct === 'number',
            );
          }
        }
      } catch {
        /* ignore */
      }
    }

    const collaboratorTotal = splits.reduce((sum, s) => sum + s.pct, 0);
    const creatorPct = 95 - collaboratorTotal;
    const payouts: { lnaddr: string; pct: number; sats: number }[] = [];
    for (const s of splits) {
      payouts.push({ lnaddr: s.lnaddr, pct: s.pct, sats: Math.floor((amount * s.pct) / 100) });
    }
    payouts.push({ lnaddr: lightningAddress, pct: creatorPct, sats: Math.floor((amount * creatorPct) / 100) });
    const treasury = process.env.NEXT_PUBLIC_TREASURY_LNADDR;
    if (treasury) {
      payouts.push({ lnaddr: treasury, pct: 5, sats: Math.floor((amount * 5) / 100) });
    }

    const results: { lnaddr: string; pct: number; sats: number; invoice: string }[] = [];
    for (const p of payouts) {
      if (p.sats <= 0) continue;
      const res = await payLn(p.lnaddr, p.sats, comment);
      results.push({ ...p, invoice: res.invoice });
    }

    if (pubkey && state.status === 'ready') {
      try {
        const event: any = {
          kind: 9736,
          created_at: Math.floor(Date.now() / 1000),
          tags: [],
          content: JSON.stringify({
            noteId: eventId,
            splits: results.map((p) => ({ lnaddr: p.lnaddr, pct: p.pct, sats: p.sats })),
          }),
          pubkey: state.pubkey,
        };
        const signed = await state.signer.signEvent(event);
        pool.publish(relayList(), signed);
      } catch (err: any) {
        alert(err.message || 'Sign-in required');
      }
    }

    return { invoices: results.map((r) => r.invoice) };
  };

  return { createZap };
}
