import { signEvent as localSign } from 'nostr-tools';

export async function signWithAuth(
  event: any,
  authCtx: { auth: any; privkeyHex?: string | null }
) {
  if (authCtx?.auth?.method === 'nip07' && (window as any)?.nostr?.signEvent) {
    return await (window as any).nostr.signEvent(event);
  }
  if (authCtx?.privkeyHex) {
    return localSign(event, authCtx.privkeyHex);
  }
  throw new Error(
    'Locked or public-only. Unlock with your passphrase or connect a NIP-07 signer.'
  );
}

