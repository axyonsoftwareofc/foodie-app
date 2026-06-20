// src/app/(driver)/driver/login/page.tsx — LOGIN DO ENTREGADOR
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AuthInput } from '@/components/auth/AuthInput';

export default function DriverLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError('');

    if (!email) {
      setErrors({ email: 'Email é obrigatório' });
      return;
    }
    if (!password) {
      setErrors({ password: 'Senha é obrigatória' });
      return;
    }
    if (!email.includes('@')) {
      setErrors({ email: 'Email inválido' });
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setServerError(
        error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message
      );
      setIsLoading(false);
      return;
    }

    window.location.href = '/driver';
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600">
            <Truck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Área do Entregador
          </h1>
          <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Faça login para acessar suas entregas
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthInput
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            error={errors.email}
            placeholder="seu@email.com"
            autoComplete="email"
          />

          <AuthInput
            id="password"
            label="Senha"
            type="password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {serverError && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
            >
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
          </button>
        </form>

        {/* Help */}
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Não tem acesso? Solicite ao responsável do restaurante.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
