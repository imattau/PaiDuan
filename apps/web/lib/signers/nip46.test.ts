import { describe, it, expect } from 'vitest';
import { Nip46Signer } from './nip46';

describe('parseNostrConnectUri', () => {
  it('parses valid URI', () => {
    const uri =
      'nostrconnect:abcdef?relay=wss://relay1.example&relay=wss://relay2.example&secret=shh';
    const res = Nip46Signer.parseNostrConnectUri(uri);
    expect(res.remotePubkey).toBe('abcdef');
    expect(res.relays).toEqual(['wss://relay1.example', 'wss://relay2.example']);
    expect(res.secret).toBe('shh');
  });

  it('throws on invalid URI', () => {
    expect(() => Nip46Signer.parseNostrConnectUri('nostr:xyz')).toThrow(
      'Invalid Nostr Connect URI',
    );
  });
});
