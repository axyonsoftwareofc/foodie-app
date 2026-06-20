// src/lib/auth.ts
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export const getServerSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { user };
});

export const requireAuth = cache(async () => {
  const session = await getServerSession();
  if (!session) {
    redirect('/sign-in');
  }
  return session;
});
