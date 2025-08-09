try {
  importScripts('/workbox-sw.js');
} catch (err) {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');
}

self.addEventListener('install', () => {
  const manifest = (self.__WB_MANIFEST || []).filter(
    (entry) => !/app-build-manifest\.json$/.test(entry.url),
  );
  workbox.precaching.precacheAndRoute(manifest);
});

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
