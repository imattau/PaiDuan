import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./useAuth', () => ({
  useAuth: () => ({ state: { status: 'ready', pubkey: 'pk', signer: { signEvent: vi.fn(async (e: any) => ({ ...e, id: 'id', sig: 'sig', pubkey: 'pk' })) } } }),
}));

const poolGetMock = vi.fn();

vi.mock('@/lib/relayPool', () => ({
  default: {
    get: (...args: any[]) => poolGetMock(...args),
    publish: () => ({} as any),
  },
}));

vi.mock('../lib/nostr', () => ({
  getRelays: () => [],
}));

import useLightning from './useLightning';

// Capture the existing window before any test runs
const originalWindow: any = typeof window !== 'undefined' ? { ...window } : {};
let sendPaymentMock: ReturnType<typeof vi.fn>;

describe('useLightning', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sendPaymentMock = vi.fn();
    if (typeof window === 'undefined') {
      // @ts-ignore
      global.window = {};
    }
    Object.defineProperty(window, 'webln', {
      value: { sendPayment: sendPaymentMock },
      configurable: true,
    });
    window.open = vi.fn();
  });

  afterEach(() => {
    if (originalWindow.open) {
      window.open = originalWindow.open;
    } else {
      // @ts-ignore
      delete window.open;
    }
    // Remove injected webln to avoid cross-test contamination
    // @ts-ignore
    delete window.webln;
  });

  it('splits zap using event zap tags', async () => {
    poolGetMock.mockResolvedValueOnce({
      tags: [
        ['zap', 'user@example.com', '85'],
        ['zap', 'col@example.com', '10'],
      ],
    });

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

    const { createZap } = useLightning();
    const { invoices } = await createZap({
      lightningAddress: 'user@example.com',
      amount: 100,
      eventId: 'note',
      pubkey: 'pk',
    });

    expect(poolGetMock).toHaveBeenCalledTimes(1);
    expect(invoices.length).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(sendPaymentMock).toHaveBeenCalledTimes(3);
  });

  it('falls back to metadata splits when event has none', async () => {
    poolGetMock
      .mockResolvedValueOnce({ tags: [] })
      .mockResolvedValueOnce({
        content: JSON.stringify({ zapSplits: [{ lnaddr: 'col@example.com', pct: 10 }] }),
      });

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

    const { createZap } = useLightning();
    const { invoices } = await createZap({
      lightningAddress: 'user@example.com',
      amount: 100,
      eventId: 'note',
      pubkey: 'pk',
    });

    expect(poolGetMock).toHaveBeenCalledTimes(2);
    expect(invoices.length).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(sendPaymentMock).toHaveBeenCalledTimes(3);
  });
});
