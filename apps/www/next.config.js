/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@eboto-mo/db"],
  experimental: {
    forceSwcTransforms: true,
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};
