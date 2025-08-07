import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStoredKey } from '../utils/keyStorage';

interface AuthContextValue {
  pubkey: string;
  privkey?: string;
  method: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthContextValue | null>(null);

  useEffect(() => {
    const key = getStoredKey();
    if (key) setAuth(key);
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
