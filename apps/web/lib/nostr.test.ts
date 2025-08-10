import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

vi.mock('@nostr-dev-kit/ndk', () => {
  return {
    default: class {
      pool = { connectedRelays: () => [] };
      connect() {
        return Promise.resolve();
      }
    },
  };
});

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.com',
});
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).localStorage = dom.window.localStorage;
(global as any).navigator = dom.window.navigator;

import { getRelays } from './nostr';

describe('getRelays', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads the latest relay list from localStorage', () => {
    localStorage.setItem('pd.relays', JSON.stringify(['wss://a']));
    expect(getRelays()).toEqual(['wss://a']);
    localStorage.setItem('pd.relays', JSON.stringify(['wss://b']));
    expect(getRelays()).toEqual(['wss://b']);
  });
});

