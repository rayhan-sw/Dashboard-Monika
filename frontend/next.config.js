/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pakai folder frontend sebagai root Turbopack (hindari deteksi lockfile di folder lain yang bikin compile lambat)
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
}

module.exports = nextConfig
