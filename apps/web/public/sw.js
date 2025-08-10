// Load locally bundled Workbox to ensure service worker availability offline.
importScripts('./workbox-sw.js');

workbox.loadModule('workbox-routing');
workbox.loadModule('workbox-strategies');
workbox.loadModule('workbox-background-sync');
workbox.loadModule('workbox-core');
workbox.loadModule('workbox-expiration');

const CACHE_VERSION = 'v3';

workbox.core.setCacheNameDetails({
  prefix: 'workbox',
  suffix: CACHE_VERSION,
});

self.addEventListener('install', () => {
  self.skipWaiting();
  const manifest = (self.__WB_MANIFEST || []).filter(
    (entry) => !/app-build-manifest\.json$/.test(entry.url),
  );
  try {
    workbox.precaching.precacheAndRoute(manifest);
    workbox.precaching.cleanupOutdatedCaches();
  } catch (err) {
    console.warn('Precache manifest missing entries', err);
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.includes(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

workbox.core.clientsClaim();

const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin(
  `apiQueue-${CACHE_VERSION}`,
  {
    maxRetentionTime: 24 * 60,
  },
);

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: `api-runtime-${CACHE_VERSION}`,
  }),
);

['POST', 'PUT'].forEach((method) => {
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkOnly({ plugins: [bgSyncPlugin] }),
    method,
  );
});

workbox.routing.registerRoute(
  ({ url }) => /\.(?:mp4|webm)$/.test(url.pathname),
  new workbox.strategies.CacheFirst({
    cacheName: `video-cache-${CACHE_VERSION}`,
  }),
);

workbox.routing.registerRoute(
  ({ url }) => /\.(?:m4s|ts)$/.test(url.pathname),
  new workbox.strategies.CacheFirst({
    cacheName: `segment-cache-${CACHE_VERSION}`,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 5 * 60,
      }),
    ],
  }),
);

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PaiDuan';
  const options = {
    body: data.body,
    icon: '/icons/icon-192.svg',
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url =
    event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === url || client.url.startsWith(url)) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
