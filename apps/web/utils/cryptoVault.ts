const te = new TextEncoder();
const td = new TextDecoder();
const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));
const ub64 = (s: string) =>
  Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;

async function deriveKey(pass: string, salt: ArrayBuffer, iter = 250_000) {
  const base = await crypto.subtle.importKey(
    'raw',
    te.encode(pass),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPrivkeyHex(privHex: string, pass: string) {
  if (!/^[0-9a-f]{64}$/i.test(privHex))
    throw new Error('privkey must be 64-hex');
  const salt = crypto.getRandomValues(new Uint8Array(16)).buffer;
  const iv = crypto.getRandomValues(new Uint8Array(12)).buffer;
  const k = await deriveKey(pass, salt);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    k,
    te.encode(privHex.toLowerCase())
  );
  return {
    v: 1,
    kdf: 'pbkdf2' as const,
    iter: 250_000,
    salt: b64(salt),
    iv: b64(iv),
    ct: b64(ct),
  };
}

export async function decryptPrivkeyHex(
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
  const k = await deriveKey(pass, ub64(vault.salt), vault.iter);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ub64(vault.iv) },
    k,
    ub64(vault.ct)
  );
  return td.decode(pt);
}

