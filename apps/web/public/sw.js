const STATIC_CACHE = 'static-v1';
const AVATAR_CACHE = 'avatars-v1';
const API_CACHE = 'api-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(['/offline.html']))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  if (
    url.origin === self.location.origin &&
    ['style', 'script', 'image'].includes(request.destination)
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(request).then((res) => {
          return (
            res ||
            fetch(request).then((response) => {
              cache.put(request, response.clone());
              return response;
            })
          );
        })
      )
    );
    return;
  }

  if (
    request.destination === 'image' ||
    /\.(jpg|jpeg|webm)$/.test(url.pathname) ||
    url.pathname.includes('avatar')
  ) {
    event.respondWith(
      caches.open(AVATAR_CACHE).then((cache) =>
        cache.match(request).then((res) => {
          const fetchPromise = fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
          return res || fetchPromise;
        })
      )
    );
    return;
  }

  if (url.pathname.startsWith('/api') || url.hostname.includes('relay')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.open(API_CACHE).then((cache) => cache.match(request)))
    );
  }
});
