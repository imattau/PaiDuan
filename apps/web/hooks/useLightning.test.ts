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

const fetchPayDataMock = vi.fn();
const requestInvoiceMock = vi.fn();
vi.mock('@/utils/lnurl', () => ({
  fetchPayData: (...args: any[]) => fetchPayDataMock(...args),
  requestInvoice: (...args: any[]) => requestInvoiceMock(...args),
}));

import useLightning from './useLightning';

const originalWindow = global.window;

describe('useLightning', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => {
    global.window = originalWindow;
  });

  it('splits zap using event zap tags', async () => {
    poolGetMock.mockResolvedValueOnce({
      tags: [
        ['zap', 'user@example.com', '85'],
        ['zap', 'col@example.com', '10'],
      ],
    });

    process.env.NEXT_PUBLIC_TREASURY_LNADDR = 'treasury@example.com';
    fetchPayDataMock
      .mockResolvedValueOnce({ callback: 'https://cb1' })
      .mockResolvedValueOnce({ callback: 'https://cb2' })
      .mockResolvedValueOnce({ callback: 'https://cb3' });
    requestInvoiceMock
      .mockResolvedValueOnce({ invoice: 'inv1' })
      .mockResolvedValueOnce({ invoice: 'inv2' })
      .mockResolvedValueOnce({ invoice: 'inv3' });
    const sendPaymentMock = vi.fn();
    // @ts-ignore
    global.window = {
      webln: { sendPayment: sendPaymentMock },
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
    fetchPayDataMock
      .mockResolvedValueOnce({ callback: 'https://cb1' })
      .mockResolvedValueOnce({ callback: 'https://cb2' })
      .mockResolvedValueOnce({ callback: 'https://cb3' });
    requestInvoiceMock
      .mockResolvedValueOnce({ invoice: 'inv1' })
      .mockResolvedValueOnce({ invoice: 'inv2' })
      .mockResolvedValueOnce({ invoice: 'inv3' });
    const sendPaymentMock = vi.fn();
    // @ts-ignore
    global.window = {
      webln: { sendPayment: sendPaymentMock },
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
    expect(fetchPayDataMock).toHaveBeenCalledTimes(3);
    expect(requestInvoiceMock).toHaveBeenCalledTimes(3);
    expect(sendPaymentMock).toHaveBeenCalledTimes(3);
  });
});
