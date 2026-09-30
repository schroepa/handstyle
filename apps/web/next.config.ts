import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@handstyle/tokens', '@tintfield/engine'],
}

export default nextConfig
