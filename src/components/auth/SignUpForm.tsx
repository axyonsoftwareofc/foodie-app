// src/components/auth/SignUpForm.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UtensilsCrossed, CheckCircle } from 'lucide-react';
import { signUpWithEmail } from '@/actions/auth';
import { signUpSchema } from '@/lib/validations/auth.validations';
import { AUTH_MESSAGES, getAuthErrorMessage } from '@/lib/constants/auth.constants';
import { AuthInput } from '@/components/auth/AuthInput';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { AuthDivider } from '@/components/auth/AuthDivider';

export function SignUpForm() {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrors({});
    setServerError('');

    const result = signUpSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await signUpWithEmail({
        email,
        password,
        fullName,
      });

      if (response?.error) {
        setServerError(getAuthErrorMessage(response.error));
      } else if (response?.success) {
        setIsSuccess(true);
      }
    } catch {
      setServerError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="mb-4 flex justify-center">
            <CheckCircle size={56} className="text-[#00A082]" />
          </div>
          <h2 className="mb-2 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Conta criada com sucesso! 🎉
          </h2>
          <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Enviamos um email de confirmação para{' '}
            <strong style={{ color: 'var(--color-text)' }}>{email}</strong>.
            <br />
            Verifique sua caixa de entrada para ativar sua conta.
          </p>
          <Link
            href="/sign-in"
            className="inline-block rounded-xl bg-[#00A082] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#008F74]"
          >
            Ir para o Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00A082]">
            <UtensilsCrossed size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {AUTH_MESSAGES.SIGN_UP_TITLE}
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {AUTH_MESSAGES.SIGN_UP_SUBTITLE}
          </p>
        </div>

        {/* Google OAuth */}
        <GoogleButton />

        {/* Divider */}
        <div className="my-6">
          <AuthDivider />
        </div>

        {/* Server Error */}
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl p-3 text-center text-sm"
            style={{
              backgroundColor: 'var(--color-error-light)',
              color: 'var(--color-error)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--color-error-border)',
            }}
          >
            {serverError}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthInput
            id="fullName"
            label="Nome completo"
            type="text"
            placeholder="Seu nome"
            value={fullName}
            onChange={setFullName}
            error={errors.fullName}
            autoComplete="name"
          />

          <AuthInput
            id="email"
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={setEmail}
            error={errors.email}
            autoComplete="email"
          />

          <AuthInput
            id="password"
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={setPassword}
            error={errors.password}
            autoComplete="new-password"
          />

          <AuthInput
            id="confirmPassword"
            label="Confirmar senha"
            type="password"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-[#00A082] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#008F74] disabled:opacity-60"
          >
            {isLoading ? AUTH_MESSAGES.SIGN_UP_LOADING : AUTH_MESSAGES.SIGN_UP_BUTTON}
          </button>
        </form>

        {/* Sign in link */}
        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {AUTH_MESSAGES.HAS_ACCOUNT}{' '}
          <Link
            href="/sign-in"
            className="font-semibold transition-colors hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            {AUTH_MESSAGES.SIGN_IN_LINK}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
