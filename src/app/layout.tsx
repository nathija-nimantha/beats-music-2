import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Beats Music - Your Universal Music Platform',
  description: 'Discover the magic of music with Beats Music. Your gateway to a world of melodies, rhythms, and emotions.',
  keywords: 'music, streaming, playlist, songs, artists, albums',
  authors: [{ name: 'Beats Music Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const themeColor = '#000000';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
  <link href="https://fonts.googleapis.com/css2?family=K2D:wght@700;900&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
