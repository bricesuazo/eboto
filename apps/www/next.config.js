/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@eboto-mo/db", "@eboto-mo/auth", "@eboto-mo/api"],
  // TODO: remove this
  webpack: (config, { webpack, isServer, nextRuntime }) => {
    if (isServer && nextRuntime === "nodejs")
      config.plugins.push(
        new webpack.IgnorePlugin({ resourceRegExp: /^aws-crt$/ }),
      );
    return config;
  },
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
