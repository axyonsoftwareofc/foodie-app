// src/actions/auth.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { checkRateLimit, getClientIdentifierFromHeaders, RateLimitConfig } from '@/lib/rate-limit';
import { passwordSchema, signUpSchema } from '@/lib/validations/auth.validations';

export async function signInWithEmail(formData: { email: string; password: string }) {
  const rate = await checkRateLimit(
    `auth:signin:${formData.email.toLowerCase()}`,
    RateLimitConfig.strict.limit,
    RateLimitConfig.strict.windowSeconds,
    true
  );
  if (!rate.success) {
    return { error: 'Muitas tentativas. Aguarde um momento.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  // redirect() lança uma exceção - NÃO colocar em try/catch
  redirect('/');
}

export async function signUpWithEmail(formData: {
  email: string;
  password: string;
  fullName: string;
}) {
  const rate = await checkRateLimit(
    `auth:signup:${formData.email.toLowerCase()}`,
    RateLimitConfig.strict.limit,
    RateLimitConfig.strict.windowSeconds,
    true
  );
  if (!rate.success) {
    return { error: 'Muitas tentativas. Aguarde um momento.' };
  }

  const supabase = await createClient();

  const validation = signUpSchema.safeParse(formData);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { error } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
    options: {
      data: {
        full_name: validation.data.fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Verifique seu email para confirmar o cadastro!' };
}

export async function signInWithGoogle() {
  const clientId = await getClientIdentifierFromHeaders();
  const rate = await checkRateLimit(
    `auth:google:${clientId}`,
    RateLimitConfig.strict.limit,
    RateLimitConfig.strict.windowSeconds,
    true
  );
  if (!rate.success) {
    return { error: 'Muitas tentativas. Aguarde um momento.' };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin =
    headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: 'Erro ao iniciar login com Google' };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/sign-in');
}

export async function resetPassword(email: string) {
  const rate = await checkRateLimit(
    `auth:reset:${email.toLowerCase()}`,
    RateLimitConfig.strict.limit,
    RateLimitConfig.strict.windowSeconds,
    true
  );
  if (!rate.success) {
    return { error: 'Muitas tentativas. Aguarde um momento.' };
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin =
    headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Email de recuperação enviado!' };
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const clientId = await getClientIdentifierFromHeaders();
  const rate = await checkRateLimit(
    `auth:update-password:${clientId}`,
    RateLimitConfig.strict.limit,
    RateLimitConfig.strict.windowSeconds,
    true
  );
  if (!rate.success) {
    return { error: 'Muitas tentativas. Aguarde um momento.' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: 'Usuário não autenticado' };
  }

  // Re-autenticação obrigatória
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) {
    return { error: 'Senha atual incorreta' };
  }

  const validation = passwordSchema.safeParse(newPassword);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Senha atualizada com sucesso!' };
}

/** Usado após reset de senha por token (não exige senha atual). */
export async function setNewPasswordAfterReset(newPassword: string) {
  const clientId = await getClientIdentifierFromHeaders();
  const rate = await checkRateLimit(
    `auth:reset-set:${clientId}`,
    RateLimitConfig.strict.limit,
    RateLimitConfig.strict.windowSeconds,
    true
  );
  if (!rate.success) {
    return { error: 'Muitas tentativas. Aguarde um momento.' };
  }

  const validation = passwordSchema.safeParse(newPassword);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: 'Senha atualizada com sucesso!' };
}
