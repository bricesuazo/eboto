/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  // reactStrictMode: true,
  images: {
    domains: ["img.freepik.com", "www.freepnglogos.com"],
  },

  // async redirects() {
  //   return [
  //     {
  //       source: "/dashboard",
  //       destination: "/dashboard/overview",
  //       permanent: true,
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
