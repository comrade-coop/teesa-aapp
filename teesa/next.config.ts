import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.json$/,
      type: 'json'
    })
    return config
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/game',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
