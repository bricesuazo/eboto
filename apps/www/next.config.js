/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@eboto-mo/db"],
  images: {
    domains: ["lh3.googleusercontent.com", "img.clerk.com"],
  },
};
