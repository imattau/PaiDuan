import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { getRelays, parseRelays } from '@/lib/nostr';
import relaysConfig from '@/relays.json';

export function NetworkCard() {
  const [relays, setRelays] = useState<string[]>(() => parseRelays(relaysConfig) ?? []);
  const [input, setInput] = useState('');

  // persist relays to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('pd.relays', JSON.stringify(relays));
      window.dispatchEvent(new Event('pd.relays')); // notify listeners
    } catch {
      /* ignore */
    }
  }, [relays]);

  useEffect(() => {
    setRelays(getRelays());
  }, []);

  const addRelay = () => {
    const url = input.trim();
    if (!url || relays.includes(url)) return;
    setRelays((prev) => [...prev, url]);
    setInput('');
  };

  const removeRelay = (url: string) => {
    setRelays((prev) => prev.filter((r) => r !== url));
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
                addRelay();
              }
            }}
            placeholder="wss://relay.example.com"
            className="flex-1 rounded bg-text-primary/10 p-2 text-sm outline-none"
          />
          <button type="button" onClick={addRelay} className="btn btn-outline">
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

