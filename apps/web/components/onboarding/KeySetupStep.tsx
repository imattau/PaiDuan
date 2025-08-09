'use client';

import { useState } from 'react';
import * as nip19 from 'nostr-tools/nip19';
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { bytesToHex } from '@noble/hashes/utils';
import { useAuth } from '@/hooks/useAuth';
import { cryptoVault } from '@/utils/cryptoVault';
import { keyStore } from '@/utils/keyStorage';
import { promptPassphrase } from '@/utils/promptPassphrase';
import { Button } from '@paiduan/ui';

function privHexFrom(input: string): string {
  const s = input.trim();
  if (/^nsec1/i.test(s)) {
    const { type, data } = nip19.decode(s);
    if (type !== 'nsec') throw new Error('Invalid nsec');
    return typeof data === 'string' ? data.toLowerCase() : bytesToHex(data);
  }
  if (/^[0-9a-f]{64}$/i.test(s)) return s.toLowerCase();
  throw new Error('Unsupported private key format');
}

export function KeySetupStep({ onComplete }: { onComplete: () => void }) {
  const { state, signInWithLocal, signInWithNip07, signInWithNip46 } = useAuth();
  const [uri, setUri] = useState('');

  async function saveLocalKey(priv: string, method: 'manual' | 'generated') {
    const pass = await promptPassphrase('Set a passphrase to encrypt your key');
    if (!pass) return;
    try {
      if (!globalThis.crypto?.subtle) {
        alert('Your browser does not support the Web Crypto API');
        return;
      }
      const encPriv = await cryptoVault.encryptPrivkeyHex(priv, pass);
      const pubkey = getPublicKey(priv);
      keyStore.save({ method, pubkey, encPriv });
      signInWithLocal(priv);
      // remove plaintext storage from auth hook
      try {
        localStorage.removeItem('pd.auth.v1');
      } catch {}
      onComplete();
    } catch (e: any) {
      alert(e.message || 'Failed to save key');
    }
  }

  const importKey = async () => {
    const input = prompt('Paste nsec or hex private key');
    if (!input) return;
    try {
      const priv = privHexFrom(input);
      await saveLocalKey(priv, 'manual');
    } catch (e: any) {
      alert(e.message || 'Invalid key');
    }
  };

  const generateKey = async () => {
    const priv = bytesToHex(generateSecretKey());
    await saveLocalKey(priv, 'generated');
  };

  const connectRemote = async () => {
    try {
      await signInWithNip46(uri);
      if (state.status === 'ready') {
        try {
          keyStore.save({ method: 'remote', pubkey: state.pubkey, relay: uri });
        } catch {}
      }
      onComplete();
    } catch (e: any) {
      alert(e.message || 'Failed to connect');
    }
  };

  const connectExtension = () => {
    try {
      signInWithNip07();
      onComplete();
    } catch (e: any) {
      alert(e.message || 'No NIP-07 extension found');
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      <Button
        className="btn btn-primary w-full"
        onClick={connectExtension}
        disabled={!(globalThis as any).nostr}
      >
        Continue with Nostr Extension
      </Button>

      <div className="space-y-2 rounded-xl border p-4">
        <label className="text-sm font-medium">Remote signer (NIP‑46)</label>
        <input
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          placeholder="nostrconnect:..."
          className="input w-full"
        />
        <Button className="btn-secondary w-full" onClick={connectRemote}>
          Connect remote signer
        </Button>
      </div>

      <Button className="btn-secondary w-full" onClick={importKey}>
        Import nsec / hex
      </Button>
      <Button className="btn-secondary w-full" onClick={generateKey}>
        Generate new key
      </Button>
    </div>
  );
}

export default KeySetupStep;
