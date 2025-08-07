export type AuthState =
  | { method: 'nip07'; pubkey: string }
  | { method: 'public'; pubkey: string }
  | {
      method: 'manual' | 'generated';
      pubkey: string;
      encPriv: {
        v: number;
        kdf: 'pbkdf2';
        iter: number;
        salt: string;
        iv: string;
        ct: string;
      };
    };

const KEY = 'nostr-auth';

export function saveKey(data: AuthState) {
  if ((data as any).privkey) throw new Error('Refusing to store plaintext privkey');
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getStoredKey(): AuthState | null {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearKey() {
  localStorage.removeItem(KEY);
}

