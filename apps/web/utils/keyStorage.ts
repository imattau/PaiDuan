export function saveKey({ pubkey, privkey, method }: { pubkey: string; privkey?: string; method: string }) {
  localStorage.setItem('nostr-auth', JSON.stringify({ pubkey, privkey, method }));
}

export function getStoredKey(): { pubkey: string; privkey?: string; method: string } | null {
  const data = localStorage.getItem('nostr-auth');
  return data ? JSON.parse(data) : null;
}

export function clearKey() {
  localStorage.removeItem('nostr-auth');
}
