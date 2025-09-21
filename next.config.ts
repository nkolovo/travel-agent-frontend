import { NextConfig } from 'next';

const backendUrl =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true }, // Ignore ESLint errors during production build
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
