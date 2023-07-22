import { siteConfig } from '@/config/site';
import { getUser } from '@/utils/auth';
import { type ColorScheme } from '@mantine/core';
import { Analytics } from '@vercel/analytics/react';
import { type Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { cookies } from 'next/headers';

import RootLayoutClient from '../components/client/layouts/root-layout';

export const revalidate = 0;

const font = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: '%s | ' + siteConfig.name,
  },
  description: siteConfig.description,
  keywords: ['eBoto Mo', 'Vote', 'Election', 'Voting System'],
  authors: [
    {
      name: 'Brice Suazo',
      url: 'https://bricesuazo.com',
    },
  ],
  creator: 'Brice Suazo',
  openGraph: {
    type: 'website',
    locale: 'en_PH',
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
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@brice_suazo',
  },
  icons: {
    icon: '/images/favicon/favicon.ico',
    shortcut: '/images/favicon/favicon-16x16.png',
    apple: '/images/favicon/apple-touch-icon.png',
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
  metadataBase: new URL(siteConfig.url),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  return (
    <html lang="en">
      <body className={font.className}>
        <RootLayoutClient
          theme={
            (cookies().get('theme')?.value as ColorScheme | null) ?? 'light'
          }
          user={user}
        >
          {children}
          <Analytics />
        </RootLayoutClient>
      </body>
    </html>
  );
}
