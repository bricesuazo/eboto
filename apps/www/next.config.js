/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@eboto-mo/db", "@eboto-mo/auth", "@eboto-mo/api"],
  experimental: {
    serverActions: true,
    // forceSwcTransforms: true,
    // swcPlugins: [["next-superjson-plugin", {}]],
  },
  images: {
    // unoptimized: true,
    domains: ["lh3.googleusercontent.com", "ocozashcaobsffletnyj.supabase.co"],
  },
};
