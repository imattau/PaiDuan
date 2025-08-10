import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const originalEnv = process.env.NEXT_PUBLIC_TREASURY_LNADDR;
const originalFetch = global.fetch;
const originalWindow = global.window;

const poolGetMock = vi.fn();
const fetchPayDataMock = vi.fn();
const requestInvoiceMock = vi.fn();
let sendPaymentMock: ReturnType<typeof vi.fn>;
let signEventMock: ReturnType<typeof vi.fn>;

vi.mock('./useAuth', () => ({
  useAuth: () => ({
    state: {
      status: 'ready',
      pubkey: 'pk',
      signer: {
        signEvent: signEventMock,
      },
    },
  }),
}));

vi.mock('@/lib/relayPool', () => ({
  default: {
    get: (...args: any[]) => poolGetMock(...args),
    publish: () => ({} as any),
  },
}));

vi.mock('../utils/lnurl', () => ({
  fetchPayData: (...args: any[]) => fetchPayDataMock(...args),
  requestInvoice: (...args: any[]) => requestInvoiceMock(...args),
}));

import useLightning from './useLightning';

describe('useLightning', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    sendPaymentMock = vi.fn();
    signEventMock = vi.fn(async (e: any) => ({
      ...e,
      id: 'id',
      sig: 'sig',
      pubkey: 'pk',
    }));
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
    if (originalWindow && originalWindow.open) {
      window.open = originalWindow.open;
    } else {
      // @ts-ignore
      delete window.open;
    }
    // Remove injected webln to avoid cross-test contamination
    // @ts-ignore
    delete window.webln;

    process.env.NEXT_PUBLIC_TREASURY_LNADDR = originalEnv;
    vi.unstubAllGlobals();
    global.fetch = originalFetch;
    if (originalWindow) {
      global.window = originalWindow;
    } else {
      // @ts-ignore
      delete (global as any).window;
    }
  });

  it('splits zap using event zap tags', async () => {
    poolGetMock.mockResolvedValueOnce({
      tags: [
        ['zap', 'user@example.com', '85'],
        ['zap', 'col@example.com', '10'],
      ],
    });

    process.env.NEXT_PUBLIC_TREASURY_LNADDR = 'treasury@example.com';

    fetchPayDataMock.mockResolvedValue({ pay: 'data' });
    requestInvoiceMock.mockResolvedValue({ invoice: 'invoice' });

    const { createZap } = useLightning();
    const { invoices } = await createZap({
      lightningAddress: 'user@example.com',
      amount: 100,
      eventId: 'note',
      pubkey: 'pk',
    });

    expect(poolGetMock).toHaveBeenCalledTimes(1);
    expect(invoices.length).toBe(3);
    expect(fetchPayDataMock).toHaveBeenCalledTimes(3);
    expect(requestInvoiceMock).toHaveBeenCalledTimes(3);
    expect(sendPaymentMock).toHaveBeenCalledTimes(3);
  });

  it('falls back to metadata splits when event has none', async () => {
    poolGetMock
      .mockResolvedValueOnce({ tags: [] })
      .mockResolvedValueOnce({
        content: JSON.stringify({ zapSplits: [{ lnaddr: 'col@example.com', pct: 10 }] }),
      });

    process.env.NEXT_PUBLIC_TREASURY_LNADDR = 'treasury@example.com';

    fetchPayDataMock.mockResolvedValue({ pay: 'data' });
    requestInvoiceMock.mockResolvedValue({ invoice: 'invoice' });

    const { createZap } = useLightning();
    const { invoices } = await createZap({
      lightningAddress: 'user@example.com',
      amount: 100,
      eventId: 'note',
      pubkey: 'pk',
    });

    expect(poolGetMock).toHaveBeenCalledTimes(2);
    expect(invoices.length).toBe(3);
    expect(fetchPayDataMock).toHaveBeenCalledTimes(3);
    expect(requestInvoiceMock).toHaveBeenCalledTimes(3);
    expect(sendPaymentMock).toHaveBeenCalledTimes(3);
  });

  it('does not throw when alert is absent', async () => {
    signEventMock.mockRejectedValueOnce(new Error('fail'));

    fetchPayDataMock.mockResolvedValue({ pay: 'data' });
    requestInvoiceMock.mockResolvedValue({ invoice: 'invoice' });
    poolGetMock.mockResolvedValueOnce(null);
    delete process.env.NEXT_PUBLIC_TREASURY_LNADDR;

    const { createZap } = useLightning();

    await expect(
      createZap({ lightningAddress: 'user@example.com', amount: 100, pubkey: 'pk' }),
    ).resolves.toEqual({ invoices: ['invoice'] });
  });

  it('throws if collaborator splits exceed 95%', async () => {
    poolGetMock
      .mockResolvedValueOnce({ tags: [] })
      .mockResolvedValueOnce({
        content: JSON.stringify({ zapSplits: [{ lnaddr: 'col@example.com', pct: 96 }] }),
      });

    process.env.NEXT_PUBLIC_TREASURY_LNADDR = 'treasury@example.com';

    fetchPayDataMock.mockResolvedValue({ pay: 'data' });
    requestInvoiceMock.mockResolvedValue({ invoice: 'invoice' });

    const { createZap } = useLightning();

    await expect(
      createZap({
        lightningAddress: 'user@example.com',
        amount: 100,
        eventId: 'note',
        pubkey: 'pk',
      }),
    ).rejects.toThrow('Collaborator percentage exceeds 95%');

    expect(fetchPayDataMock).not.toHaveBeenCalled();
    expect(requestInvoiceMock).not.toHaveBeenCalled();
  });
});

