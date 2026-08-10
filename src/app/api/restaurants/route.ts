// src/app/api/restaurants/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRestaurantAccess, MANAGEMENT_ROLES } from '@/lib/restaurant-access';
import {
  checkRateLimit,
  getClientIp,
  RateLimitConfig,
  buildRateLimitResponse,
} from '@/lib/rate-limit';
import { ensureUserCanCreateRestaurant } from '@/actions/restaurant-creation';

const restaurantSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  cnpj: z.string().optional(),
  email: z.string().email().optional(),
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
  settings: z
    .object({
      acceptsReservation: z.boolean().optional(),
      deliveryRadius: z.number().optional(),
      minimumOrder: z.number().optional(),
      estimatedDeliveryTime: z.number().optional(),
      taxPercentage: z.number().optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `restaurants:get:${ip}`,
    RateLimitConfig.relaxed.limit,
    RateLimitConfig.relaxed.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  // Colunas publicas — NAO incluir bank_info (dados financeiros/PII)
  const publicSelect =
    'id, name, slug, subdomain, description, logo, cover_image, category, cuisine, phone, email, cnpj, street, number, complement, neighborhood, city, state, zip_code, latitude, longitude, delivery_fee, minimum_order, estimated_delivery_time, delivery_radius, status, is_active, accepting_orders, operating_hours, theme, avg_rating, review_count, created_at, updated_at';

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('id');

    if (restaurantId) {
      const { data, error } = await supabase
        .from('restaurants')
        .select(publicSelect)
        .eq('id', restaurantId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ restaurant: data });
    }

    const { data, error } = await supabase
      .from('restaurants')
      .select(publicSelect)
      .eq('is_active', true)
      .order('name');

    if (error) {
      return NextResponse.json({ error: 'Erro ao carregar restaurantes' }, { status: 500 });
    }

    return NextResponse.json({ restaurants: data || [] });
  } catch (error) {
    console.error('GET restaurants error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `crud:restaurants:${ip}`,
    RateLimitConfig.moderate.limit,
    RateLimitConfig.moderate.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  try {
    const check = await ensureUserCanCreateRestaurant();
    if (check.error) {
      return NextResponse.json({ error: check.error }, { status: 403 });
    }

    const supabase = await createClient();

    const body = await request.json();

    const result = restaurantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        ...result.data,
        user_id: check.userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao criar restaurante' }, { status: 400 });
    }

    return NextResponse.json({ restaurant: data, success: true }, { status: 201 });
  } catch (error) {
    console.error('POST restaurant error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `crud:restaurants:put:${ip}`,
    RateLimitConfig.moderate.limit,
    RateLimitConfig.moderate.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  try {
    const supabase = await createClient();

    const access = await getRestaurantAccess(MANAGEMENT_ROLES);
    if (access.error || !access.data) {
      return NextResponse.json({ error: access.error || 'Não autorizado' }, { status: 403 });
    }
    const restaurantId = access.data.restaurant.id;

    const body = await request.json();

    const updateResult = restaurantSchema.safeParse(body);
    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error.issues[0].message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('restaurants')
      .update(updateResult.data)
      .eq('id', restaurantId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar restaurante' }, { status: 400 });
    }

    return NextResponse.json({ restaurant: data, success: true });
  } catch (error) {
    console.error('PUT restaurant error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `crud:restaurants:del:${ip}`,
    RateLimitConfig.moderate.limit,
    RateLimitConfig.moderate.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  try {
    const supabase = await createClient();

    // Excluir o restaurante é destrutivo — OWNER-only.
    const access = await getRestaurantAccess(['OWNER']);
    if (access.error || !access.data) {
      return NextResponse.json({ error: access.error || 'Não autorizado' }, { status: 403 });
    }

    const { error } = await supabase
      .from('restaurants')
      .update({ is_active: false })
      .eq('id', access.data.restaurant.id);

    if (error) {
      return NextResponse.json({ error: 'Erro ao excluir restaurante' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE restaurant error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
