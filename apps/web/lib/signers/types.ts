export interface Signer {
  type: 'local' | 'nip07' | 'nip46';
  getPublicKey(): Promise<string>;
  signEvent<T extends { kind: number; created_at: number; tags: string[][]; content: string; pubkey?: string }>(evt: T): Promise<T & { id: string; sig: string; pubkey: string }>;
}
