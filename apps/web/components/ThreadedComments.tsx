'use client';

import React, { useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { Event } from 'nostr-tools/pure';
import { getRelays } from '@/lib/nostr';
import pool from '@/lib/relayPool';

const List = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  (props, ref) => <ul {...props} ref={ref} />,
);
List.displayName = 'VirtuosoList';

const Item = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  (props, ref) => (
    <li
      {...props}
      ref={ref}
      className="text-sm text-gray-800 dark:text-gray-200"
    />
  ),
);
Item.displayName = 'VirtuosoItem';

export default function ThreadedComments({ noteId }: { noteId?: string }) {
  const [events, setEvents] = useState<Event[]>([]);

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
        <Virtuoso
          data={events}
          className="max-h-96 overflow-auto"
          components={{ List, Item }}
          itemContent={(index, event) => <>{event.content}</>}
        />
      )}
    </div>
  );
}
