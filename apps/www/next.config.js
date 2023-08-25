/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@eboto-mo/db", "@eboto-mo/api"],
  experimental: {
    serverActions: true,
    // forceSwcTransforms: true,
    // swcPlugins: [["next-superjson-plugin", {}]],
  },
  images: {
    domains: ["lh3.googleusercontent.com", "img.clerk.com"],
  },
};
