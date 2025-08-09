try {
  // Use a relative path so the service worker can locate the bundled
  // Workbox script regardless of the deployment base path.
  importScripts('./workbox-sw.js');
} catch (err) {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');
}

workbox.loadModule('workbox-routing');
workbox.loadModule('workbox-strategies');
workbox.loadModule('workbox-background-sync');

self.addEventListener('install', () => {
  const manifest = (self.__WB_MANIFEST || []).filter(
    (entry) => !/app-build-manifest\.json$/.test(entry.url),
  );
  workbox.precaching.precacheAndRoute(manifest);
});

const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('apiQueue', {
  maxRetentionTime: 24 * 60,
});

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({ cacheName: 'api-runtime' }),
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
  new workbox.strategies.CacheFirst({ cacheName: 'video-cache' }),
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
  event.waitUntil(clients.openWindow(url));
});
