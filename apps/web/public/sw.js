// Use a locally hosted Workbox bundle to avoid CDN failures that broke the
// service worker registration in some environments.
// See https://github.com/GoogleChrome/workbox/issues/3000 for context.
// The file is copied during build to `/workbox-sw.js` in the public folder.
// Keep the version in sync with package.json (currently 7.3.0).
importScripts('/workbox-sw.js');

self.addEventListener('install', () => {
  const manifest = (self.__WB_MANIFEST || []).filter(
    (entry) => !/app-build-manifest\.json$/.test(entry.url)
  );
  workbox.precaching.precacheAndRoute(manifest);
});

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PaiDuan';
  const options = {
    body: data.body,
    icon: '/icons/icon-192.svg',
    data: data.data || {}
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(clients.openWindow(url));
});
