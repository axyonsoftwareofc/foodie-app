// src/actions/restaurant-creation.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { canUserCreateRestaurant, ensureOwnerMembership } from '@/lib/restaurant-access';
import { populateRestaurantTemplate } from '@/actions/restaurant-template-actions';
import { UserRole } from '@prisma/client';

export async function ensureUserCanCreateRestaurant(): Promise<{
  userId: string;
  email: string;
  fullName: string | null;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { userId: '', email: '', fullName: null, error: 'Usuário não autenticado' };
  }

  const canCreate = await canUserCreateRestaurant(user.id);
  if (!canCreate.allowed) {
    return {
      userId: '',
      email: '',
      fullName: null,
      error: canCreate.error || 'Você não pode criar um restaurante',
    };
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
  };
}

/**
 * Provisiona o dono de um restaurante recém-criado: cria o membro OWNER e
 * promove a role global. É o lugar certo para essa escrita — a autorização
 * (`getRestaurantAccess`) é leitura pura e não provisiona nada.
 */
export async function provisionRestaurantOwner(params: {
  userId: string;
  email: string;
  fullName?: string | null;
  restaurantId: string;
}): Promise<void> {
  await ensureOwnerMembership(
    {
      id: params.userId,
      email: params.email,
      user_metadata: params.fullName ? { full_name: params.fullName } : undefined,
    },
    params.restaurantId
  );
  await upgradeUserToOwner(params.userId);
}

export async function upgradeUserToOwner(userId: string): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!profile || profile.role === UserRole.CLIENTE) {
    await prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId, email: '', role: UserRole.GERENCIADOR },
      update: { role: UserRole.GERENCIADOR },
    });
  }
}

export async function applyMenuTemplate(
  restaurantId: string,
  templateId?: string | null
): Promise<void> {
  if (!templateId) return;
  await populateRestaurantTemplate(restaurantId, templateId);
}
