/** @type {import('next').NextConfig} */
import withPWAInit from "next-pwa";
import runtimeCaching from "next-pwa/cache.js"; // Default good config

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  runtimeCaching,
  fallbacks: {
    document: "/offline.html",
  },
  buildExcludes: [/middleware-manifest\.json$/],
  maximumFileSizeToCacheInBytes: 80 * 1024 * 1024, // 10 MB
});

const nextConfig = {
  // Your other Next.js config (if any)
};

export default withPWA(nextConfig);
