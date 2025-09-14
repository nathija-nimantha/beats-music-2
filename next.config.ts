import type { NextConfig } from 'next';

interface WebpackConfig {
  module: {
    rules: Array<{
      test: RegExp;
      use: {
        loader: string;
        options: {
          publicPath: string;
          outputPath: string;
        };
      };
    }>;
  };
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'via.placeholder.com',
      'images.unsplash.com',
      'source.unsplash.com',
      'images.pexels.com',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/audio/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  webpack: (config: unknown, { isServer }: { isServer: boolean }) => {
    const webpackConfig = config as WebpackConfig;
    webpackConfig.module.rules.push({
      test: /\.(mp3|wav|ogg|m4a)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/audio/',
          outputPath: `${isServer ? '../' : ''}static/audio/`,
        },
      },
    });

    return webpackConfig;
  },
  env: {
    CUSTOM_KEY: 'beats-music',
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/signup',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
