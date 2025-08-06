import { SimplePool } from 'nostr-tools';

interface ZapArgs {
  lightningAddress: string;
  amount: number;
  comment?: string;
  eventId?: string;
  pubkey?: string;
}

export default function useLightning() {
  const pool = new SimplePool();

  const createZap = async ({ lightningAddress, amount, comment, eventId, pubkey }: ZapArgs) => {
    const [name, domain] = lightningAddress.split('@');
    const payRes = await fetch(`https://${domain}/.well-known/lnurlp/${name}`);
    const payData = await payRes.json();
    const callback: string = payData.callback;

    const invoiceRes = await fetch(`${callback}?amount=${amount * 1000}&comment=${encodeURIComponent(comment ?? '')}`);
    const invoiceData = await invoiceRes.json();
    const invoice: string = invoiceData.pr;

    if (typeof window !== 'undefined') {
      window.location.href = `lightning:${invoice}`;
    }

    if (pubkey && typeof window !== 'undefined' && (window as any).nostr) {
      try {
        const event: any = {
          kind: 9735,
          created_at: Math.floor(Date.now() / 1000),
          tags: [
            ...(eventId ? [["e", eventId]] : []),
            ["p", pubkey],
            ["amount", String(amount * 1000)],
          ],
          content: comment ?? '',
        };
        const signed = await (window as any).nostr.signEvent(event);
        console.log('zap receipt', signed);
        pool.publish(['wss://relay.damus.io', 'wss://nos.lol'], signed);
      } catch (err) {
        console.error(err);
      }
    }

    return { invoice, result: invoiceData };
  };

  return { createZap };
}
