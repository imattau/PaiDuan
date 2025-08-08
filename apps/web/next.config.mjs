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
  experimental: { esmExternals: 'loose' },
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@paiduan/ui']
})
