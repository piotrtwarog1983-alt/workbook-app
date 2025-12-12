/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    unoptimized: false,
  },
  webpack: (config, { isServer }) => {
    // Ignoruj błędy EPERM podczas builda
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules', '**/.git', '**/Anwendungsdaten'],
    }
    return config
  },
}

module.exports = nextConfig

