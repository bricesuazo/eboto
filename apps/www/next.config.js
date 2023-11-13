/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@eboto/db", "@eboto/auth", "@eboto/api"],
  experimental: {
    webpackBuildWorker: true,
    // swcPlugins: [["next-superjson-plugin", {}]],
  },
  images: {
    // unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
};
