const CACHE_NAME = 'profile-pictures';
const TTL = 1000 * 60 * 5; // 5 minutes

// Hosts that explicitly allow cross-origin image caching.
// Add domains here to permit caching from those origins.
const TRUSTED_HOSTS: string[] = [];

async function openCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

export async function cacheImage(url: string): Promise<string> {
  const cache = await openCache();
  if (!cache) return url;
  try {
    const locOrigin = typeof location !== 'undefined' ? location.origin : '';
    const parsed = locOrigin ? new URL(url, locOrigin) : new URL(url);
    if (locOrigin && parsed.origin !== locOrigin) {
      if (!TRUSTED_HOSTS.includes(parsed.hostname)) {
        url = `/api/image-proxy?url=${encodeURIComponent(url)}`;
      }
    } else if (TRUSTED_HOSTS.length && !TRUSTED_HOSTS.includes(parsed.hostname)) {
      return url;
    }

    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok || res.type !== 'basic') return url;

    const now = Date.now();
    const blob = await res.blob();
    const headers = new Headers(res.headers);
    headers.set('X-Cache-Time', String(now));
    const ct = res.headers.get('Content-Type') || 'application/octet-stream';
    headers.set('Content-Type', ct);
    const response = new Response(blob, { headers });
    await cache.put(url, response);
    return URL.createObjectURL(blob);
  } catch {
    return url;
  }
}

export async function getCachedImage(url: string): Promise<string | null> {
  const cache = await openCache();
  if (!cache) return null;
  const res = await cache.match(url);
  if (!res) return null;
  const ts = parseInt(res.headers.get('X-Cache-Time') || '0', 10);
  if (!ts || Date.now() - ts > TTL) {
    await cache.delete(url);
    return null;
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function cleanupImageCache(): Promise<void> {
  const cache = await openCache();
  if (!cache) return;
  const requests = await cache.keys();
  await Promise.all(
    requests.map(async (req) => {
      const res = await cache.match(req);
      if (!res) return;
      const ts = parseInt(res.headers.get('X-Cache-Time') || '0', 10);
      if (!ts || Date.now() - ts > TTL) {
        await cache.delete(req);
      }
    }),
  );
}

if (typeof window !== 'undefined' && 'caches' in window) {
  void cleanupImageCache();
  setInterval(() => void cleanupImageCache(), TTL);
}

export const IMAGE_CACHE_TTL = TTL;
