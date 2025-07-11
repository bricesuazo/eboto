/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  transpilePackages: ["@eboto/api", "@eboto/email", "@eboto/inngest"],
  experimental: {
    optimizePackageImports: ["@mantine/core", "@mantine/hooks", "@tabler/icons-react"],
    optimizeCss: true,
  },
  images: {
    // unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
      },
      {
        protocol: "https",
        hostname: "ssczhefhijwasxhlzdez.supabase.co",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Optimize bundle size by excluding moment.js locales if accidentally imported
    config.resolve.alias = {
      ...config.resolve.alias,
      moment$: 'dayjs',
    };

    // Better tree-shaking for icons
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };

    return config;
  },
  // Enable compression
  compress: true,
  // Enable output file tracing for smaller deploys
  output: 'standalone',
};
