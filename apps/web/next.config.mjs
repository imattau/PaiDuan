import withPWA from 'next-pwa';

const runtimeCaching = [
  {
    urlPattern: /^\/$/,
    handler: 'NetworkFirst',
  },
  {
    urlPattern: /^\/feed/,
    handler: 'NetworkFirst',
  },
  {
    urlPattern: /^\/settings/,
    handler: 'NetworkFirst',
  },
  {
    urlPattern: /^\/p\/.*/,
    handler: 'NetworkFirst',
  },
  {
    urlPattern: /^\/v\/.*/,
    handler: 'NetworkFirst',
  },
  {
    urlPattern: /.*\.(webm|jpg)$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'media',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      },
    },
  },
  {
    urlPattern: /avatar/,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'avatars',
      expiration: {
        maxEntries: 50,
      },
    },
  },
];

const nextConfig = {
  pwa: {
    dest: 'public',
    runtimeCaching,
    skipWaiting: true,
    register: true,
    fallbacks: {
      document: '/offline.html',
    },
  },
};

export default withPWA(nextConfig);
