import { useEffect, useState } from 'react';
import { LocalSigner } from '@/lib/signers/local';
import { Nip07Signer } from '@/lib/signers/nip07';
import { Nip46Signer } from '@/lib/signers/nip46';
import type { Signer } from '@/lib/signers/types';

type AuthState =
  | { status: 'signedOut' }
  | { status: 'ready'; signer: Signer; pubkey: string; method: 'local' | 'nip07' | 'nip46' };

const LS_KEY = 'pd.auth.v1';

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: 'signedOut' });
  const [hasKeys, setHasKeys] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  function refreshFlags() {
    if (typeof localStorage === 'undefined') return;
    setHasKeys(!!localStorage.getItem(LS_KEY));
    setHasProfile(localStorage.getItem('pd.onboarded') === '1');
  }

  useEffect(() => {
    refreshFlags();
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    if (raw) {
      (async () => {
        try {
          const saved = JSON.parse(raw);
          let signer: Signer | undefined;
          if (saved.method === 'local') signer = new LocalSigner(saved.data.privkeyHex);
          if (saved.method === 'nip07') signer = new Nip07Signer();
          if (saved.method === 'nip46') signer = new Nip46Signer(saved.data.session);
          if (!signer) return;
          const pubkey = await signer.getPublicKey();
          setState({ status: 'ready', signer, pubkey, method: saved.method });
        } catch (e) {
          console.error(e);
          localStorage.removeItem(LS_KEY);
        }
      })();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', refreshFlags);
      return () => window.removeEventListener('storage', refreshFlags);
    }
  }, []);

  function signInWithLocal(privkeyHex: string) {
    const signer = new LocalSigner(privkeyHex);
    signer.getPublicKey().then((pubkey) => {
      localStorage.setItem(LS_KEY, JSON.stringify({ method: 'local', data: { privkeyHex } }));
      setState({ status: 'ready', signer, pubkey, method: 'local' });
      refreshFlags();
    });
  }

  function signInWithNip07() {
    const signer = new Nip07Signer();
    signer.getPublicKey().then((pubkey) => {
      localStorage.setItem(LS_KEY, JSON.stringify({ method: 'nip07', data: {} }));
      setState({ status: 'ready', signer, pubkey, method: 'nip07' });
      refreshFlags();
    });
  }

  async function signInWithNip46(nostrconnectUri: string) {
    const signer = await Nip46Signer.createFromUri(nostrconnectUri);
    const pubkey = await signer.getPublicKey();
    // @ts-ignore
    localStorage.setItem(LS_KEY, JSON.stringify({ method: 'nip46', data: { session: signer['session'] } }));
    setState({ status: 'ready', signer, pubkey, method: 'nip46' });
    refreshFlags();
  }

  function signOut() {
    localStorage.removeItem(LS_KEY);
    setState({ status: 'signedOut' });
    refreshFlags();
  }

  return {
    state,
    signInWithLocal,
    signInWithNip07,
    signInWithNip46,
    signOut,
    hasKeys,
    hasProfile
  };
}
