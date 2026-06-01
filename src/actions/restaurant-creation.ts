// src/actions/restaurant-creation.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { canUserCreateRestaurant } from '@/lib/restaurant-access';
import { populateRestaurantTemplate } from '@/actions/restaurant-template-actions';
import { UserRole } from '@prisma/client';

export async function ensureUserCanCreateRestaurant(): Promise<{
  userId: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { userId: '', error: 'Usuário não autenticado' };
  }

  const canCreate = await canUserCreateRestaurant(user.id);
  if (!canCreate.allowed) {
    return { userId: '', error: canCreate.error || 'Você não pode criar um restaurante' };
  }

  return { userId: user.id };
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
