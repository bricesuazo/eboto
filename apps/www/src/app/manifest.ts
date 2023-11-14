import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "eBoto – Your One-Stop Online Voting Solution",
    short_name: "eBoto",
    description:
      "Empower your elections with eBoto, the versatile and web-based voting platform that offers secure online elections for any type of organization.",
    start_url: "/",
    display: "standalone",
    lang: "en",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
