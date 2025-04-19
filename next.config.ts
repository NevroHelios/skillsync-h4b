import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', // Allow any path under this hostname
      },
      // Add the new hostname here
      {
        protocol: 'https',
        hostname: 'github.githubassets.com',
        port: '',
        pathname: '/**', // Allow any path under this hostname
      },
    ],
  },
};

export default nextConfig;
