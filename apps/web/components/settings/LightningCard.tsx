import React, { useEffect, useState } from 'react';
import type { EventTemplate } from 'nostr-tools/pure';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getPool, getRelays } from '@/lib/nostr';
import { fetchPayData } from '@/utils/lnurl';
import { Card } from '../ui/Card';

interface Wallet {
  label: string;
  lnaddr: string;
  default?: boolean;
}

export function LightningCard() {
  const { state } = useAuth();
  const meta = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Array.isArray(meta?.wallets)) setWallets(meta.wallets);
  }, [meta]);

  const addWallet = () => {
    setWallets((w) => [...w, { label: '', lnaddr: '', default: w.length === 0 }]);
  };

  const updateWallet = (i: number, data: Partial<Wallet>) => {
    setWallets((w) => w.map((x, idx) => (idx === i ? { ...x, ...data } : x)));
  };

  const removeWallet = (i: number) => {
    setWallets((w) => {
      const out = w.filter((_, idx) => idx !== i);
      if (!out.some((x) => x.default) && out.length > 0) out[0].default = true;
      return out;
    });
  };

  const setDefault = (i: number) => {
    setWallets((w) => w.map((x, idx) => ({ ...x, default: idx === i })));
  };

  async function save() {
    if (state.status !== 'ready') return;
    try {
      setSaving(true);
      setError('');
      for (const w of wallets) {
        if (w.lnaddr) await fetchPayData(w.lnaddr);
      }
      const content = JSON.stringify({
        ...(meta || {}),
        wallets,
        lud16: wallets.find((w) => w.default)?.lnaddr || '',
      });
      const tmpl: EventTemplate = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content,
      };
      const signed = await state.signer.signEvent({ ...tmpl });
      const pool = getPool();
      await pool.publish(getRelays(), signed as any);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Lightning Wallets" desc="Manage your lightning wallets.">
      <div className="space-y-3">
        {wallets.map((w, i) => (
          <div key={i} className="space-y-2 rounded border border-border p-2">
            <input
              type="text"
              value={w.label}
              onChange={(e) => updateWallet(i, { label: e.target.value })}
              placeholder="Label"
              className="w-full rounded bg-foreground/10 p-2 text-sm outline-none"
            />
            <input
              type="text"
              value={w.lnaddr}
              onChange={(e) => updateWallet(i, { lnaddr: e.target.value })}
              placeholder="name@example.com"
              className="w-full rounded bg-foreground/10 p-2 text-sm outline-none"
            />
            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={!!w.default}
                onChange={() => setDefault(i)}
              />
              <span className="text-sm">Default</span>
              <button
                type="button"
                onClick={() => removeWallet(i)}
                className="ml-auto text-sm text-red-500"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addWallet} className="btn btn-secondary">
          Add wallet
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="button"
          onClick={save}
          className="btn btn-secondary"
          disabled={saving || state.status !== 'ready' || wallets.length === 0}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Card>
  );
}

export default LightningCard;

