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
  if (typeof window !== 'undefined') {
    window.open(`lightning:${invoice}`);
  }
  return { invoice, result: invoiceData };
}
