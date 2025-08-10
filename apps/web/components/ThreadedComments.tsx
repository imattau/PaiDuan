'use client';

import { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Event } from 'nostr-tools/pure';
import { getRelays } from '@/lib/nostr';
import pool from '@/lib/relayPool';

export default function ThreadedComments({ noteId }: { noteId?: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const parentRef = useRef<HTMLUListElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  useEffect(() => {
    if (!noteId) return;
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
        <ul ref={parentRef} className="max-h-96 overflow-auto relative">
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <li
                key={events[virtualRow.index].id}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                className="absolute top-0 left-0 w-full text-sm text-gray-800 dark:text-gray-200"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  height: `${virtualRow.size}px`,
                }}
              >
                {events[virtualRow.index].content}
              </li>
            ))}
          </div>
        </ul>
      )}
    </div>
  );
}
