/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://icvljvmzynukxbwcdvqz.supabase.co',
  },
  allowedDevOrigins: ['0d1e3e9d-b7df-48c9-8bc8-590c359b2fb3-00-xugnbqzgwybl.riker.replit.dev'],
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
