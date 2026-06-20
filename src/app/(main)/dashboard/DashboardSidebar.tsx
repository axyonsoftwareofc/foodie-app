'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Settings,
  Store,
  Palette,
  Globe,
  CreditCard,
  ChefHat,
  Package,
  Menu,
  X,
  Truck,
  ClipboardList,
  Bike,
  Users,
} from 'lucide-react';
import type { RestaurantProfile } from '@/types/restaurant-management.types';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Visao Geral', icon: LayoutDashboard },
  { href: '/dashboard/menu', label: 'Cardapio', icon: UtensilsCrossed },
  { href: '/dashboard/orders', label: 'Pedidos', icon: Receipt },
  { href: '/dashboard/cozinha', label: 'Cozinha', icon: ChefHat },
  { href: '/dashboard/mesas', label: 'Mesas', icon: Users },
  { href: '/waiter', label: 'Garcom', icon: ClipboardList },
  { href: '/dashboard/entregadores', label: 'Entregadores', icon: Truck },
  { href: '/driver', label: 'Entregas', icon: Bike },
  { href: '/dashboard/pass', label: 'Pass / Balcao', icon: Package },
  { href: '/dashboard/settings', label: 'Configuracoes', icon: Settings },
] as const;

const CUSTOM_ITEMS = [
  { href: '/dashboard/equipe', label: 'Equipe', icon: Users },
  { href: '/dashboard/theme', label: 'Aprencia', icon: Palette },
  { href: '/dashboard/domain', label: 'Domio', icon: Globe },
  { href: '/dashboard/billing', label: 'Planos', icon: CreditCard },
] as const;

export default function DashboardSidebar({
  restaurant,
  children,
}: {
  restaurant: RestaurantProfile | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const sidebar = (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Store className="w-6 h-6 text-emerald-600 mr-2 shrink-0" />
        <div className="min-w-0">
          <span className="font-bold text-base text-gray-900 truncate block">
            {restaurant?.name || 'Foodie Admin'}
          </span>
          {restaurant?.name && (
            <span className="text-xs text-gray-400 truncate block">
              {restaurant.slug || ''}.foodie.app
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-gray-100">
          <p className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Personalizacao
          </p>
          {CUSTOM_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
            {restaurant?.name?.charAt(0)?.toUpperCase() || 'R'}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">
              {restaurant?.name || 'Restaurante'}
            </p>
            <p className="text-xs text-gray-400">Plano Gratis</p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:block h-screen sticky top-0">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-bold text-emerald-700">Foodie Admin</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 p-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-gray-900 truncate">{restaurant?.name || 'Dashboard'}</h1>
          </div>
        </div>

        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
