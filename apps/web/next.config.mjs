import withPWA from 'next-pwa'
import runtimeCaching from 'next-pwa/cache.js'

const isProd = process.env.NODE_ENV === 'production'

const withPWAConfig = withPWA({
  dest: 'public',
  disable: !isProd,
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/],
  fallbacks: {
    image: '/offline.jpg',
    document: '/offline.html'
  }
})

export default withPWAConfig({
  reactStrictMode: true,
  experimental: { appDir: false },
  typescript: { ignoreBuildErrors: true }
})
