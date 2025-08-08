import { finalizeEvent } from 'nostr-tools'
import { hexToBytes } from '@noble/hashes/utils'
import { useRemoteSigner } from '../hooks/useRemoteSigner'

export async function signWithAuth(
  event: any,
  authCtx: { auth: any; privkeyHex?: string | null; bump?: () => void }
) {
  if (authCtx?.auth?.method === 'nip07' && (window as any)?.nostr?.signEvent) {
    const signed = await (window as any).nostr.signEvent(event)
    authCtx.bump?.()
    return signed
  }
  if (authCtx?.auth?.method === 'remote') {
    const { sign } = await useRemoteSigner(authCtx.auth.relay, authCtx.auth.pubkey)
    const signed = await sign(event)
    authCtx.bump?.()
    return signed
  }
  if (authCtx?.privkeyHex) {
    const signed = finalizeEvent(event, hexToBytes(authCtx.privkeyHex))
    authCtx.bump?.()
    return signed
  }
  throw new Error(
    'Can’t sign yet. Unlock with your passphrase or connect a NIP-07 signer.'
  )
}

