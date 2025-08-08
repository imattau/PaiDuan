import { useNostrAuth } from '../hooks/useNostrAuth'

export function NostrLogin() {
  const { remoteSignerLogin, importKey, generateKey } = useNostrAuth()

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      <button
        className="px-4 py-2 rounded-xl border bg-white/80 text-gray-900 dark:bg-neutral-900/80 dark:text-gray-100"
        onClick={remoteSignerLogin}
      >
        🔗 Remote Sign-In (NIP-46/NIP-07)
      </button>

      <button
        className="px-4 py-2 rounded-xl border bg-white/80 text-gray-900 dark:bg-neutral-900/80 dark:text-gray-100"
        onClick={importKey}
      >
        📥 Import Nostr Key
      </button>

      <button
        className="px-4 py-2 rounded-xl border bg-yellow-100/70 hover:bg-yellow-100 text-gray-900"
        onClick={generateKey}
      >
        ✨ Generate New Key
      </button>
    </div>
  )
}
