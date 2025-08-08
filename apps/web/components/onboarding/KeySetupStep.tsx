import { useState } from 'react';
import { nip19, generateSecretKey } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';
import { useAuth } from '@/hooks/useAuth';

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
  const { signInWithLocal, signInWithNip07, signInWithNip46 } = useAuth();
  const [uri, setUri] = useState('');

  const importKey = () => {
    const input = prompt('Paste nsec or hex private key');
    if (!input) return;
    try {
      const priv = privHexFrom(input);
      signInWithLocal(priv);
      onComplete();
    } catch (e: any) {
      alert(e.message || 'Invalid key');
    }
  };

  const generateKey = () => {
    const priv = bytesToHex(generateSecretKey());
    signInWithLocal(priv);
    onComplete();
  };

  const connectRemote = async () => {
    try {
      await signInWithNip46(uri);
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
      <button
        className="btn-primary w-full"
        onClick={connectExtension}
        disabled={!(globalThis as any).nostr}
      >
        Continue with Nostr Extension
      </button>

      <div className="space-y-2 rounded-xl border p-4">
        <label className="text-sm font-medium">Remote signer (NIP‑46)</label>
        <input
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          placeholder="nostrconnect:..."
          className="input w-full"
        />
        <button className="btn-secondary w-full" onClick={connectRemote}>
          Connect remote signer
        </button>
      </div>

      <button className="btn-secondary w-full" onClick={importKey}>
        Import nsec / hex
      </button>
      <button className="btn-secondary w-full" onClick={generateKey}>
        Generate new key
      </button>
    </div>
  );
}

export default KeySetupStep;
