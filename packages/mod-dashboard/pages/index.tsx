import { useEffect, useState } from 'react';
import type { GetServerSideProps } from 'next';
import { SimplePool } from 'nostr-tools';

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
    const pool: any = new SimplePool();
    await pool.publish(['wss://relay.damus.io', 'wss://nos.lol'], signed);
    await approve(id);
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">Moderation Queue</h1>
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.targetId} className="rounded border p-2">
            <div className="text-sm">{r.targetKind}: {r.targetId}</div>
            <div className="text-sm">Reason: {r.reason}</div>
            <div className="mt-2 space-x-2">
              <button className="rounded bg-green-500 px-2 py-1 text-white" onClick={() => approve(r.targetId)}>
                Approve
              </button>
              <button className="rounded bg-red-500 px-2 py-1 text-white" onClick={() => remove(r.targetId)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
