import { describe, it, expect, vi, beforeEach } from 'vitest';
import useLightning from './useLightning';

vi.mock('./useAuth', () => ({
  useAuth: () => ({ state: { status: 'ready', pubkey: 'pk', signer: { signEvent: vi.fn(async (e: any) => ({ ...e, id: 'id', sig: 'sig', pubkey: 'pk' })) } } }),
}));

vi.mock('nostr-tools/pool', () => ({
  SimplePool: class {
    get() {
      return Promise.resolve({
        content: JSON.stringify({ zapSplits: [{ lnaddr: 'col@example.com', pct: 10 }] }),
      });
    }
    publish() {
      return {} as any;
    }
  },
}));

describe('useLightning', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('splits zap between recipients', async () => {
    process.env.NEXT_PUBLIC_TREASURY_LNADDR = 'treasury@example.com';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ callback: 'https://cb1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ pr: 'inv1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ callback: 'https://cb2' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ pr: 'inv2' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ callback: 'https://cb3' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ pr: 'inv3' }) });
    // @ts-ignore
    global.fetch = fetchMock;
    // @ts-ignore
    global.window = {
      open: vi.fn(),
    };

    const { createZap } = useLightning();
    const { invoices } = await createZap({
      lightningAddress: 'user@example.com',
      amount: 100,
      eventId: 'note',
      pubkey: 'pk',
    });

    expect(invoices.length).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect((global as any).window.open).toHaveBeenCalledTimes(3);
  });
});
