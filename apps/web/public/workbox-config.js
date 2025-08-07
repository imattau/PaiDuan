module.exports = {
  globDirectory: 'public/',
  globPatterns: ['**/*.{js,css,html,png,jpg,webm,json,svg}'],
  runtimeCaching: [
    { urlPattern: /^https?.*\.(webm|mp4)$/, handler: 'CacheFirst' },
    { urlPattern: /^https?.*\.(jpg|jpeg|png|gif|svg)$/, handler: 'StaleWhileRevalidate' },
    { urlPattern: /^https?.*nostr\.media.*$/, handler: 'NetworkFirst' }
  ]
}
