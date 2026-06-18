// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import SkipLinks from '@/components/accessibility/SkipLinks';
import AccessibilityWidget from '@/components/accessibility/AccessibilityWidget';
import { CartSidebarGlobal } from '@/components/cart/CartSidebarGlobal';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';

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
      <body className="font-sans">
        <SkipLinks />
        <ThemeProvider>
          <AccessibilityProvider>
            <AuthProvider>
              <CartProvider>
                <Header />
                <main id="main-content" role="main" className="min-h-screen pb-20 lg:pb-0">
                  {children}
                </main>
                <BottomNav />
                <CartSidebarGlobal />
                <AccessibilityWidget />
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
                <ServiceWorkerRegister />
              </CartProvider>
            </AuthProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
