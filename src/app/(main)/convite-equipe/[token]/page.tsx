// src/app/convite-equipe/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInvitationPreview, acceptRestaurantInvitation } from '@/actions/team-actions';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Proprietário',
  MANAGER: 'Gerente',
  KITCHEN: 'Cozinha',
  WAITER: 'Garçom',
  DRIVER: 'Entregador',
};

export default function ConviteEquipePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [preview, setPreview] = useState<{
    restaurantName: string;
    email: string;
    role: string;
    expiresAt: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    getInvitationPreview(token).then((result) => {
      if (result.error) setError(result.error);
      else setPreview(result.data!);
      setLoading(false);
    });
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    const result = await acceptRestaurantInvitation(token);
    setAccepting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setAccepted(true);
      setTimeout(() => {
        router.push(result.redirectTo || '/dashboard');
      }, 2000);
    }
  }

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <p className="text-gray-500">Carregando convite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <XCircle className="w-16 h-16 text-red-400" />
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Convite inválido
        </h1>
        <p className="text-sm max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {error}
        </p>
      </div>
    );
  }

  if (accepted) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <CheckCircle className="w-16 h-16 text-emerald-500" />
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Convite aceito!
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Redirecionando para sua área de trabalho...
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 space-y-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-card)' }}
      >
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-2 text-emerald-600" />
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Convite para equipe
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Você foi convidado para fazer parte de:
          </p>
        </div>

        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Restaurante
            </span>
            <p className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              {preview?.restaurantName}
            </p>
          </div>
          <div>
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Função
            </span>
            <p className="text-base font-medium" style={{ color: 'var(--color-primary)' }}>
              {ROLE_LABELS[preview?.role || ''] || preview?.role}
            </p>
          </div>
          <div
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <Clock className="w-3 h-3" />
            Expira em{' '}
            {preview?.expiresAt ? new Date(preview.expiresAt).toLocaleDateString('pt-BR') : '—'}
          </div>
        </div>

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {accepting ? 'Aceitando...' : 'Aceitar convite'}
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          Certifique-se de estar logado com {preview?.email}
        </p>
      </div>
    </div>
  );
}
