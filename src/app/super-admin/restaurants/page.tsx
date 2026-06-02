// src/app/super-admin/restaurants/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getAllRestaurants, toggleRestaurantActive } from '@/actions/super-admin-actions';
import { Search, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminRestaurants() {
  const [items, setItems] = useState<
    {
      id: string;
      name: string;
      ownerEmail: string;
      status: string;
      isActive: boolean;
      orderCount: number;
      slug: string;
      createdAt: string;
    }[]
  >([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (p: number, s: string) => {
    setLoading(true);
    const r = await getAllRestaurants(p, s);
    if (r.data) {
      setItems(r.data.items);
      setTotal(r.data.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    load(1, '');
  }, []);

  const handleSearch = () => {
    setPage(1);
    load(1, search);
  };

  const handleToggle = async (id: string) => {
    const r = await toggleRestaurantActive(id);
    if (r.success) {
      toast.success('Status alterado');
      load(page, search);
    } else {
      toast.error(r.error || 'Erro');
    }
  };

  return (
    <div
      className="p-4 max-w-5xl mx-auto space-y-6"
      style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}
    >
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Restaurantes
      </h1>

      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar por nome..."
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        />
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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Nenhum restaurante
                </td>
              </tr>
            ) : (
              items.map((r) => (
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
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.status === 'OPEN'
                          ? 'bg-emerald-100 text-emerald-700'
                          : r.status === 'BUSY'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
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
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                        r.isActive
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
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
            onClick={() => {
              setPage(page - 1);
              load(page - 1, search);
            }}
            disabled={page === 1}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-30"
          >
            Anterior
          </button>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {page} de {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => {
              setPage(page + 1);
              load(page + 1, search);
            }}
            disabled={page * 20 >= total}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-30"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
