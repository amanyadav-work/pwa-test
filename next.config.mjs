/** @type {import('next').NextConfig} */
import withPWAInit from 'next-pwa';
import defaultRuntimeCaching from 'next-pwa/cache.js';

const customRuntimeCaching = [
  ...defaultRuntimeCaching,

  // Cache your Next.js pages explicitly
  {
    urlPattern: /^\/(consult|dashboard|demo)$/, // Add all your route names here
    handler: 'NetworkFirst',
    options: {
      cacheName: 'pages-cache',
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
      },
      cacheableResponse: {
        statuses: [200],
      },
    },
  },

  // General navigation (refreshing pages)
  {
    urlPattern: /^https?.*/, // Catch all HTTP(S) requests
    handler: 'NetworkFirst',
    options: {
      cacheName: 'html-cache',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      },
      networkTimeoutSeconds: 3,
      cacheableResponse: {
        statuses: [200],
      },
    },
  },
];

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: customRuntimeCaching,
  fallbacks: {
    document: '/offline.html',
  },
  buildExcludes: [/middleware-manifest\.json$/],
  maximumFileSizeToCacheInBytes: 80 * 1024 * 1024, // 80 MB
});

const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
