import { useNostrAuth } from '../../../../apps/web/hooks/useNostrAuth';

export function NostrLogin() {
  const { signInWithExtension, importKey, generateKey } = useNostrAuth();

  return (
    <div className="flex flex-col gap-4 p-4">
      <button onClick={signInWithExtension}>🔑 Sign in with Extension</button>
      <button onClick={importKey}>📥 Import Nostr Key</button>
      <button onClick={generateKey}>✨ Generate New Key</button>
    </div>
  );
}
