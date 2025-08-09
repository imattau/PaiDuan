import Dexie, { type Table } from 'dexie';

interface StoredEvent {
  id: string;
  pubkey: string;
  event: any;
}

class NostrCacheDB extends Dexie {
  events!: Table<StoredEvent, [string, string]>;

  constructor() {
    super('nostr-cache');
    this.version(1).stores({
      events: '[pubkey+id]',
    });
  }
}

export const db =
  typeof indexedDB === 'undefined' ? null : new NostrCacheDB();

export async function saveEvent(event: any): Promise<void> {
  if (!db) return;
  try {
    await db.events.add({ id: event.id, pubkey: event.pubkey, event });
  } catch (err: any) {
    if (err?.name !== 'ConstraintError') throw err;
  }
}

export async function getEventsByPubkey(pubkey: string): Promise<any[]> {
  if (!db) return [];
  const rows = await db.events
    .where('[pubkey+id]')
    .between([pubkey, Dexie.minKey], [pubkey, Dexie.maxKey])
    .toArray();
  return rows.map((r) => r.event);
}

export async function getAllEvents(): Promise<any[]> {
  if (!db) return [];
  const rows = await db.events.toArray();
  return rows.map((r) => r.event);
}

