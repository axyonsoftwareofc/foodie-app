'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { redisDel, cacheKey } from '@/lib/redis';
import { cookies } from 'next/headers';
import { RESERVED_SUBDOMAINS } from '@/lib/validations/tenant.validations';
import { ensureOwnerMembership } from '@/lib/restaurant-access';
import {
  ensureUserCanCreateRestaurant,
  upgradeUserToOwner,
  applyMenuTemplate,
} from '@/actions/restaurant-creation';

export async function checkSubdomainAvailability(
  subdomain: string
): Promise<{ available: boolean; error?: string }> {
  if (!subdomain || subdomain.length < 3) {
    return { available: false, error: 'Subdominio muito curto' };
  }

  if (RESERVED_SUBDOMAINS.includes(subdomain)) {
    return { available: false, error: 'Subdominio reservado' };
  }

  try {
    const existing = await prisma.restaurant.findUnique({
      where: { subdomain },
      select: { id: true },
    });

    return { available: !existing };
  } catch {
    return { available: false, error: 'Erro ao verificar disponibilidade' };
  }
}

interface CreateTenantInput {
  name: string;
  category: string;
  cnpj?: string;
  phone: string;
  email?: string;
  description?: string;
  subdomain: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  deliveryRadius: number;
  logo?: string;
  coverImage?: string;
  primaryColor: string;
}

export async function createTenant(
  data: CreateTenantInput
): Promise<{ success?: boolean; error?: string; restaurantId?: string }> {
  const check = await ensureUserCanCreateRestaurant();
  if (check.error) return { error: check.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Voce precisa estar logado para criar um restaurante' };

  const subdomainTaken = await prisma.restaurant.findUnique({
    where: { subdomain: data.subdomain },
    select: { id: true },
  });

  if (subdomainTaken) {
    return { error: 'Este subdominio ja esta em uso' };
  }

  const slug = data.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 60);

  const existingSlug = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true },
  });

  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

  try {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: data.name,
        slug: finalSlug,
        subdomain: data.subdomain,
        user_id: user.id,
        cnpj: data.cnpj || null,
        category: data.category,
        phone: data.phone,
        email: data.email || null,
        description: data.description || null,
        logo: data.logo || null,
        cover_image: data.coverImage || null,
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zip_code: data.cep,
        delivery_radius: data.deliveryRadius,
        delivery_fee: 5,
        minimum_order: 0,
        estimated_delivery_time: 40,
        status: 'CLOSED',
        is_active: true,
        operating_hours: [
          { day: 'monday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { day: 'tuesday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { day: 'wednesday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { day: 'thursday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { day: 'friday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
          { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '22:00' },
          { day: 'sunday', isOpen: true, openTime: '09:00', closeTime: '21:00' },
        ],
      },
    });

    await prisma.profile.upsert({
      where: { id: user.id },
      update: { role: 'GERENCIADOR' },
      create: {
        id: user.id,
        email: user.email || '',
        role: 'GERENCIADOR',
      },
    });

    // Materializa o membro OWNER na criação (a autorização é leitura pura e
    // não provisiona). O profile ja foi promovido logo acima.
    await ensureOwnerMembership(
      { id: user.id, email: user.email || '', user_metadata: user.user_metadata },
      restaurant.id
    );

    const templateId = (data as { templateId?: string }).templateId;

    if (templateId) {
      await applyMenuTemplate(restaurant.id, templateId);
    } else {
      const defaultCategories = [
        { name: 'Lanches', sort_order: 0 },
        { name: 'Bebidas', sort_order: 1 },
        { name: 'Sobremesas', sort_order: 2 },
      ];

      for (const cat of defaultCategories) {
        await prisma.category.create({
          data: {
            restaurant_id: restaurant.id,
            name: cat.name,
            sort_order: cat.sort_order,
          },
        });
      }
    }

    const cookieStore = await cookies();
    cookieStore.set('restaurantId', restaurant.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    void redisDel(cacheKey('restaurants', 'public-list'));

    return { success: true, restaurantId: restaurant.id };
  } catch (error) {
    console.error('Error creating tenant:', error);
    return { error: 'Erro ao criar restaurante. Tente novamente.' };
  }
}
