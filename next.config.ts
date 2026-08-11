// next.config.ts
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async headers() {
    const cspEnforce = process.env.CSP_ENFORCE !== 'false';
    const cspHeader = cspEnforce
      ? 'Content-Security-Policy'
      : 'Content-Security-Policy-Report-Only';

    // Em dev, o React usa eval() para recursos de depuração (ex.: reconstruir
    // callstacks vindas do servidor em Server Components). Em producao o React
    // nunca usa eval() — por isso 'unsafe-eval' fica restrito ao dev.
    const isDev = process.env.NODE_ENV === 'development';
    const scriptSrc = [
      "script-src 'self' 'unsafe-inline'",
      isDev ? "'unsafe-eval'" : '',
      'js.stripe.com *.mercadopago.com browser.sentry-cdn.com *.unsplash.com',
    ]
      .filter(Boolean)
      .join(' ');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: cspHeader,
            value: [
              "default-src 'self'",
              scriptSrc,
              "frame-src 'self' js.stripe.com hooks.stripe.com www.paypal.com www.mercadopago.com.br",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co api.stripe.com api.mercadopago.com api-m.paypal.com *.ingest.sentry.io",
              "img-src 'self' data: res.cloudinary.com images.unsplash.com *.supabase.co lh3.googleusercontent.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "worker-src 'self' blob:",
              'report-uri /monitoring',
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || undefined,
  project: process.env.SENTRY_PROJECT || undefined,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
