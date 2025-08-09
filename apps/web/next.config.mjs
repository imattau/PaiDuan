import withPWA from 'next-pwa';
import runtimeCaching from 'next-pwa/cache.js';

const isProd = process.env.NODE_ENV === 'production';

const baseConfig = {
  experimental: { esmExternals: 'loose' },
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@paiduan/ui'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
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

export default isProd ? withPWAConfig(baseConfig) : baseConfig;
