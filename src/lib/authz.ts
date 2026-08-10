import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Retorna o usuário autenticado (sessão Supabase) ou um erro.
 * Helper genérico de sessão — a autorização por restaurante fica em
 * `@/lib/restaurant-access` (RBAC de membros). Os antigos helpers "só-dono"
 * (userOwnsRestaurant, getOwnedCategory, getOwnedProduct, userOwnsTable,
 * userOwnsReviewRestaurant, getUserRestaurant) foram removidos após a
 * convergência para o RBAC (ver docs/auditoria-2026-08-10.md, achado #1).
 */
export async function getCurrentUser(): Promise<{ user?: User; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: 'Usuario nao autenticado' };
  }

  return { user };
}
