import { describe, it, expect, vi, beforeEach } from 'vitest';
import useLightning from './useLightning';

vi.mock('nostr-tools', () => ({
  SimplePool: class {
    publish() {
      return {} as any;
    }
  },
}));

describe('useLightning', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetches invoice via lnurl-pay', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ callback: 'https://example.com/cb' }) })
      .mockResolvedValueOnce({ json: async () => ({ pr: 'lnbc1invoice' }) });
    // @ts-ignore
    global.fetch = fetchMock;
    // @ts-ignore
    global.window = {
      location: { href: '' },
      nostr: { signEvent: vi.fn(async (e) => ({ ...e, id: 'id', sig: 'sig', pubkey: 'pk' })) },
    };

    const { createZap } = useLightning();
    const { invoice } = await createZap({
      lightningAddress: 'user@example.com',
      amount: 100,
      eventId: 'note',
      pubkey: 'pk',
    });

    expect(invoice).toBe('lnbc1invoice');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((global as any).window.location.href).toBe('lightning:lnbc1invoice');
  });
});
