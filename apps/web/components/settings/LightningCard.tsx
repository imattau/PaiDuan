import React, { useEffect, useState } from 'react';
import type { EventTemplate } from 'nostr-tools/pure';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getPool, getRelays } from '@/lib/nostr';
import { fetchPayData, requestInvoice } from '@/utils/lnurl';
import useWebLN from '@/hooks/useWebLN';
import { Card } from '../ui/Card';

export function LightningCard() {
  const { state } = useAuth();
  const meta = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const [addr, setAddr] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const [error, setError] = useState('');
  const { webln, getInfo } = useWebLN();

  useEffect(() => {
    if (meta?.lud16) setAddr(meta.lud16);
  }, [meta]);

  async function testZap() {
    try {
      setTesting(true);
      setError('');
      const payData = await fetchPayData(addr);
      await requestInvoice(payData, 1, 'test');
      setTested(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send zap');
      setTested(false);
    } finally {
      setTesting(false);
    }
  }

  async function connect() {
    try {
      const info = await getInfo();
      const lightningAddress =
        info?.lightningAddress || info?.node?.alias || info?.node?.lightning_address;
      if (lightningAddress) {
        setAddr(lightningAddress);
        setTested(false);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to connect wallet');
    }
  }

  async function save() {
    if (state.status !== 'ready') return;
    try {
      setSaving(true);
      setError('');
      await fetchPayData(addr);
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
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Lightning Address" desc="Set your default lightning address.">
      <div className="space-y-3">
        <input
          type="text"
          value={addr}
          onChange={(e) => {
            setAddr(e.target.value);
            setTested(false);
            setError('');
          }}
          placeholder="name@example.com"
          className="w-full rounded bg-foreground/10 p-2 text-sm outline-none"
        />
        {webln && (
          <button type="button" onClick={connect} className="btn btn-secondary">
            Connect wallet
          </button>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="button"
          onClick={testZap}
          className="btn btn-secondary"
          disabled={testing || !addr}
        >
          {testing ? 'Testing…' : 'Send test zap'}
        </button>
        <button
          type="button"
          onClick={save}
          className="btn btn-secondary"
          disabled={saving || state.status !== 'ready' || !tested}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Card>
  );
}

export default LightningCard;

