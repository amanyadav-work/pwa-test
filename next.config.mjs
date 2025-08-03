/** @type {import('next').NextConfig} */
import withPWAInit from "next-pwa";

const nextConfig = {};


const withPWA = withPWAInit({
    dest: "public",
});
export default withPWA(nextConfig);