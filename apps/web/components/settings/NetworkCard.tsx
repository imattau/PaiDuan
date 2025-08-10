"use client";

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { useRelays } from '@/hooks/useRelays';

export function NetworkCard() {
  const { relays, addRelay, removeRelay } = useRelays();
  const [input, setInput] = useState('');

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

