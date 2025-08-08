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
