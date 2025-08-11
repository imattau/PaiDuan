import * as nip19 from 'nostr-tools/nip19';
import { hexToBytes } from '@noble/hashes/utils';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '../ui/Card';

export function KeysCard() {
  const { state, signOut } = useAuth();
  if (state.status !== 'ready') {
    return (
      <Card title="Keys" desc="Sign in to view your keys.">
        <div>Not signed in.</div>
      </Card>
    );
  }

  const pubHex = state.pubkey;
  const npub = nip19.npubEncode(pubHex);

  const exportNsec = async () => {
    const priv = (state.signer as any).privkeyHex;
    if (!priv) return;
    const nsec = nip19.nsecEncode(hexToBytes(priv));
    await navigator.clipboard.writeText(nsec);
    alert('nsec copied to clipboard');
  };

  const session = (state.signer as any).session;

  return (
    <Card title="Keys" desc="Your public key and signer method.">
      <div className="space-y-2">
        <Field label="Method" value={state.method} />
        <Field label="Public key (hex)" value={pubHex} />
        <Field label="Public key (npub)" value={npub} />
        {state.method === 'nip46' && session && (
          <>
            <Field label="Remote pubkey" value={session.remotePubkey} />
            <Field label="Relays" value={session.relays.join(', ')} />
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        {state.method === 'local' && (
          <button className="btn btn-outline" onClick={exportNsec}>
            Export nsec
          </button>
        )}
        <button className="btn btn-outline" onClick={signOut}>
          Disconnect
        </button>
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-sm text-muted">{label}</div>
      <pre className="bg-black/20 rounded-lg p-3 text-xs overflow-auto overscroll-contain">{value}</pre>
    </div>
  );
}
