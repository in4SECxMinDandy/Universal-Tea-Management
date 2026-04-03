/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: 'c:/Users/haqua/Documents/GitHub/UniTEA',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
