import { relayInit } from 'nostr-tools'

export async function useRemoteSigner(relayURL: string, pubkey: string) {
  const relay = relayInit(relayURL)
  await relay.connect()

  return {
    sign: async (event: any) => {
      return new Promise((resolve, reject) => {
        const id = crypto.randomUUID()
        relay.subscribe([{ kinds: [24133], authors: [pubkey] }])

        relay.publish({
          kind: 24133,
          pubkey,
          tags: [['client', 'PaiDuan']],
          content: JSON.stringify({ id, event }),
          created_at: Math.floor(Date.now() / 1000),
        })

        const timeout = setTimeout(() => reject('Timeout'), 5000)
        relay.on('event', (e) => {
          const data = JSON.parse(e.content)
          if (data.id === id) {
            clearTimeout(timeout)
            resolve(data.signedEvent)
          }
        })
      })
    }
  }
}
