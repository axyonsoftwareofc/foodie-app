// next.config.ts
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
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
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    const cspReportOnly = process.env.CSP_ENFORCE !== 'true';
    const cspHeader = cspReportOnly
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';

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
              "script-src 'self' 'unsafe-inline' js.stripe.com *.mercadopago.com browser.sentry-cdn.com *.unsplash.com",
              "frame-src 'self' js.stripe.com hooks.stripe.com www.paypal.com www.mercadopago.com.br",
              "connect-src 'self' *.supabase.co api.stripe.com api.mercadopago.com api-m.paypal.com *.ingest.sentry.io",
              "img-src 'self' data: res.cloudinary.com images.unsplash.com *.supabase.co",
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
