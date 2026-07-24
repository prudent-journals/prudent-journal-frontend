import type { Metadata, Viewport } from 'next';
import { Playfair_Display, DM_Sans, Cormorant_Garamond, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ServiceWorkerRegistrar from '@/components/pwa/ServiceWorkerRegistrar';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Prudent Journals - Academic Publishing and Conferences',
    template: '%s | Prudent Journals',
  },
  description:
    'An independent academic publisher. Peer reviewed journal articles, conference proceedings and open access research.',
  keywords: [
    'academic journal',
    'Prudent Journals',
    'open access',
    'research',
    'conference proceedings',
    'peer review',
  ],
  authors: [{ name: 'Prudent Journals' }],
  openGraph: {
    type: 'website',
    siteName: 'Prudent Journals',
    title: 'Prudent Journals - Academic Publishing and Conferences',
    description:
      'Peer reviewed journal articles, conference proceedings and open access research.',
    url: SITE_URL,
  },
  applicationName: 'Prudent Journals',
  appleWebApp: {
    capable: true,
    title: 'Prudent Journals',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  twitter: {
    card: 'summary_large_image',
    title: 'Prudent Journals',
    description:
      'Peer reviewed journal articles, conference proceedings and open access research.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f172a' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="font-sans bg-parchment-50 text-navy-900 antialiased">
        {children}
        <ServiceWorkerRegistrar />
        <InstallPrompt />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              background: '#0d1624',
              color: '#faf7ee',
              border: '1px solid rgba(197, 151, 26, 0.3)',
            },
            success: { iconTheme: { primary: '#c5971a', secondary: '#0d1624' } },
          }}
        />
      </body>
    </html>
  );
}
