// src/actions/restaurantActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  ensureUserCanCreateRestaurant,
  upgradeUserToOwner,
  applyMenuTemplate,
} from '@/actions/restaurant-creation';
import { z } from 'zod';
import {
  getCurrentUser,
  userOwnsRestaurant,
  userOwnsReviewRestaurant,
  userOwnsTable,
} from '@/lib/authz';
import { parseOperatingHours } from '@/lib/utils/restaurant.utils';
import { redisDel, redisGet, redisSet, cacheKey } from '@/lib/redis';
import {
  CreateRestaurantForm,
  RestaurantProfile,
  RestaurantTable,
  BankInfo,
  Review,
  RestaurantStatus,
  OperatingHours,
} from '@/types/restaurant-management.types';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const restaurantSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  logo: z.string().url().optional().or(z.literal('')),
  coverImage: z.string().url().optional().or(z.literal('')),
  cnpj: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  openingHours: z
    .array(
      z.object({
        day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
        isOpen: z.boolean(),
        openTime: z.string().optional(),
        closeTime: z.string().optional(),
      })
    )
    .optional(),
  acceptsReservation: z.boolean().optional(),
  deliveryRadius: z.number().optional(),
  minimumOrder: z.number().optional(),
  estimatedDeliveryTime: z.number().optional(),
  taxPercentage: z.number().optional(),
});

// ============================================================================
// FUNÇÕES DE LEITURA (GET)
// ============================================================================

export async function getPublicRestaurants(): Promise<{
  data?: import('@/types').Restaurant[];
  error?: string;
}> {
  try {
    const CACHE_KEY = cacheKey('restaurants', 'public-list');
    const cached = await redisGet<import('@/types').Restaurant[]>(CACHE_KEY);
    if (cached) {
      return { data: cached };
    }

    const restaurants = await prisma.restaurant.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });

    const result: import('@/types').Restaurant[] = restaurants.map((r) => {
      const avgRating = Math.round(r.avg_rating * 10) / 10;

      const time = r.estimated_delivery_time ?? 30;

      return {
        id: r.id,
        name: r.name,
        image: r.cover_image || r.logo || '/placeholder.png',
        rating: avgRating,
        reviewCount: r.review_count,
        deliveryTime: `${time}-${time + 10} min`,
        deliveryFee: r.delivery_fee ?? 0,
        category: r.category || r.cuisine || 'Restaurante',
        promoted: false,
        isOpen: r.status === 'OPEN',
        isActive: r.is_active,
        cnpj: r.cnpj || undefined,
        openingHours: parseOperatingHours(r.operating_hours),
        settings: {
          deliveryRadius: r.delivery_radius ?? undefined,
          minimumOrder: r.minimum_order ?? undefined,
          estimatedDeliveryTime: r.estimated_delivery_time ?? undefined,
        },
        description: r.description || undefined,
        logo: r.logo || undefined,
        coverImage: r.cover_image || undefined,
        street: r.street || undefined,
        number: r.number || undefined,
        neighborhood: r.neighborhood || undefined,
        city: r.city || undefined,
        state: r.state || undefined,
        zipCode: r.zip_code || undefined,
        latitude: r.latitude ?? undefined,
        longitude: r.longitude ?? undefined,
      };
    });

    void redisSet(CACHE_KEY, result, 300);
    return { data: result };
  } catch (error) {
    console.error('Error fetching public restaurants:', error);
    return { error: 'Erro ao carregar restaurantes' };
  }
}

export async function getRestaurant(restaurantId?: string) {
  const supabase = await createClient();

  const publicSelect =
    'id, name, slug, subdomain, description, logo, cover_image, category, cuisine, phone, street, number, complement, neighborhood, city, state, zip_code, latitude, longitude, delivery_fee, minimum_order, estimated_delivery_time, delivery_radius, status, is_active, operating_hours, theme, created_at, updated_at';

  if (restaurantId) {
    const { data, error } = await supabase
      .from('restaurants')
      .select(publicSelect)
      .eq('id', restaurantId)
      .single();

    if (error) {
      return { error: error.message, restaurant: null };
    }

    return { restaurant: data, error: null };
  } else {
    const { data, error } = await supabase
      .from('restaurants')
      .select(publicSelect)
      .limit(1)
      .single();

    if (error) {
      return { error: error.message, restaurant: null };
    }

    return { restaurant: data, error: null };
  }
}

export async function getRestaurantProfile(): Promise<{
  data?: RestaurantProfile;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const r = await prisma.restaurant.findFirst({
      where: { user_id: user.id, is_active: true },
    });

    if (!r) {
      return { error: 'Restaurante nao encontrado' };
    }

    const data: RestaurantProfile = {
      id: r.id,
      userId: r.user_id,
      name: r.name,
      slug: r.slug || '',
      description: r.description || '',
      category: r.category || '',
      cuisine: r.cuisine ? [r.cuisine] : [],
      images: { logo: r.logo || '', banner: r.cover_image || '', gallery: [] },
      contact: { phone: r.phone || '', email: r.email || '' },
      address: {
        street: r.street || '',
        number: r.number || '',
        complement: r.complement || undefined,
        neighborhood: r.neighborhood || '',
        city: r.city || '',
        state: r.state || '',
        zipCode: r.zip_code || '',
        country: 'BR',
      },
      location: { latitude: r.latitude || 0, longitude: r.longitude || 0 },
      operatingHours: (r.operating_hours as unknown as OperatingHours[]) || [],
      status: (r.status as RestaurantStatus) || 'CLOSED',
      deliveryFee: r.delivery_fee || 0,
      minimumOrder: r.minimum_order || 0,
      estimatedDeliveryTime: r.estimated_delivery_time || 40,
      acceptsReservation: false,
      tables: [],
      bankInfo: (r.bank_info as unknown as BankInfo) || {
        bank: '',
        agency: '',
        account: '',
        accountType: 'checking',
        pixKey: '',
        pixKeyType: 'email',
        holderName: '',
        document: '',
      },
      rating: 0,
      reviewCount: 0,
      theme: typeof r.theme === 'string' ? r.theme : r.theme ? JSON.stringify(r.theme) : undefined,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };

    return { data };
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return { error: 'Erro ao buscar restaurante' };
  }
}

export async function getAllRestaurants() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    return { error: error.message, restaurants: [] };
  }

  return { restaurants: data || [], error: null };
}

// ============================================================================
// FUNÇÕES DE CRIAÇÃO (CREATE)
// ============================================================================

export async function createRestaurant(
  data: CreateRestaurantForm
): Promise<{ data?: RestaurantProfile; error?: string }> {
  try {
    const check = await ensureUserCanCreateRestaurant();
    if (check.error) return { error: check.error };

    const supabase = await createClient();

    const slug = data.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const subdomain = data.subdomain || slug.slice(0, 30);

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
        user_id: check.userId,
        name: data.name,
        slug,
        subdomain,
        description: data.description,
        category: data.category,
        cuisine: data.cuisine,
        phone: data.phone,
        email: data.email,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        delivery_fee: data.deliveryFee,
        minimum_order: data.minimumOrder,
        estimated_delivery_time: data.estimatedDeliveryTime,
        status: 'CLOSED' as RestaurantStatus,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    void redisDel(cacheKey('restaurants', 'public-list'));

    return { data: restaurant };
  } catch (error) {
    console.error('Error creating restaurant:', error);
    return { error: 'Erro ao criar restaurante' };
  }
}

export async function createRestaurantFromFormData(formData: FormData) {
  const check = await ensureUserCanCreateRestaurant();
  if (check.error) return { error: check.error };

  const supabase = await createClient();

  const data = {
    name: formData.get('name'),
    description: formData.get('description') || null,
    logo: formData.get('logo') || null,
    coverImage: formData.get('coverImage') || null,
    cnpj: formData.get('cnpj') || null,
    email: formData.get('email') || null,
    phone: formData.get('phone') || null,
    whatsapp: formData.get('whatsapp') || null,
    street: formData.get('street') || null,
    number: formData.get('number') || null,
    complement: formData.get('complement') || null,
    neighborhood: formData.get('neighborhood') || null,
    city: formData.get('city') || null,
    state: formData.get('state') || null,
    zipCode: formData.get('zipCode') || null,
    openingHours: formData.get('openingHours')
      ? JSON.parse(formData.get('openingHours') as string)
      : null,
    settings: {
      acceptsReservation: formData.get('acceptsReservation') === 'true',
      deliveryRadius: Number(formData.get('deliveryRadius')) || 5,
      minimumOrder: Number(formData.get('minimumOrder')) || 0,
      estimatedDeliveryTime: Number(formData.get('estimatedDeliveryTime')) || 45,
      taxPercentage: Number(formData.get('taxPercentage')) || 0,
    },
    isActive: true,
  };

  const result = restaurantSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .insert({
      ...result.data,
      user_id: check.userId,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { restaurant, success: true };
}

// ============================================================================
// FUNÇÕES DE ATUALIZAÇÃO (UPDATE)
// ============================================================================

export async function updateRestaurantProfile(
  data: Partial<RestaurantProfile>
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { user_id: user.id, is_active: true },
      select: { id: true },
    });

    if (!restaurant) {
      return { error: 'Restaurante nao encontrado' };
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.deliveryFee !== undefined) updateData.delivery_fee = data.deliveryFee;
    if (data.minimumOrder !== undefined) updateData.minimum_order = data.minimumOrder;
    if (data.estimatedDeliveryTime !== undefined)
      updateData.estimated_delivery_time = data.estimatedDeliveryTime;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.acceptsReservation !== undefined)
      updateData.accepts_reservation = data.acceptsReservation;
    if (data.contact?.phone !== undefined) updateData.phone = data.contact.phone;
    if (data.contact?.email !== undefined) updateData.email = data.contact.email;
    if (data.images?.logo !== undefined) updateData.logo = data.images.logo;
    if (data.images?.banner !== undefined) updateData.cover_image = data.images.banner;
    if (data.address?.street !== undefined) updateData.street = data.address.street;
    if (data.address?.number !== undefined) updateData.number = data.address.number;
    if (data.address?.neighborhood !== undefined)
      updateData.neighborhood = data.address.neighborhood;
    if (data.address?.city !== undefined) updateData.city = data.address.city;
    if (data.address?.state !== undefined) updateData.state = data.address.state;
    if (data.address?.zipCode !== undefined) updateData.zip_code = data.address.zipCode;
    if (data.location?.latitude !== undefined) updateData.latitude = data.location.latitude;
    if (data.location?.longitude !== undefined) updateData.longitude = data.location.longitude;
    if (data.operatingHours !== undefined) updateData.operating_hours = data.operatingHours;
    if (data.bankInfo !== undefined) updateData.bank_info = data.bankInfo;
    if (data.theme !== undefined) updateData.theme = data.theme;

    // Support flat fields passed directly (from settings page)
    const flatData = data as Record<string, unknown>;
    if (flatData.cnpj !== undefined) updateData.cnpj = flatData.cnpj;
    if (flatData.phone !== undefined && !updateData.phone) updateData.phone = flatData.phone;
    if (flatData.email !== undefined && !updateData.email) updateData.email = flatData.email;
    if (flatData.street !== undefined && !updateData.street) updateData.street = flatData.street;
    if (flatData.number !== undefined && !updateData.number) updateData.number = flatData.number;
    if (flatData.city !== undefined && !updateData.city) updateData.city = flatData.city;
    if (flatData.state !== undefined && !updateData.state) updateData.state = flatData.state;
    if (flatData.neighborhood !== undefined && !updateData.neighborhood)
      updateData.neighborhood = flatData.neighborhood;

    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: updateData,
    });

    void redisDel(cacheKey('restaurants', 'public-list'));

    return { success: true };
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return { error: 'Erro ao atualizar restaurante' };
  }
}

export async function updateRestaurant(restaurantId: string, formData: FormData) {
  const supabase = await createClient();
  const { user, error: authError } = await getCurrentUser();

  if (authError || !user) {
    return { error: authError || 'Usuário não autenticado' };
  }

  if (!(await userOwnsRestaurant(user.id, restaurantId))) {
    return { error: 'Não autorizado ou restaurante não encontrado' };
  }

  const data = {
    name: formData.get('name'),
    description: formData.get('description') || null,
    logo: formData.get('logo') || null,
    coverImage: formData.get('coverImage') || null,
    cnpj: formData.get('cnpj') || null,
    email: formData.get('email') || null,
    phone: formData.get('phone') || null,
    whatsapp: formData.get('whatsapp') || null,
    street: formData.get('street') || null,
    number: formData.get('number') || null,
    complement: formData.get('complement') || null,
    neighborhood: formData.get('neighborhood') || null,
    city: formData.get('city') || null,
    state: formData.get('state') || null,
    zipCode: formData.get('zipCode') || null,
    openingHours: formData.get('openingHours')
      ? JSON.parse(formData.get('openingHours') as string)
      : null,
    settings: {
      acceptsReservation: formData.get('acceptsReservation') === 'true',
      deliveryRadius: Number(formData.get('deliveryRadius')) || 5,
      minimumOrder: Number(formData.get('minimumOrder')) || 0,
      estimatedDeliveryTime: Number(formData.get('estimatedDeliveryTime')) || 45,
      taxPercentage: Number(formData.get('taxPercentage')) || 0,
    },
  };

  const result = restaurantSchema.safeParse(data);

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .update(result.data)
    .eq('id', restaurantId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { restaurant, success: true };
}

export async function updateRestaurantStatus(
  status: RestaurantStatus
): Promise<{ success?: boolean; error?: string }> {
  return updateRestaurantProfile({ status });
}

export async function toggleRestaurantStatus(restaurantId: string, isActive: boolean) {
  const { user, error: authError } = await getCurrentUser();

  if (authError || !user) {
    return { error: authError || 'Usuário não autenticado' };
  }

  if (!(await userOwnsRestaurant(user.id, restaurantId))) {
    return { error: 'Não autorizado ou restaurante não encontrado' };
  }

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { is_active: isActive },
  });

  void redisDel(cacheKey('restaurants', 'public-list'));
  return { success: true };
}

export async function updateOperatingHours(
  hours: OperatingHours[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { user_id: user.id, is_active: true },
      select: { id: true },
    });

    if (!restaurant) {
      return { error: 'Restaurante nao encontrado' };
    }

    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { operating_hours: hours as unknown as Prisma.InputJsonValue },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating hours:', error);
    return { error: 'Erro ao atualizar horário de funcionamento' };
  }
}

export async function updateBankInfo(
  info: BankInfo
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { user_id: user.id, is_active: true },
      select: { id: true },
    });

    if (!restaurant) {
      return { error: 'Restaurante nao encontrado' };
    }

    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { bank_info: info as unknown as Prisma.InputJsonValue },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating bank info:', error);
    return { error: 'Erro ao atualizar informações bancárias' };
  }
}

// ============================================================================
// FUNÇÕES DE EXCLUSÃO (DELETE)
// ============================================================================

export async function deleteRestaurant(restaurantId: string) {
  const supabase = await createClient();
  const { user, error: authError } = await getCurrentUser();

  if (authError || !user) {
    return { error: authError || 'Usuário não autenticado' };
  }

  if (!(await userOwnsRestaurant(user.id, restaurantId))) {
    return { error: 'Não autorizado ou restaurante não encontrado' };
  }

  const { error } = await supabase
    .from('restaurants')
    .update({ is_active: false })
    .eq('id', restaurantId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ============================================================================
// MESAS (TABLES)
// ============================================================================

export async function getTables(): Promise<{ data?: RestaurantTable[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!restaurant) {
      return { data: [] };
    }

    const { data, error } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('number');

    if (error) {
      return { error: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error fetching tables:', error);
    return { error: 'Erro ao buscar mesas' };
  }
}

export async function createTable(
  data: Omit<RestaurantTable, 'id'>
): Promise<{ data?: RestaurantTable; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!restaurant) {
      return { error: 'Restaurante não encontrado' };
    }

    const { data: table, error } = await supabase
      .from('restaurant_tables')
      .insert({
        ...data,
        restaurant_id: restaurant.id,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: table };
  } catch (error) {
    console.error('Error creating table:', error);
    return { error: 'Erro ao criar mesa' };
  }
}

export async function updateTableStatus(
  tableId: string,
  status: RestaurantTable['status']
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      return { error: authError || 'Usuário não autenticado' };
    }

    if (!(await userOwnsTable(user.id, tableId))) {
      return { error: 'Não autorizado ou mesa não encontrada' };
    }

    const { error } = await supabase.from('restaurant_tables').update({ status }).eq('id', tableId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating table:', error);
    return { error: 'Erro ao atualizar mesa' };
  }
}

export async function deleteTable(tableId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      return { error: authError || 'Usuário não autenticado' };
    }

    if (!(await userOwnsTable(user.id, tableId))) {
      return { error: 'Não autorizado ou mesa não encontrada' };
    }

    const { error } = await supabase.from('restaurant_tables').delete().eq('id', tableId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting table:', error);
    return { error: 'Erro ao excluir mesa' };
  }
}

// ============================================================================
// AVALIAÇÕES (REVIEWS)
// ============================================================================

export async function getRestaurantReviews(
  restaurantId: string
): Promise<{ data?: Review[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      return { error: authError || 'Usuário não autenticado' };
    }

    if (!(await userOwnsRestaurant(user.id, restaurantId))) {
      return { error: 'Não autorizado ou restaurante não encontrado' };
    }

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { error: error.message };
    }

    return {
      data: (data || []).map((review) => ({
        id: review.id,
        restaurantId: review.restaurant_id,
        orderId: review.order_id || '',
        userId: review.user_id,
        userName: 'Cliente',
        rating: review.rating,
        comment: review.comment || '',
        response: review.response || undefined,
        createdAt: review.created_at || new Date().toISOString(),
        helpful: 0,
      })),
    };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { error: 'Erro ao buscar avaliações' };
  }
}

export async function respondToReview(
  reviewId: string,
  response: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      return { error: authError || 'Usuário não autenticado' };
    }

    if (!(await userOwnsReviewRestaurant(user.id, reviewId))) {
      return { error: 'Não autorizado ou avaliação não encontrada' };
    }

    const { error } = await supabase
      .from('reviews')
      .update({
        response,
        responded_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error responding to review:', error);
    return { error: 'Erro ao responder avaliação' };
  }
}

// ============================================================================
// REGISTRO DE RESTAURANTE
// ============================================================================

export type FormState = {
  error?: string;
  success?: boolean;
};

export async function registerRestaurant(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Você precisa estar logado para registrar um restaurante.' };
  }

  const name = formData.get('name') as string;
  let subdomain = formData.get('subdomain') as string;
  const cnpj = (formData.get('cnpj') as string) || undefined;

  if (!name || !subdomain) {
    return { error: 'Nome e Subdomínio são obrigatórios.' };
  }

  subdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // ✅ Gerar slug a partir do nome
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  try {
    // Verificar subdomain
    const existingSubdomain = await prisma.restaurant.findUnique({
      where: { subdomain },
    });

    if (existingSubdomain) {
      return { error: 'Este subdomínio já está em uso. Escolha outro.' };
    }

    // Verificar slug
    const existingSlug = await prisma.restaurant.findUnique({
      where: { slug },
    });

    const baseData = { name, subdomain, user_id: user.id, cnpj };

    if (existingSlug) {
      // Adicionar número ao slug
      const timestamp = Date.now();
      const uniqueSlug = `${slug}-${timestamp}`;

      await prisma.restaurant.create({
        data: {
          ...baseData,
          slug: uniqueSlug,
        },
      });
    } else {
      await prisma.restaurant.create({
        data: {
          ...baseData,
          slug,
        },
      });
    }

    const cookieStore = await cookies();
    const restaurant = await prisma.restaurant.findUnique({
      where: { subdomain },
    });

    if (restaurant) {
      cookieStore.set('restaurantId', restaurant.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao registrar restaurante:', error);
    return { error: 'Ocorreu um erro interno ao criar sua conta. Tente novamente.' };
  }
}
