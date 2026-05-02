import withPWAInit from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // Suppress hydration warning from ngrok or other proxies
  allowedDevOrigins: ['flashback-oops-deletion.ngrok-free.dev'],
  allowedDevOrigins: ['10.29.135.123'],
  turbopack: {},
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
});

export default withPWA(nextConfig);
