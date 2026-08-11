'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

export interface TableData {
  id: string;
  number: string;
  capacity: number;
  status: string;
}

export function MesasClient({ tables }: { tables: TableData[] }) {
  // `tables` vem do servidor por prop; após uma mutação, router.refresh()
  // re-executa o Server Component e traz a lista atualizada.
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!number.trim()) return;
    setSaving(true);
    const res = await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: number.trim(), capacity }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success('Mesa criada');
      setNumber('');
      setCapacity(4);
      setShowForm(false);
      router.refresh();
    } else {
      toast.error('Erro ao criar mesa');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/tables?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Mesa removida');
      router.refresh();
    } else {
      toast.error('Erro ao remover mesa');
    }
  };

  return (
    <div
      className="p-4 max-w-2xl mx-auto space-y-6"
      style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Mesas
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          Nova Mesa
        </button>
      </div>

      {showForm && (
        <div
          className="rounded-2xl border p-4 space-y-3"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
        >
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Número / Nome
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Ex: 1, 2, 3 ou Varanda"
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Capacidade (lugares)
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              min={1}
              max={20}
              className="w-full mt-1 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !number.trim()}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Criar Mesa'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-xl border px-4 py-2.5 text-sm text-gray-600"
              style={{ borderColor: 'var(--color-border)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tables.map((table) => (
          <div
            key={table.id}
            className="flex flex-col items-center gap-2 rounded-2xl border p-4 relative group"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
            }}
          >
            <button
              onClick={() => {
                if (window.confirm(`Excluir a mesa ${table.number}?`)) {
                  handleDelete(table.id);
                }
              }}
              aria-label={`Excluir mesa ${table.number}`}
              className="absolute top-2 right-2 rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <span className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {table.number}
            </span>
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Users className="w-3 h-3" />
              {table.capacity} lugares
            </div>
            <span
              className="text-xs font-medium"
              style={{
                color: table.status === 'AVAILABLE' ? '#10B981' : '#F59E0B',
              }}
            >
              {table.status === 'AVAILABLE' ? 'Livre' : 'Ocupada'}
            </span>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Nenhuma mesa cadastrada</p>
          <p className="text-sm text-gray-300 mt-1">Clique em Nova Mesa para começar</p>
        </div>
      )}
    </div>
  );
}
