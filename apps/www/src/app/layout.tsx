import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/notifications/styles.css";
import "mantine-react-table/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/carousel/styles.css";

import type { Metadata } from "next";
import {
  // Lexend,
  Poppins,
} from "next/font/google";
import { Providers } from "@/components/providers";
import { siteConfig } from "@/config/site";
import { getBaseUrl } from "@/trpc/shared";
import TRPCProvider from "@/trpc/TRPCProvider";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Analytics } from "@vercel/analytics/react";
import { env } from "env.mjs";

const font = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});
// const font = Lexend({
//   subsets: ["latin"],
// });

// export const runtime = "edge";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: "%s | " + siteConfig.name,
  },
  description: siteConfig.description,
  keywords: ["eBoto", "Vote", "Election", "Voting System"],
  authors: [
    {
      name: "Brice Suazo",
      url: "https://bricesuazo.com",
    },
  ],
  creator: "Brice Suazo",
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@brice_suazo",
  },
  icons: {
    icon: "/images/favicon/favicon.ico",
    shortcut: "/images/favicon/favicon-16x16.png",
    apple: "/images/favicon/apple-touch-icon.png",
  },
  manifest: `${getBaseUrl()}/site.webmanifest`,
  metadataBase: new URL(siteConfig.url),
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8443325162715161"
          crossOrigin="anonymous"
        ></script>
        {/* TODO: Remove this once safari fix auto scale */}
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <meta
          property="og:image"
          content={`${
            env.NODE_ENV === "production"
              ? "https://eboto.app"
              : "http://localhost:3000"
          }/api/og?type=website`}
        />
        <meta
          property="og:image:type"
          content={`${
            env.NODE_ENV === "production"
              ? "https://eboto.app"
              : "http://localhost:3000"
          }/api/og?type=website`}
        />
        <meta
          property="og:image:width"
          content={`${
            env.NODE_ENV === "production"
              ? "https://eboto.app"
              : "http://localhost:3000"
          }/api/og?type=website`}
        />
        <meta
          property="og:image:height"
          content={`${
            env.NODE_ENV === "production"
              ? "https://eboto.app"
              : "http://localhost:3000"
          }/api/og?type=website`}
        />

        <meta
          name="twitter:image"
          content={`${
            env.NODE_ENV === "production"
              ? "https://eboto.app"
              : "http://localhost:3000"
          }/api/og?type=website`}
        />
        <meta
          name="twitter:image:type"
          content={`${
            env.NODE_ENV === "production"
              ? "https://eboto.app"
              : "http://localhost:3000"
          }/api/og?type=website`}
        />
        <meta
          name="twitter:image:width"
          content={`${
            env.NODE_ENV === "production"
              ? "https://eboto.app"
              : "http://localhost:3000"
          }/api/og?type=website`}
        />
        <meta
          name="twitter:image:height"
          content={`${
            env.NODE_ENV === "production"
              ? "https://eboto.app"
              : "http://localhost:3000"
          }/api/og?type=website`}
        />
      </head>
      <body className={font.className}>
        <MantineProvider
          theme={{
            primaryColor: "green",
            fontFamily: font.style.fontFamily,
            defaultGradient: {
              from: "green",
              to: "#6BD731",
              deg: 5,
            },
            colors: {
              dark: [
                "#C1C2C5",
                "#A6A7AB",
                "#909296",
                "#5c5f66",
                "#373A40",
                "#2C2E33",
                "#25262b",
                "#1A1B1E",
                "#141517",
                "#101113",
              ],
              // Old dark mode. Changed in mantine@7.3.0
            },
          }}
        >
          <TRPCProvider>
            <Notifications />
            <Providers>{children}</Providers>
            <Analytics />
          </TRPCProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
