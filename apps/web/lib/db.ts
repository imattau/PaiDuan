import Dexie, { type Table } from 'dexie';

interface StoredEvent {
  id: string;
  pubkey: string;
  event: any;
}

interface StoredComment {
  videoId: string;
  id: string;
  event: any;
  created_at: number;
}

class NostrCacheDB extends Dexie {
  events!: Table<StoredEvent, [string, string]>;
  comments!: Table<StoredComment, [string, string]>;

  constructor() {
    super('nostr-cache');
    this.version(1).stores({
      events: '[pubkey+id]',
    });
    this.version(2).stores({
      events: '[pubkey+id]',
      comments: '[videoId+id], created_at',
    });
  }
}

export const db = typeof indexedDB === 'undefined' ? null : new NostrCacheDB();

const COMMENT_TTL_SECONDS = 60 * 60 * 24;

export async function cleanupOldComments(): Promise<void> {
  if (!db) return;
  const cutoff = Math.floor(Date.now() / 1000) - COMMENT_TTL_SECONDS;
  await db.comments.where('created_at').below(cutoff).delete();
}

if (db) {
  void cleanupOldComments();
  setInterval(cleanupOldComments, COMMENT_TTL_SECONDS * 1000);
}

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

export async function saveComment(videoId: string, event: any): Promise<void> {
  if (!db) return;
  try {
    await db.comments.add({
      videoId,
      id: event.id,
      event,
      created_at: event.created_at,
    });
  } catch (err: any) {
    if (err?.name !== 'ConstraintError') throw err;
  }
}

export async function getCommentsByVideoId(videoId: string): Promise<any[]> {
  if (!db) return [];
  const rows = await db.comments
    .where('[videoId+id]')
    .between([videoId, Dexie.minKey], [videoId, Dexie.maxKey])
    .toArray();
  return rows.map((r) => r.event);
}
