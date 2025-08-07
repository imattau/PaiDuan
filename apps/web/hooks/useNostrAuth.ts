import { getPublicKey, generateSecretKey, nip19 } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';
import { saveKey } from '../utils/keyStorage';
import { encryptPrivkeyHex } from '../utils/cryptoVault';

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

function pubHexFrom(input: string): string {
  const s = input.trim();
  if (/^npub1/i.test(s)) {
    const { type, data } = nip19.decode(s);
    if (type !== 'npub') throw new Error('Invalid npub');
    return typeof data === 'string' ? data.toLowerCase() : bytesToHex(data);
  }
  if (/^[0-9a-f]{64}$/i.test(s)) return s.toLowerCase();
  throw new Error('Unsupported public key format');
}

export function useNostrAuth() {
  async function signInWithExtension() {
    if ((window as any).nostr?.getPublicKey) {
      const pubkey = await (window as any).nostr.getPublicKey();
      saveKey({ method: 'nip07', pubkey });
      window.location.href = '/feed';
    } else {
      alert('No Nostr extension found.');
    }
  }

  async function importKey() {
    const input = prompt('Paste nsec (preferred), npub (read only), or 64-hex');
    if (!input) return;
    if (/^npub1/i.test(input)) {
      const pubkey = pubHexFrom(input);
      saveKey({ method: 'public', pubkey });
      alert(
        'Imported public key only. To post, unlock with an nsec or connect a NIP-07 signer.'
      );
      window.location.href = '/feed';
      return;
    }
    const privHex = privHexFrom(input);
    const pubkey = getPublicKey(privHex);
    const pass = prompt('Set a passphrase to encrypt your key');
    if (!pass) return;
    const encPriv = await encryptPrivkeyHex(privHex, pass);
    saveKey({ method: 'manual', pubkey, encPriv });
    window.location.href = '/feed';
  }

  async function generateKey() {
    const pass = prompt('Set a passphrase to encrypt your new key');
    if (!pass) return;
    const privHex = bytesToHex(generateSecretKey());
    const pubkey = getPublicKey(privHex);
    const encPriv = await encryptPrivkeyHex(privHex, pass);
    saveKey({ method: 'generated', pubkey, encPriv });
    window.location.href = '/feed';
  }

  return { signInWithExtension, importKey, generateKey };
}

