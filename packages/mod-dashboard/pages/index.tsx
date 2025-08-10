"use client";

import { useEffect, useState } from 'react';
import type { GetServerSideProps } from 'next';
import { SimplePool } from 'nostr-tools/pool';

const pool = new SimplePool();

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
];

function getRelays(): string[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('pd.relays');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_RELAYS;
}


const ADMIN_PUBKEYS = (process.env.ADMIN_PUBKEYS || '').split(',').filter(Boolean);

interface Report {
  targetId: string;
  targetKind: 'video' | 'comment';
  reason: string;
  reporterPubKey: string;
  ts: number;
}

interface Props {
  allowed: boolean;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const cookie = (req as any).cookies?.ADMIN_PUBKEY;
  const allowed = cookie && ADMIN_PUBKEYS.includes(cookie);
  return { props: { allowed: !!allowed } };
};

export default function Dashboard({ allowed }: Props) {
  const [reports, setReports] = useState<Report[]>([]);

  const load = () => {
    fetch('/api/modqueue')
      .then((r) => r.json())
      .then(setReports);
  };

  useEffect(() => {
    if (allowed) load();
  }, [allowed]);

  if (!allowed) return <div>Forbidden</div>;

  const approve = async (id: string) => {
    await fetch('/api/modqueue', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId: id }),
    });
    load();
  };

  const remove = async (id: string) => {
    const nostr = (window as any).nostr;
    if (!nostr) return;
    const moderator = await nostr.getPublicKey();
    const ts = Math.floor(Date.now() / 1000);
    const hide = { targetId: id, moderator, reason: 'removed', ts };
    const event = { kind: 9001, created_at: ts, content: JSON.stringify(hide) };
    const signed = await nostr.signEvent(event);
    const relays = getRelays();
    try {
      await pool.publish(relays, signed);
      await approve(id);
    } catch (err) {
      console.error('Failed to publish removal', err);
      alert('Failed to publish removal');
    } finally {
      pool.close(relays);
    }
  };

  return (
    <div className="p-4 text-primary">
      <h1 className="mb-4 text-xl font-bold">Moderation Queue</h1>
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.targetId} className="rounded border divider p-2">
            <div className="text-sm">{r.targetKind}: {r.targetId}</div>
            <div className="text-sm">Reason: {r.reason}</div>
            <div className="mt-2 space-x-2">
              <button
                className="rounded bg-accent-primary px-2 py-1 text-primary hover:bg-accent-hover active:bg-accent-active"
                onClick={() => approve(r.targetId)}
              >
                Approve
              </button>
              <button
                className="rounded bg-destructive px-2 py-1 text-primary hover:bg-destructive-hover active:bg-destructive-active"
                onClick={() => remove(r.targetId)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
