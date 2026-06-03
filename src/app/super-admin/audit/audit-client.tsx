// src/app/super-admin/audit/audit-client.tsx
'use client';

import { useState } from 'react';
import { getGlobalAuditLog } from '@/actions/super-admin-actions';

const ACTION_LABELS: Record<string, string> = {
  'team.invitation.created': 'Convite enviado',
  'team.invitation.accepted': 'Convite aceito',
  'team.invitation.cancelled': 'Convite cancelado',
  'team.member.disabled': 'Membro desativado',
  'waiter.order.created': 'Pedido criado (garçom)',
  'waiter.table.closed': 'Mesa fechada',
};

interface AuditItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  restaurantName: string;
  createdAt: string;
}

export default function AuditClient({
  initialItems,
  initialTotal,
}: {
  initialItems: AuditItem[];
  initialTotal: number;
}) {
  const [items, setItems] = useState<AuditItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const handlePage = async (p: number) => {
    setLoading(true);
    setPage(p);
    const r = await getGlobalAuditLog(p);
    if (r.data) {
      setItems(r.data.items);
      setTotal(r.data.total);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
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
                Ação
              </th>
              <th
                className="p-3 text-left font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Restaurante
              </th>
              <th
                className="p-3 text-left font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Tipo
              </th>
              <th
                className="p-3 text-left font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Data
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  Carregando...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  Nenhum evento
                </td>
              </tr>
            ) : (
              items.map((log) => (
                <tr
                  key={log.id}
                  className="border-t"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <td className="p-3 text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                    {ACTION_LABELS[log.action] || log.action}
                  </td>
                  <td className="p-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {log.restaurantName}
                  </td>
                  <td className="p-3 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {log.entityType}
                  </td>
                  <td className="p-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 30 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page === 1 || loading}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-30"
          >
            Anterior
          </button>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {page} de {Math.ceil(total / 30)}
          </span>
          <button
            onClick={() => handlePage(page + 1)}
            disabled={page * 30 >= total || loading}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-30"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
