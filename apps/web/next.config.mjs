import withPWA from 'next-pwa';
import runtimeCaching from 'next-pwa/cache.js';
import createNextIntlPlugin from 'next-intl/plugin';

const isProd = process.env.NODE_ENV === 'production';

const baseConfig = {
  experimental: { esmExternals: 'loose' },
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  transpilePackages: ['@paiduan/ui'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async headers() {
    const headers = [];

    // Enable cross-origin isolation only when explicitly allowed.
    // In development, isolation stays off unless ENABLE_ISOLATION=true.
    // In production, it is on by default but can be disabled via
    // ENABLE_ISOLATION=false.
    const enableIsolation =
      process.env.NODE_ENV === 'production'
        ? process.env.ENABLE_ISOLATION !== 'false'
        : process.env.ENABLE_ISOLATION === 'true';

    if (enableIsolation) {
      headers.push({
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      });
    }

    headers.push({
      source: '/(.*)\\.(png|jpg|jpeg|gif|svg|webp|webm)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    });

    return headers;
  },
  async redirects() {
    return [
      {
        source: '/en/onboarding/:path*',
        destination: '/onboarding/:path*',
        permanent: false,
      },
    ];
  },
};

const withPWAConfig = withPWA({
  dest: 'public',
  runtimeCaching,
  buildExcludes: [/middleware-manifest\.json$/],
  fallbacks: {
    image: '/offline.jpg',
    document: '/offline.html',
  },
});

const withNextIntl = createNextIntlPlugin();

const config = isProd ? withPWAConfig(baseConfig) : baseConfig;

export default withNextIntl(config);
