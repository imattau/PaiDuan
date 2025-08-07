import { useAuth } from '../../context/authContext';
import { nip19 } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import { encryptPrivkeyHex } from '../../utils/cryptoVault';
import { saveKey } from '../../utils/keyStorage';
import { Card } from '../ui/Card';

export function KeysCard() {
  const auth = useAuth();
  if (!auth.auth) return null;

  const pubHex = auth.pubkey ?? '';
  const npub = pubHex ? nip19.npubEncode(pubHex) : '';

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    alert('Copied');
  };

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

  async function unlock() {
    const pass = prompt('Enter passphrase');
    if (!pass) return;
    try {
      await auth.unlock(pass);
      alert('Unlocked');
    } catch {
      alert('Incorrect passphrase');
    }
  }

  async function changePassphrase() {
    if (!auth.privkeyHex) {
      const p = prompt('Enter current passphrase');
      if (!p) return;
      try {
        await auth.unlock(p);
      } catch {
        alert('Incorrect passphrase');
        return;
      }
    }
    if (!auth.privkeyHex) return;
    const newPass = prompt('Enter new passphrase');
    if (!newPass) return;
    const encPriv = await encryptPrivkeyHex(auth.privkeyHex, newPass);
    const updated = { ...auth.auth, encPriv } as any;
    saveKey(updated);
    alert('Passphrase updated');
    auth.lock();
  }

  async function copyNsecSafely() {
    if (!auth.privkeyHex) return;
    const nsec = nip19.nsecEncode(hexToBytes(auth.privkeyHex));
    await copy(nsec);
  }

  return (
    <Card title="Keys" desc="Your public keys and encrypted private key.">
      <div className="space-y-3">
        <Field label="Public key (hex)" value={pubHex} onCopy={() => copy(pubHex)} />
        <Field label="Public key (npub)" value={npub} onCopy={() => copy(npub)} />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {auth.auth.method !== 'nip07' && auth.auth.method !== 'public' && (
          !auth.isUnlocked ? (
            <button className="btn btn-primary" onClick={unlock}>
              Unlock
            </button>
          ) : (
            <>
              <Confirm
                label="Copy nsec"
                description="Never share this key. Continue?"
                onConfirm={copyNsecSafely}
              />
              <button className="btn btn-secondary" onClick={changePassphrase}>
                Change passphrase
              </button>
            </>
          )
        )}
        <button className="btn btn-secondary" onClick={exportVault}>
          Export encrypted vault
        </button>
      </div>
    </Card>
  );
}

function Field({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div>
      <div className="mb-1 text-sm text-muted-foreground">{label}</div>
      <pre className="bg-black/20 rounded-lg p-3 text-xs overflow-auto">{value}</pre>
      <button onClick={onCopy} className="mt-1 text-sm underline">
        Copy
      </button>
    </div>
  );
}

function Confirm({ label, description, onConfirm }: { label: string; description: string; onConfirm: () => void }) {
  return (
    <button className="btn btn-danger" onClick={() => window.confirm(description) && onConfirm()}>
      {label}
    </button>
  );
}
