'use client';

export default function Error({ error: _error, reset }: { error: Error; reset: () => void }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div
        className="max-w-md w-full rounded-2xl border p-6 text-center"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-bg-card)',
        }}
      >
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          Algo deu errado
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Ocorreu um erro ao carregar esta pagina. Tente novamente.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
