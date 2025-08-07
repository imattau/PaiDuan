import { signEvent as localSign, Event as NostrEvent } from 'nostr-tools';

interface AuthInfo {
  pubkey: string;
  privkey?: string;
  method: string;
}

export async function signWithAuth(event: NostrEvent, auth: AuthInfo | null) {
  if (auth?.method === 'nip07' && (window as any)?.nostr?.signEvent) {
    return await (window as any).nostr.signEvent(event);
  } else if (auth?.privkey) {
    return localSign(event, auth.privkey);
  } else {
    throw new Error('No signing method available.');
  }
}
