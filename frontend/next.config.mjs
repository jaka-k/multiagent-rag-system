/** @type {import('next').NextConfig} */
const nextConfig = {
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
