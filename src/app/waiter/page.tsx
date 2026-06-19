// src/app/waiter/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTables } from '@/actions/waiter-actions';
import { ArrowRight, Users, Circle, ArrowLeft } from 'lucide-react';

export default function WaiterPage() {
  const [tables, setTables] = useState<
    { id: string; number: string; capacity: number; status: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getTables().then((r) => {
      if (r.data) setTables(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Carregando mesas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Minimal Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
        <span
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Área do Garçom
        </span>
      </div>

      <div className="p-4">
        <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          🍽️ Mesas
        </h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Selecione uma mesa para iniciar o atendimento
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => router.push(`/waiter/${table.id}`)}
              className="flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
              style={{
                borderColor:
                  table.status === 'OCCUPIED' ? 'var(--color-warning)' : 'var(--color-border)',
                backgroundColor: table.status === 'OCCUPIED' ? '#FFF8E1' : 'var(--color-bg-card)',
              }}
            >
              <Circle
                className="h-3 w-3"
                style={{
                  color: table.status === 'AVAILABLE' ? '#10B981' : '#F59E0B',
                  fill: table.status === 'AVAILABLE' ? '#10B981' : '#F59E0B',
                }}
              />
              <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {table.number}
              </span>
              <div
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Users className="h-3 w-3" />
                {table.capacity}
              </div>
              <span
                className="text-xs font-medium"
                style={{
                  color: table.status === 'AVAILABLE' ? '#10B981' : '#F59E0B',
                }}
              >
                {table.status === 'AVAILABLE' ? 'Livre' : 'Ocupada'}
              </span>
            </button>
          ))}
        </div>

        {tables.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-500">Nenhuma mesa cadastrada</p>
            <p className="mt-1 text-sm text-gray-400">Cadastre mesas no painel administrativo</p>
          </div>
        )}
      </div>
    </div>
  );
}
