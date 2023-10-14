/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/game',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
