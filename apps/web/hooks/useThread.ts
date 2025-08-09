'use client';
import { useEffect, useRef, useState } from 'react';
import { Event, type Filter, finalizeEvent } from 'nostr-tools';
import * as nostrKinds from 'nostr-tools/kinds';
import { getRelays, getMyPrivkey, getMyPubkey } from '@/lib/nostr';
import pool from '@/lib/relayPool';

type Note = {
  id: string;
  pubkey: string;
  created_at: number;
  content: string;
  replyTo?: string;
};

function parseThread(events: Event[]): Note[] {
  // Basic flat thread (parent first) – order by created_at asc
  // Replies: kind-1 with an 'e' tag referencing root or parent
  const sorted = [...events].sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));
  return sorted.map((ev) => {
    const eTag = ev.tags.find(([t]) => t === 'e');
    const replyTo = eTag?.[1];
    return {
      id: ev.id,
      pubkey: ev.pubkey,
      created_at: ev.created_at ?? 0,
      content: ev.content,
      replyTo,
    };
  });
}

export function useThread(rootEventId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const subRef = useRef<() => void>();

  useEffect(() => {
    if (!rootEventId) return;
    setLoading(true);
    setErr(null);
    setNotes([]);

    // Filters: all kind-1 notes that reference rootEventId in 'e' tag
    const evs: Event[] = [];
    const filters: Filter[] = [{ kinds: [nostrKinds.ShortTextNote], '#e': [rootEventId], limit: 200 }];

    const sub = pool.subscribeMany(getRelays(), filters, {
      onevent: (ev: Event) => {
        evs.push(ev);
        setNotes(parseThread(evs));
      },
      oneventOK: () => {},
      onerror: (e) => {
        console.error(e);
        setErr('Subscription error');
      },
      oneose: () => setLoading(false),
    });

    subRef.current = () => sub.close();
    return () => sub.close();
  }, [rootEventId]);

  async function send(content: string, parentId?: string) {
    const sk = getMyPrivkey();
    const pk = getMyPubkey();
    if (!sk || !pk) throw new Error('No key – user must be logged in.');

    const now = Math.floor(Date.now() / 1000);
    const tags = [] as string[][];
    // Threading: include 'e' tag referencing root note (or parent)
    if (rootEventId) tags.push(['e', rootEventId]);
    if (parentId && parentId !== rootEventId) tags.push(['e', parentId]);

    const draft = {
      kind: nostrKinds.ShortTextNote,
      created_at: now,
      tags,
      content,
      pubkey: pk,
    };

    const ev = finalizeEvent(draft, sk);
    // optimistic
    setNotes((prev) => [
      ...prev,
      {
        id: ev.id,
        pubkey: ev.pubkey,
        created_at: ev.created_at!,
        content: ev.content,
        replyTo: parentId || rootEventId,
      },
    ]);

    await pool.publish(getRelays(), ev);
    return ev.id;
  }

  return { notes, loading, err, send };
}
