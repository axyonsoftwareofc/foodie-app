// src/app/super-admin/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, Users, LayoutDashboard, Shield } from 'lucide-react';

const NAV = [
  { href: '/super-admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/super-admin/restaurants', label: 'Restaurantes', icon: Store },
  { href: '/super-admin/users', label: 'Usuários', icon: Users },
  { href: '/super-admin/audit', label: 'Auditoria', icon: Shield },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-5xl mx-auto flex items-center gap-1 px-4 py-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
