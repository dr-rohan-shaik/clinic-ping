/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/n8n/:path*',
        destination: 'http://localhost:5678/:path*',
      },
      {
        source: '/pgadmin/:path*',
        destination: 'http://localhost:5050/:path*',
      },
    ]
  },
}

module.exports = nextConfig