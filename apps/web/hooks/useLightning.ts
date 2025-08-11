import pool from '@/lib/relayPool';
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
  splits?: Split[];
}

interface Split {
  lnaddr: string;
  pct: number;
}

export default function useLightning() {
  const { state } = useAuth();

  const payLn = async (lnaddr: string, sats: number, comment?: string) => {
    const payData = await fetchPayData(lnaddr);
    const res = await requestInvoice(payData, sats, comment);
    if (typeof window !== 'undefined') {
      try {
        if (window.webln) {
          await window.webln.sendPayment(res.invoice);
        } else {
          window.open(`lightning:${res.invoice}`);
        }
      } catch {
        /* ignore */
      }
    }
    return res;
  };

  const createZap = async ({
    lightningAddress,
    amount,
    comment,
    eventId,
    pubkey,
    splits: argSplits = [],
  }: ZapArgs) => {
    let splits: Split[] = argSplits;
    let hostPct: number | null = null;
    let coSplits: Split[] = splits;

    if (splits.length === 0 && eventId) {
      try {
        const ev = await pool.get(getRelays(), { ids: [eventId], limit: 1 } as Filter);
        if (ev && Array.isArray(ev.tags)) {
          const parsed = ev.tags
            .filter((t: any[]) => t[0] === 'zap' && t[1] && t[2])
            .map((t: any[]) => ({ lnaddr: t[1], pct: Number(t[2]) }))
            .filter((s: Split) => s.lnaddr && !isNaN(s.pct));
          const host = parsed.find((s) => s.lnaddr === lightningAddress);
          if (host) hostPct = host.pct;
          coSplits = parsed.filter((s) => s.lnaddr !== lightningAddress);
        }
      } catch {
        /* ignore */
      }
    }

    if (coSplits.length === 0 && splits.length === 0 && pubkey) {
      try {
        const ev = await pool.get(getRelays(), {
          kinds: [0],
          authors: [pubkey],
          limit: 1,
        } as Filter);
        if (ev) {
          const content = JSON.parse(ev.content);
          if (Array.isArray(content.zapSplits)) {
            coSplits = content.zapSplits.filter(
              (s: any) => typeof s.lnaddr === 'string' && typeof s.pct === 'number',
            );
          }
        }
      } catch {
        /* ignore */
      }
    }

    if (hostPct === null) {
      const collaboratorTotal = coSplits.reduce((sum, s) => sum + s.pct, 0);
      if (collaboratorTotal > 95) throw new Error('Collaborator percentage exceeds 95%');
      hostPct = 95 - collaboratorTotal;
    }

    const payouts: { lnaddr: string; pct: number; sats: number }[] = [];
    for (const s of coSplits) {
      payouts.push({ lnaddr: s.lnaddr, pct: s.pct, sats: Math.floor((amount * s.pct) / 100) });
    }
    if (hostPct > 0) {
      payouts.push({
        lnaddr: lightningAddress,
        pct: hostPct,
        sats: Math.floor((amount * hostPct) / 100),
      });
    }
    const treasury = hostPct !== null && hostPct !== 100 ? process.env.NEXT_PUBLIC_TREASURY_LNADDR : undefined;
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
          tags: coSplits.map((s) => ['zap_split', s.lnaddr, s.pct.toString()]),
          content: JSON.stringify({
            noteId: eventId,
            splits: results
              .filter((p) => !treasury || p.lnaddr !== treasury)
              .map((p) => ({ lnaddr: p.lnaddr, pct: p.pct, sats: p.sats })),
          }),
          pubkey: state.pubkey,
        };
        const signed = await state.signer.signEvent(event);
        pool.publish(getRelays(), signed);
      } catch (err: any) {
        const w = typeof window !== 'undefined' ? window : undefined;
        if (w && typeof w.alert === 'function') {
          w.alert(err.message || 'Sign-in required');
        }
      }
    }

    return { invoices: results.map((r) => r.invoice) };
  };

  return { createZap };
}
