"use client";

import { bytesToHex } from '@noble/hashes/utils';
import { finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import * as nip19 from 'nostr-tools/nip19';
import type { Signer } from './types';

const LS_KEY = 'pd.auth.v1';

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

export class LocalSigner implements Signer {
  type: Signer['type'] = 'local';
  constructor(private privkeyHex: string) {}

  async getPublicKey() {
    return getPublicKey(this.privkeyHex);
  }

  async signEvent(evt: any) {
    const pubkey = await this.getPublicKey();
    const prepared = { ...evt, pubkey };
    return finalizeEvent(prepared, this.privkeyHex);
  }
}

export async function connectLocal(priv?: string) {
  const privkeyHex = priv ? privHexFrom(priv) : bytesToHex(generateSecretKey());
  const signer = new LocalSigner(privkeyHex);
  const pubkey = await signer.getPublicKey();
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ method: 'local', data: { privkeyHex } }),
    );
  } catch {
    // ignore storage errors
  }
  return { method: 'local' as const, pubkey, signer };
}

