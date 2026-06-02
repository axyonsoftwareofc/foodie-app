// src/app/super-admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getSuperAdminMetrics } from '@/actions/super-admin-actions';
import { Store, ShoppingBag, Users, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format.utils';

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<{
    totalRestaurants: number;
    activeRestaurants: number;
    totalOrders: number;
    todayOrders: number;
    todayRevenue: number;
    totalUsers: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSuperAdminMetrics().then((r) => {
      if (r.data) setMetrics(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-500">Carregando metricas...</div>;
  }

  return (
    <div
      className="p-4 max-w-5xl mx-auto space-y-6"
      style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}
    >
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Super Admin
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          icon={<Store className="w-5 h-5" />}
          label="Restaurantes"
          value={metrics?.totalRestaurants ?? 0}
          sub={`${metrics?.activeRestaurants ?? 0} ativos`}
          color="bg-blue-500"
        />
        <MetricCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Pedidos Hoje"
          value={metrics?.todayOrders ?? 0}
          sub={`${metrics?.totalOrders ?? 0} total`}
          color="bg-emerald-500"
        />
        <MetricCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Faturamento Hoje"
          value={formatPrice(metrics?.todayRevenue ?? 0)}
          sub=""
          color="bg-green-600"
        />
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label="Usuários"
          value={metrics?.totalUsers ?? 0}
          sub=""
          color="bg-purple-500"
        />
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          label="Total de Pedidos"
          value={metrics?.totalOrders ?? 0}
          sub=""
          color="bg-orange-500"
        />
        <MetricCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Rest. Ativos"
          value={metrics?.activeRestaurants ?? 0}
          sub={`de ${metrics?.totalRestaurants ?? 0}`}
          color="bg-indigo-500"
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
    >
      <div
        className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${color} text-white mb-3`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      {sub && (
        <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          {sub}
        </p>
      )}
    </div>
  );
}
