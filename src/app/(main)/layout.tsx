// src/app/(main)/layout.tsx
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { CartSidebarGlobal } from '@/components/cart/CartSidebarGlobal';
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <Header />
          <main id="main-content" role="main" className="min-h-screen pb-20 lg:pb-0">
            {children}
          </main>
          <BottomNav />
          <CartSidebarGlobal />
          <ServiceWorkerRegister />
        </AuthProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}
