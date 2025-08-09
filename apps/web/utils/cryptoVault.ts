export function getSubtle(): SubtleCrypto | undefined {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle)
    return globalThis.crypto.subtle;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('crypto').webcrypto?.subtle;
  } catch {
    return undefined;
  }
}

export class CryptoVault {
  private static te = new TextEncoder();
  private static td = new TextDecoder();

  private static b64(b: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(b)));
  }

  private static ub64(s: string) {
    return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;
  }

  private static async deriveKey(
    pass: string,
    salt: ArrayBuffer,
    iter = 250_000
  ) {
    const subtle = getSubtle();
    if (!subtle) throw new Error('WebCrypto API not available');
    const base = await subtle.importKey(
      'raw',
      this.te.encode(pass),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptPrivkeyHex(privHex: string, pass: string) {
    if (!/^[0-9a-f]{64}$/i.test(privHex))
      throw new Error('privkey must be 64-hex');
    const salt = crypto.getRandomValues(new Uint8Array(16)).buffer;
    const iv = crypto.getRandomValues(new Uint8Array(12)).buffer;
    const k = await CryptoVault.deriveKey(pass, salt);
    const subtle = getSubtle();
    if (!subtle) throw new Error('WebCrypto API not available');
    const ct = await subtle.encrypt(
      { name: 'AES-GCM', iv },
      k,
      CryptoVault.te.encode(privHex.toLowerCase())
    );
    return {
      v: 1,
      kdf: 'pbkdf2' as const,
      iter: 250_000,
      salt: CryptoVault.b64(salt),
      iv: CryptoVault.b64(iv),
      ct: CryptoVault.b64(ct),
    };
  }

  async decryptPrivkeyHex(
    vault: {
      v: number;
      kdf: 'pbkdf2';
      iter: number;
      salt: string;
      iv: string;
      ct: string;
    },
    pass: string
  ) {
    const k = await CryptoVault.deriveKey(
      pass,
      CryptoVault.ub64(vault.salt),
      vault.iter
    );
    const subtle = getSubtle();
    if (!subtle) throw new Error('WebCrypto API not available');
    const pt = await subtle.decrypt(
      { name: 'AES-GCM', iv: CryptoVault.ub64(vault.iv) },
      k,
      CryptoVault.ub64(vault.ct)
    );
    return CryptoVault.td.decode(pt);
  }
}

export const cryptoVault = new CryptoVault();

export default cryptoVault;

