import { getPublicKey, finalizeEvent } from 'nostr-tools';
import type { Signer } from './types';

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
