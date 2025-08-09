const DB_NAME = 'nostr-cache';
const DB_VERSION = 1;
const STORE_EVENTS = 'events';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_EVENTS)) {
          db.createObjectStore(STORE_EVENTS, { keyPath: ['pubkey', 'id'] });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

export async function saveEvent(event: any): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EVENTS, 'readwrite');
    tx.objectStore(STORE_EVENTS).put({ id: event.id, pubkey: event.pubkey, event });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getEventsByPubkey(pubkey: string): Promise<any[]> {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EVENTS, 'readonly');
    const range = IDBKeyRange.bound([pubkey, ''], [pubkey, '\uffff']);
    const req = tx.objectStore(STORE_EVENTS).getAll(range);
    req.onsuccess = () => {
      const res = req.result as { event: any }[];
      resolve(res.map((r) => r.event));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAllEvents(): Promise<any[]> {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EVENTS, 'readonly');
    const req = tx.objectStore(STORE_EVENTS).getAll();
    req.onsuccess = () => {
      const res = req.result as { event: any }[];
      resolve(res.map((r) => r.event));
    };
    req.onerror = () => reject(req.error);
  });
}
