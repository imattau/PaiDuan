import {
  requestPayServiceParams,
  requestInvoiceWithServiceParams,
  utils,
} from 'lnurl-pay';
import type {
  LnUrlPayServiceResponse,
  LnUrlRequestInvoiceResponse,
} from 'lnurl-pay';

export type PayData = LnUrlPayServiceResponse;

export async function fetchPayData(address: string): Promise<PayData> {
  return requestPayServiceParams({ lnUrlOrAddress: address });
}

export async function requestInvoice(
  payData: PayData,
  sats: number,
  comment?: string,
): Promise<LnUrlRequestInvoiceResponse> {
  return requestInvoiceWithServiceParams({
    params: payData,
    tokens: sats,
    comment,
  });
}

export async function authenticate(address: string): Promise<void> {
  const parsed = utils.parseLightningAddress(address);
  if (!parsed) throw new Error('Invalid lightning address');
  const protocol = parsed.domain.match(/\.onion$/) ? 'http' : 'https';
  const res = await fetch(
    `${protocol}://${parsed.domain}/.well-known/lnurl-login`,
  );
  if (!res.ok) throw new Error('Failed to fetch LNURL-auth');
  const lnurl = await res.text();
  if (typeof window !== 'undefined') {
    const w: any = window as any;
    if (w.webln && typeof w.webln.lnurlAuth === 'function') {
      await w.webln.lnurlAuth(lnurl);
    } else {
      w.open(lnurl);
    }
  }
}
