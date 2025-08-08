import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { getStoredKey, type AuthState } from '../utils/keyStorage';
import { decryptPrivkeyHex } from '../utils/cryptoVault';

type UnlockCtx = {
  auth: AuthState | null;
  isUnlocked: boolean;
  pubkey: string | null;
  privkeyHex?: string | null;
  unlock: (pass: string) => Promise<string | null>;
  lock: () => void;
  setAuth: (a: AuthState | null) => void;
  bump: () => void;
};

const AuthContext = createContext<UnlockCtx>({} as any);

const AUTO_LOCK_MS = 10 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [privkeyHex, setPrivkeyHex] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const a = getStoredKey();
    setAuth(a);
  }, []);

  function startAutoLock() {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPrivkeyHex(null), AUTO_LOCK_MS);
  }

  async function unlock(pass: string) {
    if (!auth) throw new Error('No account');
    if (auth.method === 'nip07' || auth.method === 'public') {
      setPrivkeyHex(null);
      return null;
    }
    const hex = await decryptPrivkeyHex(auth.encPriv, pass);
    setPrivkeyHex(hex);
    startAutoLock();
    return hex;
  }

  function lock() {
    setPrivkeyHex(null);
    if (timer.current) window.clearTimeout(timer.current);
  }

  function bump() {
    if (privkeyHex) startAutoLock()
  }

  const value = useMemo(
    () => ({
      auth,
      isUnlocked: !!privkeyHex || auth?.method === 'nip07',
      pubkey: auth?.pubkey ?? null,
      privkeyHex,
      unlock,
      lock,
      setAuth: (a: AuthState | null) => {
        setPrivkeyHex(null);
        setAuth(a);
      },
      bump,
    }),
    [auth, privkeyHex]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

