/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rendernest/shared', '@rendernest/database', '@rendernest/providers'],
  experimental: {
    serverComponentsExternalPackages: [
      'playwright',
      'playwright-core',
      'bullmq',
      'ioredis',
      '@prisma/client',
      'prisma',
      'docx',
      'pixelmatch',
      'pngjs',
      '@mozilla/readability',
      'jsdom',
      'bcryptjs',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('playwright', 'playwright-core', '@valkey/valkey-glide');
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
