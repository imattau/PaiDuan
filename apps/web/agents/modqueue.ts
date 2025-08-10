import type { EventTemplate } from 'nostr-tools/pure';
import type { Signer } from '@/lib/signers/types';
import pool from '@/lib/relayPool';
import { getRelays } from '@/lib/nostr';

export interface ReportPayload {
  targetId: string;
  targetKind: 'video' | 'comment';
  reason: string;
  reporterPubKey: string;
  ts: number;
  details?: string;
  signer: Signer;
}

export async function submitReport(report: ReportPayload): Promise<void> {
  const { signer, ...rest } = report;
  const event: EventTemplate & { pubkey: string } = {
    kind: 30041,
    created_at: rest.ts,
    content: JSON.stringify(rest),
    pubkey: rest.reporterPubKey,
  };

  const signed = await signer.signEvent(event);
  const relays = getRelays();
  await pool.publish(relays, signed);
  await fetch('/api/modqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rest),
  });
  window.dispatchEvent(new Event('modqueue'));
}

export const modqueue = { submitReport };
export default modqueue;
