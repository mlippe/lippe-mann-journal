import type { Metadata } from 'next';
import './globals.css';

import { TRPCReactProvider } from '@/trpc/client';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { siteConfig } from '@/site.config';
// Vercel Analytics
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

import { Readex_Pro } from 'next/font/google';

const readexPro = Readex_Pro({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: siteConfig.metadata.title,
  description: siteConfig.metadata.description,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.BETTER_AUTH_URL ||
      'http://localhost:3000',
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const s3Url = process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
  const s3Domain = s3Url ? new URL(s3Url).origin : null;

  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {s3Domain && <link rel='preconnect' href={s3Domain} />}
      </head>
      <body className={`${readexPro.className} antialiased`}>
        <NuqsAdapter>
          <TRPCReactProvider>
            <ThemeProvider attribute='class'>
              <Toaster />
              {children}
            </ThemeProvider>
          </TRPCReactProvider>
        </NuqsAdapter>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
