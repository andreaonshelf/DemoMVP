/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
  webpack: (config) => {
    // Support JSON imports
    config.resolve.fallback = { fs: false };
    return config;
  },
}

export default nextConfig
