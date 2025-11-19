/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 기존 이미지가 있다면 유지, 없다면 아래 내용은 무시해도 됨
  images: {
    domains: ['placehold.co'], 
  },
}

module.exports = nextConfig

