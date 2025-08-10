import { useEffect, useState } from 'react';
import { getRelays } from '@/lib/nostr';

export function useRelays() {
  const [relays, setRelays] = useState<string[]>(() => getRelays());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('pd.relays', JSON.stringify(relays));
      window.dispatchEvent(new CustomEvent('pd.relays', { detail: relays }));
    } catch {
      /* ignore */
    }
  }, [relays]);

  function addRelay(url: string) {
    const next = url.trim();
    if (!next) return;
    setRelays((prev) => (prev.includes(next) ? prev : [...prev, next]));
  }

  function removeRelay(url: string) {
    setRelays((prev) => prev.filter((r) => r !== url));
  }

  return { relays, addRelay, removeRelay };
}

export default useRelays;
