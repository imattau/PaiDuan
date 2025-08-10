'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import type { EventTemplate } from 'nostr-tools/pure';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { getRelays } from '@/lib/nostr';
import pool from '@/lib/relayPool';
import { authenticate, fetchPayData } from '@/utils/lnurl';
import { Card } from '../ui/Card';

interface Wallet {
  label: string;
  lnaddr: string;
  default?: boolean;
  verified?: boolean;
}

export function LightningCard() {
  const { state } = useAuth();
  const meta = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [zapSplits, setZapSplits] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [qr, setQr] = useState('');

  useEffect(() => {
    if (Array.isArray(meta?.wallets)) setWallets(meta.wallets);
    else if (typeof meta?.lud16 === 'string' && meta.lud16)
      setWallets([{ label: '', lnaddr: meta.lud16, default: true }]);
    if (Array.isArray(meta?.zapSplits)) setZapSplits(meta.zapSplits);
  }, [meta]);

  const defaultAddress = wallets.find((w) => w.default)?.lnaddr;

  useEffect(() => {
    if (defaultAddress) {
      QRCode.toDataURL(defaultAddress)
        .then((url) => setQr(url))
        .catch(() => setQr(''));
    } else {
      setQr('');
    }
  }, [defaultAddress]);

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

  const verifyWallet = async (i: number) => {
    try {
      setError('');
      const w = wallets[i];
      if (!w.lnaddr) throw new Error('Missing address');
      await authenticate(w.lnaddr);
      updateWallet(i, { verified: true });
    } catch (e: any) {
      setError(e.message || 'Verification failed');
    }
  };

  const te = new TextEncoder();
  const td = new TextDecoder();
  const hexToBytes = (hex: string) =>
    Uint8Array.from(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));
  const ub64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;

  async function deriveKey() {
    if (state.status !== 'ready') throw new Error('auth required');
    if (!globalThis.crypto?.subtle)
      throw new Error('WebCrypto API not supported');
    const subtle = globalThis.crypto.subtle;
    const evt: EventTemplate = {
      kind: 22242,
      created_at: 0,
      tags: [],
      content: 'paiduan-wallet-backup',
    };
    const signed = await state.signer.signEvent(evt);
    const hash = await subtle.digest('SHA-256', hexToBytes(signed.sig));
    return subtle.importKey('raw', hash, 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ]);
  }

  async function exportConfig() {
    try {
      if (!globalThis.crypto?.subtle) throw new Error('WebCrypto API not supported');
      const subtle = globalThis.crypto.subtle;
      const key = await deriveKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const data = te.encode(JSON.stringify({ wallets, zapSplits }));
      const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
      const out = JSON.stringify({ iv: b64(iv.buffer), ct: b64(ct) });
      const blob = new Blob([out], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wallet-config.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || 'Export failed');
    }
  }

  const fileRef = React.useRef<HTMLInputElement>(null);
  const triggerImport = () => fileRef.current?.click();

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (!globalThis.crypto?.subtle) throw new Error('WebCrypto API not supported');
      const subtle = globalThis.crypto.subtle;
      const key = await deriveKey();
      const payload = JSON.parse(await file.text());
      const pt = await subtle.decrypt(
        { name: 'AES-GCM', iv: ub64(payload.iv) },
        key,
        ub64(payload.ct),
      );
      const parsed = JSON.parse(td.decode(pt));
      if (Array.isArray(parsed.wallets)) setWallets(parsed.wallets);
      if (Array.isArray(parsed.zapSplits)) setZapSplits(parsed.zapSplits);
    } catch (e: any) {
      setError(e.message || 'Import failed');
    } finally {
      e.target.value = '';
    }
  }

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
        zapSplits,
        lud16: wallets.find((w) => w.default)?.lnaddr || '',
      });
      const tmpl: EventTemplate = {
        kind: 0,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content,
      };
      const signed = await state.signer.signEvent({ ...tmpl });
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
              className="w-full rounded bg-text-primary/10 p-2 text-sm outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={w.lnaddr}
                onChange={(e) => updateWallet(i, { lnaddr: e.target.value })}
                placeholder="name@example.com"
                className="flex-1 rounded bg-text-primary/10 p-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(w.lnaddr)}
                className="text-sm text-accent-primary"
              >
                Copy
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                checked={!!w.default}
                onChange={() => setDefault(i)}
              />
              <span className="text-sm">Default</span>
              <button
                type="button"
                onClick={() => verifyWallet(i)}
                className="text-sm text-accent-primary"
              >
                {w.verified ? 'Verified' : 'Verify ownership'}
              </button>
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
        <button type="button" onClick={addWallet} className="btn btn-outline">
          Add wallet
        </button>
        {qr && (
          <div className="flex justify-center">
            <Image
              src={qr}
              alt="Lightning address QR code"
              width={128}
              height={128}
              className="h-32 w-32"
            />
          </div>
        )}
        <a
          href="https://lightningaddress.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-accent-primary"
        >
          What is a Lightning address?
        </a>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportConfig}
            className="btn btn-outline"
            disabled={state.status !== 'ready'}
          >
            Export wallet config
          </button>
          <button
            type="button"
            onClick={triggerImport}
            className="btn btn-outline"
            disabled={state.status !== 'ready'}
          >
            Import wallet config
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
        <button
          type="button"
          onClick={save}
          className="btn btn-outline"
          disabled={saving || state.status !== 'ready' || wallets.length === 0}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </Card>
  );
}

export default LightningCard;

