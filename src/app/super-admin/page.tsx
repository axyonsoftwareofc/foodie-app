// src/app/super-admin/page.tsx
import { getSuperAdminMetrics } from '@/actions/super-admin-actions';
import { Store, ShoppingBag, Users, DollarSign, TrendingUp, Activity, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils/format.utils';

export default async function SuperAdminDashboard() {
  const result = await getSuperAdminMetrics();
  const m = result.data;

  return (
    <div
      className="p-4 max-w-5xl mx-auto space-y-6"
      style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}
    >
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Super Admin
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Store className="w-5 h-5" />}
          label="Restaurantes"
          value={m?.totalRestaurants ?? 0}
          sub={`${m?.activeRestaurants ?? 0} ativos`}
          color="bg-blue-500"
        />
        <MetricCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Pedidos Hoje"
          value={m?.todayOrders ?? 0}
          sub={formatPrice(m?.todayRevenue ?? 0)}
          color="bg-emerald-500"
        />
        <MetricCard
          icon={<Users className="w-5 h-5" />}
          label="Usuários"
          value={m?.totalUsers ?? 0}
          sub=""
          color="bg-purple-500"
        />
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          label="Total de Pedidos"
          value={m?.totalOrders ?? 0}
          sub=""
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Abertos (OPEN)
            </span>
          </div>
          <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {m?.openRestaurants ?? 0}
          </span>
        </div>
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Ocupados (BUSY)
            </span>
          </div>
          <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {m?.busyRestaurants ?? 0}
          </span>
        </div>
        <div
          className="rounded-2xl border p-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Fechados (CLOSED)
            </span>
          </div>
          <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {m?.closedRestaurants ?? 0}
          </span>
        </div>
      </div>

      <div
        className="rounded-2xl border p-4"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
      >
        <h2
          className="text-sm font-semibold mb-3 flex items-center gap-2"
          style={{ color: 'var(--color-text)' }}
        >
          <Clock className="w-4 h-4" /> Últimos Pedidos
        </h2>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th
                  className="p-2 text-left font-medium text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Pedido
                </th>
                <th
                  className="p-2 text-left font-medium text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Restaurante
                </th>
                <th
                  className="p-2 text-left font-medium text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Valor
                </th>
                <th
                  className="p-2 text-left font-medium text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Status
                </th>
                <th
                  className="p-2 text-left font-medium text-xs"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {m?.recentOrders?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-xs text-gray-400">
                    Nenhum pedido
                  </td>
                </tr>
              )}
              {m?.recentOrders?.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="p-2 text-xs font-mono" style={{ color: 'var(--color-text)' }}>
                    #{o.id.slice(-4)}
                  </td>
                  <td
                    className="p-2 text-xs truncate max-w-[200px]"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {o.restaurantName}
                  </td>
                  <td className="p-2 text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                    {formatPrice(o.total)}
                  </td>
                  <td className="p-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${o.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : o.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : o.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="p-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(o.createdAt).toLocaleString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
