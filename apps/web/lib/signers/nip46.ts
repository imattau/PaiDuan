import { SimplePool, generateSecretKey, getPublicKey, nip04, Relay, type EventTemplate } from 'nostr-tools';
import type { Signer } from './types';

type Nip46Session = {
  remotePubkey: string;
  relays: string[];
  myPrivkey: string;
  token?: string;
};

export class Nip46Signer implements Signer {
  type: Signer['type'] = 'nip46';
  private session: Nip46Session;
  private pool = new SimplePool();

  constructor(session: Nip46Session) {
    this.session = session;
  }

  static parseNostrConnectUri(uri: string): { remotePubkey: string; relays: string[]; secret?: string } {
    const u = uri.replace('nostrconnect://', 'nostrconnect:');
    const [, rest] = u.split('nostrconnect:');
    const [remotePubkey, query = ''] = rest.split('?');
    const params = new URLSearchParams(query.replace(/&wss/g, '&relay'));
    const relays: string[] = [];
    for (const [k, v] of params.entries()) if (k === 'relay') relays.push(v);
    const secret = params.get('secret') || undefined;
    return { remotePubkey, relays: relays.length ? relays : ['wss://relay.damus.io', 'wss://relay.primal.net'], secret };
  }

  static async createFromUri(uri: string) {
    const { remotePubkey, relays } = Nip46Signer.parseNostrConnectUri(uri);
    const myPrivkey = generateSecretKey();
    return new Nip46Signer({ remotePubkey, relays, myPrivkey });
  }

  async getPublicKey() {
    const info = await this.rpc('get_public_key', {});
    if (!info || !info.pubkey) throw new Error('Remote signer did not return a pubkey');
    return info.pubkey;
  }

  async signEvent(evt: EventTemplate) {
    const resp = await this.rpc('sign_event', { event: evt });
    if (!resp || !resp.sig || !resp.id || !resp.pubkey) throw new Error('Invalid sign_event response');
    return { ...evt, id: resp.id, sig: resp.sig, pubkey: resp.pubkey } as any;
  }

  private async rpc(method: string, params: any) {
    const conns = await Promise.all(
      this.session.relays.map(async (url) => {
        const r = new Relay(url);
        try {
          await r.connect();
        } catch {}
        return r;
      }),
    );

    const myPub = getPublicKey(this.session.myPrivkey);
    const payload = JSON.stringify({ method, params, token: this.session.token || null, ts: Math.floor(Date.now() / 1000) });
    const ciphertext = await nip04.encrypt(this.session.myPrivkey, this.session.remotePubkey, payload);

    const ev = {
      kind: 24133,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', this.session.remotePubkey]],
      content: ciphertext,
      pubkey: myPub,
    };

    const pool = this.pool;
    const pub = await pool.publish(conns, ev as any);

    const reply = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('NIP-46 RPC timeout')), 8000);
      const sub = pool.subscribeMany(
        conns,
        [{ kinds: [24133], authors: [this.session.remotePubkey], '#p': [myPub], since: ev.created_at }],
        {
          onevent: async (msg) => {
            try {
              const plain = await nip04.decrypt(this.session.myPrivkey, this.session.remotePubkey, msg.content);
              const data = JSON.parse(plain);
              clearTimeout(timeout);
              sub.close();
              resolve(data?.result ?? data);
            } catch {}
          },
          onclose: () => {},
        },
      );
    });

    conns.forEach((r) => {
      try {
        r.close();
      } catch {}
    });
    return reply;
  }
}

