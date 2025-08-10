import { describe, expect, it } from 'vitest';
import { normalizeRelay, parseRelays } from '@/lib/nostr';

describe('normalizeRelay', () => {
  it('accepts valid relay URLs', () => {
    expect(normalizeRelay('wss://relay.example.com')).toBe('wss://relay.example.com');
  });

  it('adds default wss scheme', () => {
    expect(normalizeRelay('relay.example.com')).toBe('wss://relay.example.com');
  });

  it('rejects malformed URLs', () => {
    expect(normalizeRelay('wss:relay.example.com')).toBeUndefined();
    expect(normalizeRelay('http://relay.example.com')).toBeUndefined();
  });
});

describe('parseRelays', () => {
  it('filters out invalid entries', () => {
    const input = ['wss://relay.example.com', 'http://bad', 'wss:relay.example.com'];
    expect(parseRelays(input)).toEqual(['wss://relay.example.com']);
  });

  it('parses comma separated strings', () => {
    expect(parseRelays('wss://relay.example.com, http://bad')).toEqual([
      'wss://relay.example.com',
    ]);
  });
});
