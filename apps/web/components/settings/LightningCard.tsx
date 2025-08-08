import React, { useEffect, useState } from 'react';
import type { EventTemplate } from 'nostr-tools/pure';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getPool, getRelays } from '@/lib/nostr';
import { Card } from '../ui/Card';

export function LightningCard() {
  const { state } = useAuth();
  const meta = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const [addr, setAddr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (meta?.lud16) setAddr(meta.lud16);
  }, [meta]);

  async function save() {
    if (state.status !== 'ready') return;
    try {
      setSaving(true);
      const content = JSON.stringify({ ...(meta || {}), lud16: addr });
      const tmpl: EventTemplate = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content,
      };
      const signed = await state.signer.signEvent({ ...tmpl });
      const pool = getPool();
      await pool.publish(getRelays(), signed as any);
      setSaving(false);
    } catch (e: any) {
      alert(e.message || 'Failed to save');
      setSaving(false);
    }
  }

  return (
    <Card title="Lightning Address" desc="Set your default lightning address.">
      <div className="space-y-3">
        <input
          type="text"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="name@example.com"
          className="w-full rounded bg-foreground/10 p-2 text-sm outline-none"
        />
        <button
          type="button"
          onClick={save}
          className="btn btn-secondary"
          disabled={saving || state.status !== 'ready'}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Card>
  );
}

export default LightningCard;

