'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              borderRadius: '1rem',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                color: '#111827',
              }}
            >
              Erro inesperado
            </h2>
            <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: '#6b7280' }}>
              {error.message || 'Ocorreu um erro no aplicativo. Tente novamente.'}
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', marginBottom: '1rem', color: '#9ca3af' }}>
                ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#00A082',
                color: '#ffffff',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
