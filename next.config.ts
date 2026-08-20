import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Le lint est joué explicitement en CI ; il ne bloque pas la construction.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
