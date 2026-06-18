'use client';

import Link from 'next/link';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="text-center max-w-md">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: 'var(--color-bg-hover)' }}
        >
          <Compass className="w-10 h-10" style={{ color: 'var(--color-primary)' }} />
        </div>

        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          Pagina nao encontrada
        </h1>

        <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          O endereco que voce acessou nao existe ou foi movido. Verifique a URL ou volte para o
          inicio.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 text-white rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Voltar ao inicio
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 mt-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
