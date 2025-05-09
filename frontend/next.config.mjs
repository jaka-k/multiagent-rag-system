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
  }
}

export default nextConfig
