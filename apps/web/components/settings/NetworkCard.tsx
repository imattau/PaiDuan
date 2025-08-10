import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { getRelays, normalizeRelay } from '@/lib/nostr';

export function NetworkCard() {
  const [relays, setRelays] = useState<string[]>(() => getRelays());
  const [input, setInput] = useState('');

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
    const normalized = normalizeRelay(url.trim());
    if (!normalized) return;
    setRelays((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
  }

  function removeRelay(url: string) {
    setRelays((prev) => prev.filter((r) => r !== url));
  }

  const handleAdd = () => {
    addRelay(input);
    setInput('');
  };

  return (
    <Card title="Network" desc="Configure relay connections.">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="wss://relay.example.com"
            className="flex-1 rounded bg-text-primary/10 p-2 text-sm outline-none"
          />
          <button type="button" onClick={handleAdd} className="btn btn-outline">
            Add
          </button>
        </div>
        {relays.length > 0 ? (
          <ul className="space-y-1">
            {relays.map((r) => (
              <li
                key={r}
                className="flex items-center justify-between rounded bg-text-primary/5 px-2 py-1 text-sm"
              >
                <span className="break-all">{r}</span>
                <button
                  onClick={() => removeRelay(r)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted">No relays configured.</div>
        )}
      </div>
    </Card>
  );
}

export default NetworkCard;

