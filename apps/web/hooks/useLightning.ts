import { SimplePool } from 'nostr-tools/pool';
import type { Filter } from 'nostr-tools/filter';
import { useAuth } from './useAuth';
import { getRelays } from '../lib/nostr';
import { fetchPayData, requestInvoice } from '../utils/lnurl';

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

export default function useLightning() {
  const pool = new SimplePool();
  const { state } = useAuth();

  const payLn = async (lnaddr: string, sats: number, comment?: string) => {
    const payData = await fetchPayData(lnaddr);
    return requestInvoice(payData, sats, comment);
  };

  const createZap = async ({ lightningAddress, amount, comment, eventId, pubkey }: ZapArgs) => {
    let splits: Split[] = [];
    if (pubkey) {
      try {
        const ev = await pool.get(getRelays(), {
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
        pool.publish(getRelays(), signed);
      } catch (err: any) {
        alert(err.message || 'Sign-in required');
      }
    }

    return { invoices: results.map((r) => r.invoice) };
  };

  return { createZap };
}
