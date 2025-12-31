/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Optymalizacje wydajności
  poweredByHeader: false,
  compress: true,
  
  // Optymalizacja bundlera
  experimental: {
    optimizePackageImports: ['pusher-js', 'zod'],
  },
  
  // Optymalizacja kompilacji
  swcMinify: true,
  
  // Zmniejsz timeout kompilacji dla development
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: false,
    // Optymalizacja obrazów
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
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
    
    // Optymalizacja: ignoruj duże moduły które nie są potrzebne
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    return config
  },
}

module.exports = nextConfig

