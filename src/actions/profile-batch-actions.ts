// src/actions/profile-batch-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function getProfileBatch(): Promise<{
  data?: {
    profile: {
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      avatar_url: string | null;
      created_at: string | null;
      phone?: string | null;
    } | null;
    privacy: {
      showProfile: boolean;
      showOrderHistory: boolean;
      allowMarketing: boolean;
      allowNotifications: boolean;
      dataSharing: boolean;
      twoFactorEnabled: boolean;
    } | null;
    favoritesCount: number;
  };
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Usuario nao autenticado' };

  const [profile, settings, favorites] = await Promise.all([
    prisma.profile.findUnique({ where: { id: user.id } }),
    prisma.userPrivacySettings.findUnique({ where: { user_id: user.id } }),
    prisma.userFavorite.count({ where: { user_id: user.id } }),
  ]);

  return {
    data: {
      profile: profile
        ? {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name ?? null,
            role: profile.role,
            avatar_url: profile.avatar_url ?? null,
            phone: profile.phone ?? null,
            created_at: profile.created_at?.toISOString?.() ?? null,
          }
        : null,
      privacy: settings
        ? {
            showProfile: settings.show_profile,
            showOrderHistory: settings.show_order_history,
            allowMarketing: settings.allow_marketing,
            allowNotifications: settings.allow_notifications,
            dataSharing: settings.data_sharing,
            twoFactorEnabled: settings.two_factor_enabled,
          }
        : null,
      favoritesCount: favorites,
    },
  };
}
