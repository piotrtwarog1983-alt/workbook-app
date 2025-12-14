/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: false,
  },
  // FAZA 1: Wyłącz Prisma podczas build jeśli nie ma DATABASE_URL
  webpack: (config, { isServer }) => {
    // Ignoruj błędy związane z @prisma/client podczas build (Faza 1 - bez bazy)
    if (!process.env.DATABASE_URL) {
      // Ignoruj @prisma/client w resolve - użyj pustego modułu
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client': require.resolve('./lib/prisma-stub.js'),
      }
    }
    return config
  },
}

module.exports = nextConfig

