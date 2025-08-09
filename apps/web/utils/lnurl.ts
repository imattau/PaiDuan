export interface PayData {
  callback: string;
  [key: string]: any;
}

export async function fetchPayData(address: string): Promise<PayData> {
  const [name, domain] = address.split('@');
  if (!name || !domain) {
    throw new Error('Invalid lightning address');
  }
  const res = await fetch(`https://${domain}/.well-known/lnurlp/${name}`);
  if (!res.ok) {
    throw new Error('Failed to fetch LNURL data');
  }
  return (await res.json()) as PayData;
}

export async function requestInvoice(
  payData: PayData,
  sats: number,
  comment?: string,
): Promise<{ invoice: string; result: any }>
{
  if (!payData.callback) {
    throw new Error('Missing callback');
  }
  const url = `${payData.callback}?amount=${sats * 1000}&comment=${encodeURIComponent(comment ?? '')}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to request invoice');
  }
  const invoiceData = await res.json();
  const invoice: string = invoiceData.pr;
  return { invoice, result: invoiceData };
}

export async function authenticate(address: string): Promise<void> {
  const [, domain] = address.split('@');
  if (!domain) throw new Error('Invalid lightning address');
  const res = await fetch(`https://${domain}/.well-known/lnurl-login`);
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
