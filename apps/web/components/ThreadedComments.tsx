'use client';

import { useEffect, useState } from 'react';
import type { Event } from 'nostr-tools/pure';
import { getPool, getRelays } from '@/lib/nostr';

export default function ThreadedComments({ noteId }: { noteId?: string }) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!noteId) return;
    const pool = getPool();
    setEvents([]);
    const sub = pool.subscribeMany(getRelays(), [{ kinds: [1], '#e': [noteId] }], {
      onevent: (ev: Event) =>
        setEvents((prev) =>
          prev.find((e) => e.id === ev.id)
            ? prev
            : [...prev, ev].sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0))
        ),
    });
    return () => sub.close();
  }, [noteId]);

  if (!noteId) return null;

  return (
    <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-3">
      <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Comments</h3>
      {events.length === 0 ? (
        <p className="text-xs text-gray-600 dark:text-gray-400">Thread will render here.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((ev) => (
            <li key={ev.id} className="text-sm text-gray-800 dark:text-gray-200">
              {ev.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

