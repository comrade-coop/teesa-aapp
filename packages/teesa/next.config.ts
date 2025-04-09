import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.json$/,
      type: 'json'
    })
    return config
  }
};

export default nextConfig;
