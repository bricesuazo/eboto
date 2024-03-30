/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@eboto/api"],
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
