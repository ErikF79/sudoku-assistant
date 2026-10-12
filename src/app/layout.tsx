import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { PwaRegister } from '@/components/pwa-register';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  metadataBase: new URL('https://erikf79.github.io/sudoku-assistant/'),
  title: 'Aiuto Sudoku — Assistente passo-passo',
  description:
    'Assistente Sudoku 9x9 offline e installabile: inserisci il puzzle e ricevi suggerimenti spiegati un passo alla volta.',
  applicationName: 'Aiuto Sudoku',
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Aiuto Sudoku',
  },
  icons: {
    icon: [
      { url: `${BASE_PATH}/icons/icon.svg`, type: 'image/svg+xml' },
      { url: `${BASE_PATH}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${BASE_PATH}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: `${BASE_PATH}/icons/apple-touch-icon.png`, sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f5ff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased h-full">
        {children}
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
