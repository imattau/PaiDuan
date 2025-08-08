import { SimplePool } from 'nostr-tools/pool';
import { generateSecretKey, getPublicKey, type EventTemplate } from 'nostr-tools/pure';
import * as nip04 from 'nostr-tools/nip04';
import { Relay } from 'nostr-tools/relay';
import type { Signer } from './types';

type Nip46Session = {
  remotePubkey: string;
  relays: string[];
  myPrivkey: string;
};

export class Nip46Signer implements Signer {
  type: Signer['type'] = 'nip46';
  private session: Nip46Session;
  private pool = new SimplePool();

  constructor(session: Nip46Session) {
    this.session = session;
  }

  /** Parse a nostrconnect URI into components. */
  static parseNostrConnectUri(
    uri: string,
  ): { remotePubkey: string; relays: string[]; secret?: string } {
    const u = uri.replace('nostrconnect://', 'nostrconnect:');
    const [, rest] = u.split('nostrconnect:');
    const [remotePubkey, query = ''] = rest.split('?');
    const params = new URLSearchParams(query.replace(/&wss/g, '&relay'));
    const relays: string[] = [];
    for (const [k, v] of params.entries()) if (k === 'relay') relays.push(v);
    const secret = params.get('secret') || undefined;
    return {
      remotePubkey,
      relays: relays.length
        ? relays
        : ['wss://relay.damus.io', 'wss://relay.primal.net'],
      secret,
    };
  }

  /** Create a signer from a nostrconnect URI and perform handshake. */
  static async createFromUri(uri: string) {
    const { remotePubkey, relays, secret } =
      Nip46Signer.parseNostrConnectUri(uri);
    const myPrivkey = generateSecretKey();
    const signer = new Nip46Signer({ remotePubkey, relays, myPrivkey });
    await signer.rpc('connect', [remotePubkey, secret || '']);
    return signer;
  }

  async getPublicKey() {
    const pub = await this.rpc('get_public_key', []);
    if (!pub || typeof pub !== 'string')
      throw new Error('Remote signer did not return a pubkey');
    return pub;
  }

  async signEvent(evt: EventTemplate) {
    const resp = await this.rpc('sign_event', [evt]);
    const parsed =
      typeof resp === 'string' ? (JSON.parse(resp) as any) : (resp as any);
    if (!parsed || !parsed.sig || !parsed.id || !parsed.pubkey)
      throw new Error('Invalid sign_event response');
    return { ...evt, id: parsed.id, sig: parsed.sig, pubkey: parsed.pubkey } as any;
  }

  private async rpc(method: string, params: any[]): Promise<any> {
    const conns = (
      await Promise.all(
        this.session.relays.map(async (url) => {
          try {
            return await Relay.connect(url);
          } catch {
            return undefined;
          }
        }),
      )
    ).filter((r): r is Relay => !!r);

    const myPub = getPublicKey(this.session.myPrivkey);
    const id = Math.random().toString(36).slice(2);
    const payload = JSON.stringify({ id, method, params });
    const ciphertext = await nip04.encrypt(
      this.session.myPrivkey,
      this.session.remotePubkey,
      payload,
    );

    const ev = {
      kind: 24133,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', this.session.remotePubkey]],
      content: ciphertext,
      pubkey: myPub,
    };

    const pool = this.pool;
    await pool.publish(conns, ev as any);

    const reply = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('NIP-46 RPC timeout')), 8000);
      const sub = pool.subscribeMany(
        conns,
        [{ kinds: [24133], authors: [this.session.remotePubkey], '#p': [myPub], since: ev.created_at }],
        {
          onevent: async (msg) => {
            try {
              const plain = await nip04.decrypt(
                this.session.myPrivkey,
                this.session.remotePubkey,
                msg.content,
              );
              const data = JSON.parse(plain);
              if (data.id !== id) return;
              clearTimeout(timeout);
              sub.close();
              if (data.error) reject(new Error(data.error));
              else resolve(data.result);
            } catch {
              /* ignore */
            }
          },
          onclose: () => {},
        },
      );
    });

    conns.forEach((r) => {
      try {
        r.close();
      } catch {
        /* ignore */
      }
    });
    return reply;
  }
}

export async function connectNip46(uri: string) {
  const signer = await Nip46Signer.createFromUri(uri);
  const pubkey = await signer.getPublicKey();
  return { method: 'nip46' as const, pubkey, signer };
}

