export type AuthState =
  | { method: 'nip07'; pubkey: string }
  | { method: 'public'; pubkey: string }
  | { method: 'remote'; pubkey: string; relay: string }
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

class KeyStore {
  private readonly KEY = 'nostr-auth';

  save(data: AuthState) {
    if (
      typeof (data as any).privkey === 'string' ||
      typeof (data as any).privkeyHex === 'string'
    )
      throw new Error('Refusing to store plaintext privkey');

    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch {}
  }

  load(): AuthState | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? (JSON.parse(raw) as AuthState) : null;
    } catch {
      return null;
    }
  }

  clear() {
    try {
      localStorage.removeItem(this.KEY);
    } catch {}
  }
}

export const keyStore = new KeyStore();

