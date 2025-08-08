import type { Signer } from './types';

export class Nip07Signer implements Signer {
  type: Signer['type'] = 'nip07';
  private provider = (globalThis as any).nostr;

  constructor() {
    if (!this.provider) throw new Error('NIP-07 provider not found (is a Nostr extension installed?)');
  }

  async getPublicKey() {
    return this.provider.getPublicKey();
  }

  async signEvent(evt: any) {
    const signed = await this.provider.signEvent(evt);
    if (!signed.pubkey) signed.pubkey = await this.getPublicKey();
    return signed;
  }
}
