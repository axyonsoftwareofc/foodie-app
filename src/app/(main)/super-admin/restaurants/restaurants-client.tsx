// src/app/super-admin/restaurants/restaurants-client.tsx
'use client';

import { useState } from 'react';
import { getAllRestaurants, toggleRestaurantActive } from '@/actions/super-admin-actions';
import { Search, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

interface RestaurantItem {
  id: string;
  name: string;
  ownerEmail: string;
  status: string;
  isActive: boolean;
  orderCount: number;
  slug: string;
  createdAt: string;
}

const STATUS_OPTIONS = ['ALL', 'OPEN', 'BUSY', 'CLOSED'] as const;

export default function RestaurantsClient({
  initialItems,
  initialTotal,
}: {
  initialItems: RestaurantItem[];
  initialTotal: number;
}) {
  const [items, setItems] = useState<RestaurantItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setPage(1);
    const r = await getAllRestaurants(1, search);
    if (r.data) {
      setItems(r.data.items.filter((i) => statusFilter === 'ALL' || i.status === statusFilter));
      setTotal(r.data.total);
    }
    setLoading(false);
  };

  const handlePage = async (p: number) => {
    setLoading(true);
    setPage(p);
    const r = await getAllRestaurants(p, search);
    if (r.data) {
      setItems(r.data.items.filter((i) => statusFilter === 'ALL' || i.status === statusFilter));
      setTotal(r.data.total);
    }
    setLoading(false);
  };

  const handleToggle = async (id: string) => {
    const r = await toggleRestaurantActive(id);
    if (r.success) {
      toast.success('Status alterado');
      handlePage(page);
    } else {
      toast.error(r.error || 'Erro');
    }
  };

  const filtered = items.filter((i) => statusFilter === 'ALL' || i.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar por nome ou email do dono..."
          className="flex-1 min-w-[200px] rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'Todos Status' : s}
            </option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          <Search className="w-4 h-4" /> Buscar
        </button>
      </div>

      <div
        className="overflow-auto rounded-xl border"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <th
                className="p-3 text-left font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Nome
              </th>
              <th
                className="p-3 text-left font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Dono
              </th>
              <th
                className="p-3 text-left font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Status
              </th>
              <th
                className="p-3 text-left font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Pedidos
              </th>
              <th
                className="p-3 text-left font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Criado em
              </th>
              <th
                className="p-3 text-center font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Nenhum restaurante
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-3" style={{ color: 'var(--color-text)' }}>
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs block" style={{ color: 'var(--color-text-tertiary)' }}>
                      {r.slug}
                    </span>
                  </td>
                  <td className="p-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {r.ownerEmail}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : r.status === 'BUSY' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {r.orderCount}
                  </td>
                  <td className="p-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggle(r.id)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${r.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      {r.isActive ? (
                        <PowerOff className="w-3 h-3" />
                      ) : (
                        <Power className="w-3 h-3" />
                      )}
                      {r.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page === 1 || loading}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-30"
          >
            Anterior
          </button>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {page} de {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => handlePage(page + 1)}
            disabled={page * 20 >= total || loading}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-30"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
