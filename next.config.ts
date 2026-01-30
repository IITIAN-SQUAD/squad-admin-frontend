import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
      {
        protocol: "https",
        hostname: "serve.iitiansquad.com",
      },
      {
        protocol: "https",
        hostname: "example.com",
      },
      {
        protocol: "http",
        hostname: "example.com",
      },
      // Add common image hosting domains
      {
        protocol: "https",
        hostname: "cdn.example.com",
      },
      {
        protocol: "https",
        hostname: "images.example.com",
      },
      {
        protocol: "https",
        hostname: "assets.example.com",
      },
      // Add more Unsplash domains
      {
        protocol: "https",
        hostname: "api.unsplash.com",
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'https://serve.iitiansquad.com';
    
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
