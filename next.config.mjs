/** @type {import('next').NextConfig} */
import withPWAInit from "next-pwa";

const nextConfig = {};


const withPWA = withPWAInit({
    dest: "public",
    register: true,
    skipWaiting: true,
    runtimeCaching: [
        {
            urlPattern: /^\/$/,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'start-url',
                expiration: {
                    maxEntries: 1,
                    maxAgeSeconds: 24 * 60 * 60, // 1 day
                },
            },
        },
    ]
});
export default withPWA(nextConfig);