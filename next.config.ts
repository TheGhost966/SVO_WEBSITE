import type { NextConfig } from 'next'
// @payloadcms/next has no root export — import from the subpath
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withPayload } = require('@payloadcms/next/withPayload')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },
}

export default withPayload(nextConfig)
