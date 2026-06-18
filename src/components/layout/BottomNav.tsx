// src/components/layout/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/hooks/useCart';

const navItems = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/?focus=search', icon: Search, label: 'Buscar' },
  { href: '/favorites', icon: Heart, label: 'Favoritos' },
  { href: '/cart', icon: ShoppingBag, label: 'Carrinho', showBadge: true },
  { href: '/profile', icon: User, label: 'Perfil' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  // Hide on auth pages
  const isAuthPage = pathname.startsWith('/sign');
  if (isAuthPage) return null;

  const hiddenPaths = ['/checkout', '/order'];
  const shouldHide = hiddenPaths.some((path) => pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <nav
      aria-label="Navegacao principal"
      id="main-navigation"
      className="fixed bottom-0 left-0 right-0 border-t md:hidden z-50 transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const showBadge = item.showBadge && totalItems > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 p-2 relative"
            >
              <div className="relative">
                <Icon
                  size={24}
                  className={isActive ? 'text-[#00A082]' : ''}
                  style={{ color: isActive ? undefined : 'var(--color-text-secondary)' }}
                />
                {showBadge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-[#00A082] text-white text-xs rounded-full flex items-center justify-center"
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </motion.span>
                )}
              </div>
              <span
                className={`text-xs ${isActive ? 'text-[#00A082] font-medium' : ''}`}
                style={{ color: isActive ? undefined : 'var(--color-text-secondary)' }}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00A082] rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
