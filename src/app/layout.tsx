// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import SkipLinks from '@/components/accessibility/SkipLinks';

export const metadata: Metadata = {
  title: 'Foodie - Delivery de Comida',
  description: 'Peça comida dos melhores restaurantes da sua região',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Foodie',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Foodie',
    title: 'Foodie - Delivery de Comida',
    description: 'Peça comida dos melhores restaurantes da sua região',
  },
};

export const viewport: Viewport = {
  themeColor: '#00A082',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  const theme = localStorage.getItem('foodie-theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const resolvedTheme = theme || (prefersDark ? 'dark' : 'light');
                  document.documentElement.classList.add(resolvedTheme);
                  document.documentElement.setAttribute('data-theme', resolvedTheme);

                  const accessibility = localStorage.getItem('foodie-accessibility');
                  if (accessibility) {
                    const settings = JSON.parse(accessibility);
                    const html = document.documentElement;
                    if (settings.highContrast) html.classList.add('a11y-high-contrast');
                    if (settings.largeText) html.classList.add('a11y-large-text');
                    if (settings.reducedMotion) html.classList.add('a11y-reduced-motion');
                    if (settings.largeClickTargets) html.classList.add('a11y-large-targets');
                    if (settings.simplifiedInterface) html.classList.add('a11y-simplified');
                    if (settings.dyslexiaFriendly) html.classList.add('a11y-dyslexia-friendly');
                    if (settings.readingGuide) html.classList.add('a11y-reading-guide');
                    if (settings.reducedDistractions) html.classList.add('a11y-reduced-distractions');
                  }
                } catch {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans">
        <SkipLinks />
        <CartProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              style: {
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
