import { getPublicKey, generateSecretKey, nip19 } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';
import { saveKey } from '../utils/keyStorage';
import { encryptPrivkeyHex } from '../utils/cryptoVault';
import { promptPassphrase } from '../utils/promptPassphrase';

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
  async function remoteSignerLogin() {
    const nostr = (window as any).nostr;
    if (nostr?.getPublicKey) {
      const pubkey = await nostr.getPublicKey();
      saveKey({ method: 'nip07', pubkey });
    } else {
      const relay = prompt('Enter remote signer relay URL');
      const pubkey = prompt('Enter your public key');
      if (!relay || !pubkey) return;
      saveKey({ method: 'remote', pubkey, relay });
    }
    window.location.href = '/onboarding/profile';
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
      window.location.href = '/onboarding/profile';
      return;
    }
    const privHex = privHexFrom(input);
    const pubkey = getPublicKey(privHex);
    let pass: string | null;
    while (true) {
      pass = await promptPassphrase('Set a passphrase to encrypt your key');
      if (!pass) return;
      if (pass.length < 8) {
        alert('Passphrase must be at least 8 characters');
        continue;
      }
      if (pass.length < 12) alert('Warning: short passphrases are easier to guess');
      break;
    }
    const encPriv = await encryptPrivkeyHex(privHex, pass);
    saveKey({ method: 'manual', pubkey, encPriv });
    window.location.href = '/onboarding/profile';
  }

  async function generateKey() {
    let pass: string | null;
    while (true) {
      pass = await promptPassphrase('Set a passphrase to encrypt your new key');
      if (!pass) return;
      if (pass.length < 8) {
        alert('Passphrase must be at least 8 characters');
        continue;
      }
      if (pass.length < 12) alert('Warning: short passphrases are easier to guess');
      break;
    }
    const privHex = bytesToHex(generateSecretKey());
    const pubkey = getPublicKey(privHex);
    const encPriv = await encryptPrivkeyHex(privHex, pass);
    saveKey({ method: 'generated', pubkey, encPriv });
    window.location.href = '/onboarding/profile';
  }

  return { remoteSignerLogin, importKey, generateKey };
}

