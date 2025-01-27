'use client';

import {Inter as FontSans} from 'next/font/google';
import {cn} from '@/lib/utils';
import './globals.css';
import NextAuthProvider from './auth';
import {EmbeddedComponentBorderProvider} from '@/app/hooks/EmbeddedComponentBorderProvider';
import ClientLayout from './ClientLayout';
import Script from 'next/script';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Stripe Demo</title>
        <meta name="robots" content="noindex, nofollow" />
        {/* ANALYTICS - DO NOT REMOVE */}
        <script
          defer
          src="https://analytics-hub.stripedemos.com/script.js"
          data-website-id="c6478f63-f260-4f70-b1ab-c6938c39426b"
        ></script>
        {/* GOOGLE ANALYTICS - DO NOT REMOVE */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4WLNJQ7QF9"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-4WLNJQ7QF9');
        `}
        </Script>
      </head>
      <body
        className={cn(
          'min-h-screen bg-offset font-sans antialiased',
          fontSans.variable
        )}
      >
        <NextAuthProvider>
          {/* <SettingsProvider> */}
          <EmbeddedComponentBorderProvider>
            <ClientLayout>{children}</ClientLayout>
          </EmbeddedComponentBorderProvider>
          {/* </SettingsProvider> */}
        </NextAuthProvider>
      </body>
    </html>
  );
}
