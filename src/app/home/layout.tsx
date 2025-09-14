import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/error/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Beats Music - Your Universal Music Platform',
  description: 'Discover the magic of music with Beats Music. Your gateway to a world of melodies, rhythms, and emotions.',
  keywords: 'music, streaming, playlist, songs, artists, albums',
  authors: [{ name: 'Beats Music Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#000000',
};

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
      </head>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
    </html>
  );
}