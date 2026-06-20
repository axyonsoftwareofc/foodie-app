// src/app/super-admin/users/users-client.tsx
'use client';

import { useState } from 'react';
import { getAllUsers, setUserRole } from '@/actions/super-admin-actions';
import { Shield, User, Search } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  GERENCIADOR: 'Gerente',
  EQUIPE: 'Equipe',
  CLIENTE: 'Cliente',
};
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  GERENCIADOR: 'bg-blue-100 text-blue-700',
  EQUIPE: 'bg-emerald-100 text-emerald-700',
  CLIENTE: 'bg-gray-100 text-gray-600',
};

interface UserItem {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string;
}

export default function UsersClient({ initialUsers }: { initialUsers: UserItem[] }) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFilter = async (filter: string) => {
    setLoading(true);
    setRoleFilter(filter);
    const r = await getAllUsers(filter === 'ALL' ? undefined : filter);
    if (r.data) setUsers(r.data);
    setLoading(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    const r = await getAllUsers(roleFilter === 'ALL' ? undefined : roleFilter);
    if (r.data)
      setUsers(
        r.data.filter(
          (u) =>
            !search ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            (u.fullName || '').toLowerCase().includes(search.toLowerCase())
        )
      );
    setLoading(false);
  };

  const handleSetRole = async (userId: string, role: string) => {
    const r = await setUserRole(userId, role);
    if (r.success) {
      toast.success(`Role alterado para ${ROLE_LABELS[role] || role}`);
      handleFilter(roleFilter);
    } else toast.error(r.error || 'Erro');
  };

  const roleCounts = users.reduce(
    (acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar por email ou nome..."
          className="flex-1 min-w-[200px] rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        />
        <button
          onClick={handleSearch}
          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
        >
          <Search className="w-4 h-4" /> Buscar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {['ALL', 'SUPER_ADMIN', 'ADMIN', 'GERENCIADOR', 'EQUIPE', 'CLIENTE'].map((r) => (
          <button
            key={r}
            onClick={() => handleFilter(r)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${roleFilter === r ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {r === 'ALL' ? 'Todos' : ROLE_LABELS[r] || r}{' '}
            {r !== 'ALL' && roleCounts[r] ? (
              <span className="ml-1 opacity-70">({roleCounts[r]})</span>
            ) : null}
          </button>
        ))}
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
                Usuário
              </th>
              <th
                className="p-3 text-left font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Email
              </th>
              <th
                className="p-3 text-left font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Role
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
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  Carregando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">
                  Nenhum usuário
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {u.fullName || u.email?.split('@')[0]}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {u.email}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="p-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3 text-center">
                    <select
                      value={u.role}
                      onChange={(e) => handleSetRole(u.id, e.target.value)}
                      className="text-xs rounded-lg border px-2 py-1.5"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="GERENCIADOR">Gerente</option>
                      <option value="EQUIPE">Equipe</option>
                      <option value="CLIENTE">Cliente</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
