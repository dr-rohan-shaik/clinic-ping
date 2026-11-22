/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    serverComponentsExternalPackages: ['postgres', 'drizzle-orm'],
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
  webpack: (config, { isServer, webpack }) => {
    // Completely exclude postgres from client-side bundles
    if (!isServer) {
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['postgres'] = false;
      config.resolve.alias['drizzle-orm/postgres-js'] = false;

      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^postgres$/,
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /^drizzle-orm\/postgres-js$/,
        })
      );
    }
    return config;
  },
}

module.exports = nextConfig