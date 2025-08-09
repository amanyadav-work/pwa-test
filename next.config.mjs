import withPWAInit from "next-pwa";
import runtimeCaching from "next-pwa/cache.js";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  maximumFileSizeToCacheInBytes: 80 * 1024 * 1024,
  runtimeCaching: [
    ...runtimeCaching,
    {
      urlPattern: /^\/consult$/,
      handler: "NetworkFirst", // Tries network first, falls back to cache
      options: {
        cacheName: "consult-page",
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 60 * 60 * 24 * 7, // cache for 1 week
        },
      },
    },
    {
      urlPattern: /^\/model\.tar\.gz$/,
      handler: "CacheFirst",
      options: {
        cacheName: "vosk-model-cache",
        expiration: {
          maxEntries: 1,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
  fallbacks: {
    document: "/offline.html",
  },
});

export default withPWA({
   reactStrictMode: false,
});
