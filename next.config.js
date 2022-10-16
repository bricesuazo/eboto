/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["firebasestorage.googleapis.com"],
  },
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      {
        source: "/dashboard/:path",
        destination: "/dashboard",
        permanent: true,
      },
      // {
      //   source: "/:electionIdName/dashboard/:path",
      //   destination: "/dashboard",
      //   permanent: true,
      // },
    ];
  },
};

module.exports = nextConfig;
