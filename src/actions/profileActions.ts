// src/actions/profileActions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  UserPrivacySettings,
  UserPreferences,
  SavedAddressProfile,
} from '@/types/user-profile.types';
import { z } from 'zod';

export interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  authProvider: string;
  createdAt: string;
}

// ============================================================================
// PERFIL BASICO
// ============================================================================

export async function getProfile(): Promise<{ data?: ProfileData; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Usuario nao autenticado' };

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  const authProvider = user.app_metadata?.provider || 'email';

  return {
    data: {
      id: user.id,
      fullName: profile?.full_name || '',
      email: user.email || '',
      phone: profile?.phone || '',
      avatarUrl: profile?.avatar_url || '',
      authProvider,
      createdAt: user.created_at,
    },
  };
}

export async function getUserProfile() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuario nao autenticado', data: null };

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });

    // Ensure profile exists (create if first login)
    if (!profile) {
      const created = await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { data: created as any, error: null };
    }

    // Prisma returns snake_case field names — same as Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data: profile as any, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { error: 'Erro ao buscar perfil', data: null };
  }
}

const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  full_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
});

export async function updateProfile(
  formData: z.infer<typeof updateProfileSchema>
): Promise<{ success?: boolean; error?: string }> {
  const validation = updateProfileSchema.safeParse(formData);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }
  const data = validation.data;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Usuario nao autenticado' };

  const fullName = formData.fullName || formData.full_name;

  try {
    await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        ...(fullName ? { full_name: fullName } : {}),
        ...(formData.phone ? { phone: formData.phone } : {}),
        ...(formData.avatar_url ? { avatar_url: formData.avatar_url } : {}),
      },
      create: {
        id: user.id,
        email: user.email || '',
        full_name: fullName || null,
        phone: formData.phone || null,
        avatar_url: formData.avatar_url || null,
      },
    });

    if (fullName) {
      await supabase.auth.updateUser({ data: { full_name: fullName } });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { error: 'Erro ao atualizar perfil' };
  }
}

export async function updateUserProfile(updates: z.infer<typeof updateProfileSchema>) {
  return updateProfile(updates);
}

// ============================================================================
// PRIVACIDADE
// ============================================================================

export async function getUserPrivacySettings(): Promise<{
  data?: UserPrivacySettings;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuario nao autenticado' };

    let settings = await prisma.userPrivacySettings.findUnique({ where: { user_id: user.id } });

    if (!settings) {
      settings = await prisma.userPrivacySettings.create({
        data: { user_id: user.id },
      });
    }

    return {
      data: {
        showProfile: settings.show_profile,
        showOrderHistory: settings.show_order_history,
        allowMarketing: settings.allow_marketing,
        allowNotifications: settings.allow_notifications,
        dataSharing: settings.data_sharing,
        twoFactorEnabled: settings.two_factor_enabled,
      },
    };
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    return { error: 'Erro ao buscar privacidade' };
  }
}

const privacySettingsSchema = z.object({
  showProfile: z.boolean().optional(),
  showOrderHistory: z.boolean().optional(),
  allowMarketing: z.boolean().optional(),
  allowNotifications: z.boolean().optional(),
  dataSharing: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
});

export async function updateUserPrivacySettings(
  settings: z.infer<typeof privacySettingsSchema>
): Promise<{ success?: boolean; error?: string }> {
  const validation = privacySettingsSchema.safeParse(settings);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }
  const data = validation.data;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuario nao autenticado' };

    await prisma.userPrivacySettings.upsert({
      where: { user_id: user.id },
      update: {
        ...(data.showProfile !== undefined ? { show_profile: data.showProfile } : {}),
        ...(data.showOrderHistory !== undefined
          ? { show_order_history: data.showOrderHistory }
          : {}),
        ...(data.allowMarketing !== undefined ? { allow_marketing: data.allowMarketing } : {}),
        ...(data.allowNotifications !== undefined
          ? { allow_notifications: data.allowNotifications }
          : {}),
        ...(data.dataSharing !== undefined ? { data_sharing: data.dataSharing } : {}),
        ...(data.twoFactorEnabled !== undefined
          ? { two_factor_enabled: data.twoFactorEnabled }
          : {}),
      },
      create: {
        user_id: user.id,
        show_profile: data.showProfile ?? true,
        show_order_history: data.showOrderHistory ?? true,
        allow_marketing: data.allowMarketing ?? true,
        allow_notifications: data.allowNotifications ?? true,
        data_sharing: data.dataSharing ?? false,
        two_factor_enabled: data.twoFactorEnabled ?? false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating privacy:', error);
    return { error: 'Erro ao atualizar privacidade' };
  }
}

// ============================================================================
// PREFERENCIAS
// ============================================================================

export async function getUserPreferences(): Promise<{ data?: UserPreferences; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuario nao autenticado' };

    let prefs = await prisma.userPreferences.findUnique({ where: { user_id: user.id } });

    if (!prefs) {
      prefs = await prisma.userPreferences.create({ data: { user_id: user.id } });
    }

    return {
      data: {
        dietaryRestrictions: prefs.dietary_restrictions,
        favoriteCuisines: prefs.favorite_cuisines,
        notificationOrderUpdates: prefs.notification_order_updates,
        notificationPromotions: prefs.notification_promotions,
        notificationNewsletter: prefs.notification_newsletter,
      },
    };
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return { error: 'Erro ao buscar preferencias' };
  }
}

const preferencesSchema = z.object({
  dietaryRestrictions: z.array(z.string()).optional(),
  favoriteCuisines: z.array(z.string()).optional(),
  notificationOrderUpdates: z.boolean().optional(),
  notificationPromotions: z.boolean().optional(),
  notificationNewsletter: z.boolean().optional(),
});

export async function updateUserPreferences(
  preferences: z.infer<typeof preferencesSchema>
): Promise<{ success?: boolean; error?: string }> {
  const validation = preferencesSchema.safeParse(preferences);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }
  const data = validation.data;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuario nao autenticado' };

    await prisma.userPreferences.upsert({
      where: { user_id: user.id },
      update: {
        ...(data.dietaryRestrictions ? { dietary_restrictions: data.dietaryRestrictions } : {}),
        ...(data.favoriteCuisines ? { favorite_cuisines: data.favoriteCuisines } : {}),
        ...(data.notificationOrderUpdates !== undefined
          ? { notification_order_updates: data.notificationOrderUpdates }
          : {}),
        ...(data.notificationPromotions !== undefined
          ? { notification_promotions: data.notificationPromotions }
          : {}),
        ...(data.notificationNewsletter !== undefined
          ? { notification_newsletter: data.notificationNewsletter }
          : {}),
      },
      create: {
        user_id: user.id,
        dietary_restrictions: data.dietaryRestrictions || [],
        favorite_cuisines: data.favoriteCuisines || [],
        notification_order_updates: data.notificationOrderUpdates ?? true,
        notification_promotions: data.notificationPromotions ?? true,
        notification_newsletter: data.notificationNewsletter ?? true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating preferences:', error);
    return { error: 'Erro ao atualizar preferencias' };
  }
}

// ============================================================================
// FAVORITOS
// ============================================================================

export async function getFavoriteRestaurants(): Promise<{ data?: string[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuario nao autenticado' };

    const favorites = await prisma.userFavorite.findMany({
      where: { user_id: user.id },
      select: { restaurant_id: true },
    });

    return { data: favorites.map((f) => f.restaurant_id) };
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return { error: 'Erro ao buscar favoritos' };
  }
}

export async function addFavoriteRestaurant(
  restaurantId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuario nao autenticado' };

    await prisma.userFavorite.upsert({
      where: { user_id_restaurant_id: { user_id: user.id, restaurant_id: restaurantId } },
      update: {},
      create: { user_id: user.id, restaurant_id: restaurantId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding favorite:', error);
    return { error: 'Erro ao adicionar favorito' };
  }
}

export async function removeFavoriteRestaurant(
  restaurantId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuario nao autenticado' };

    await prisma.userFavorite.deleteMany({
      where: { user_id: user.id, restaurant_id: restaurantId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing favorite:', error);
    return { error: 'Erro ao remover favorito' };
  }
}

// ============================================================================
// ENDERECOS (delegate para addresses.ts)
// ============================================================================

export async function getUserAddresses(): Promise<{
  data?: SavedAddressProfile[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuario nao autenticado' };

    const addresses = await prisma.address.findMany({
      where: { user_id: user.id },
      orderBy: { is_default: 'desc' },
    });

    return {
      data: addresses.map((addr) => ({
        id: addr.id,
        label: addr.label,
        street: addr.street,
        number: addr.number,
        complement: addr.complement || undefined,
        neighborhood: addr.neighborhood,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zip_code,
        isDefault: addr.is_default,
        instructions: addr.instructions || undefined,
      })),
    };
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return { error: 'Erro ao buscar enderecos' };
  }
}
