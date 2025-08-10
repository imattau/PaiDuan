import { describe, it, expect, vi, beforeEach } from 'vitest';

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

import useLightning from './useLightning';

describe('useLightning', () => {
  beforeEach(() => {
    vi.resetAllMocks();
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
    const sendPaymentMock = vi.fn();
      (global as any).window = {
        webln: { sendPayment: sendPaymentMock } as any,
        open: vi.fn(),
      };

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
    const sendPaymentMock = vi.fn();
      (global as any).window = {
        webln: { sendPayment: sendPaymentMock } as any,
        open: vi.fn(),
      };

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
