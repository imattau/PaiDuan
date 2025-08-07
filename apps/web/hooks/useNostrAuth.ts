import { generatePrivateKey, getPublicKey } from 'nostr-tools';
import { saveKey } from '../utils/keyStorage';

export function useNostrAuth() {
  function signInWithExtension() {
    if (window.nostr?.getPublicKey) {
      window.nostr.getPublicKey().then((pubkey: string) => {
        saveKey({ pubkey, method: 'nip07' });
        window.location.href = '/feed';
      });
    } else {
      alert('No Nostr extension found.');
    }
  }

  function importKey() {
    const nsec = prompt('Paste your Nostr private key (nsec...)');
    if (!nsec) return;
    const privkey = nsec; // decoding omitted for simplicity
    const pubkey = getPublicKey(privkey);
    saveKey({ privkey, pubkey, method: 'manual' });
    window.location.href = '/feed';
  }

  function generateKey() {
    const privkey = generatePrivateKey();
    const pubkey = getPublicKey(privkey);
    saveKey({ privkey, pubkey, method: 'generated' });
    window.location.href = '/feed';
  }

  return { signInWithExtension, importKey, generateKey };
}
