/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle (server.js + traced node_modules) for a small runtime image.
  output: 'standalone',
  webpack: (config, context) => {
    config.externals.push({
      'thread-stream': 'commonjs thread-stream'
    })
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com'
      }
    ]
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.krajnc.cc'],
    },
  },
}

export default nextConfig
