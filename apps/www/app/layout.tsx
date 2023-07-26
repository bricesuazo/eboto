import { siteConfig } from "@/config/site";
import { ClerkProvider } from "@clerk/nextjs";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";

const font = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: "%s | " + siteConfig.name,
  },
  description: siteConfig.description,
  keywords: ["eBoto Mo", "Vote", "Election", "Voting System"],
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
  manifest: `${siteConfig.url}/site.webmanifest`,
  metadataBase: new URL(siteConfig.url),
};

export const runtime = "edge";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <ColorSchemeScript />
        </head>
        <body className={font.className}>
          <MantineProvider
            theme={{
              primaryColor: "green",
              fontFamily: font.style.fontFamily,
            }}
          >
            <Notifications />
            {children}
            <Analytics />
          </MantineProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
