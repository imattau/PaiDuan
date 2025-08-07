import { useAuth } from '../../context/authContext';
import { nip19 } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';

export function KeysCard() {
  const auth = useAuth();
  if (!auth.auth) return null;

  const pubhex = auth.pubkey ?? '';
  const npub = pubhex ? nip19.npubEncode(pubhex) : '';

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    alert(`${label} copied`);
  }

  function exportVault() {
    if (auth.auth.method === 'nip07' || auth.auth.method === 'public') {
      alert('No private key stored');
      return;
    }
    const blob = new Blob([JSON.stringify(auth.auth.encPriv, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paiduan-nostr-vault.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyNsec() {
    if (!auth.privkeyHex) {
      const pass = prompt('Enter passphrase');
      if (!pass) return;
      try {
        await auth.unlock(pass);
      } catch {
        alert('Incorrect passphrase');
        return;
      }
    }
    if (!auth.privkeyHex) return;
    const nsec = nip19.nsecEncode(hexToBytes(auth.privkeyHex));
    await copy(nsec, 'nsec');
  }

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <h3 className="text-lg font-semibold">Keys</h3>
      <div>
        <div className="text-sm text-gray-500">Public key (hex)</div>
        <div className="break-all text-sm">{pubhex}</div>
        <button
          className="underline text-sm"
          onClick={() => copy(pubhex, 'Public key (hex)')}
        >
          Copy hex
        </button>
      </div>
      <div>
        <div className="text-sm text-gray-500">Public key (npub)</div>
        <div className="break-all text-sm">{npub}</div>
        <button
          className="underline text-sm"
          onClick={() => copy(npub, 'npub')}
        >
          Copy npub
        </button>
      </div>
      <div className="flex gap-3 pt-2">
        <button className="px-3 py-2 rounded border" onClick={exportVault}>
          Export encrypted vault
        </button>
        {auth.auth.method !== 'nip07' && auth.auth.method !== 'public' && (
          <button className="px-3 py-2 rounded border" onClick={copyNsec}>
            {auth.isUnlocked ? 'Copy nsec' : 'Unlock & copy nsec'}
          </button>
        )}
      </div>
    </div>
  );
}

