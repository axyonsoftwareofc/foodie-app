// src/app/api/categories/route.ts
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

const categorySchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().url().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `categories:get:${ip}`,
    RateLimitConfig.relaxed.limit,
    RateLimitConfig.relaxed.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const categoryId = searchParams.get('id');

    if (categoryId) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
      }

      return NextResponse.json({ category: data });
    }

    if (!restaurantId) {
      return NextResponse.json({ error: 'ID do restaurante é obrigatório' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Erro ao carregar categorias' }, { status: 500 });
    }

    return NextResponse.json({ categories: data || [] });
  } catch (error) {
    console.error('GET categories error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `crud:categories:${ip}`,
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

    const body = await request.json();

    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        restaurant_id: access.data.restaurant.id,
        name: result.data.name,
        description: result.data.description,
        icon: result.data.icon,
        image: result.data.image,
        sort_order: result.data.sortOrder || 0,
        is_active: result.data.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 400 });
    }

    return NextResponse.json({ category: data, success: true }, { status: 201 });
  } catch (error) {
    console.error('POST category error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `crud:categories:put:${ip}`,
    RateLimitConfig.moderate.limit,
    RateLimitConfig.moderate.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json({ error: 'ID da categoria é obrigatório' }, { status: 400 });
    }

    const access = await getRestaurantAccess(MANAGEMENT_ROLES);
    if (access.error || !access.data) {
      return NextResponse.json({ error: access.error || 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();

    const { data: categoryOwner } = await supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .eq('restaurant_id', access.data.restaurant.id)
      .single();
    if (!categoryOwner) {
      return NextResponse.json(
        { error: 'Não autorizado ou categoria não encontrada' },
        { status: 403 }
      );
    }

    const updateResult = categorySchema.safeParse({
      ...body,
      restaurantId: access.data.restaurant.id,
    });
    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error.issues[0].message }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: updateResult.data.name,
        description: updateResult.data.description,
        icon: updateResult.data.icon,
        image: updateResult.data.image,
        sort_order: updateResult.data.sortOrder,
        is_active: updateResult.data.isActive,
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 400 });
    }

    return NextResponse.json({ category: data, success: true });
  } catch (error) {
    console.error('PUT category error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `crud:categories:del:${ip}`,
    RateLimitConfig.moderate.limit,
    RateLimitConfig.moderate.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json({ error: 'ID da categoria é obrigatório' }, { status: 400 });
    }

    const access = await getRestaurantAccess(MANAGEMENT_ROLES);
    if (access.error || !access.data) {
      return NextResponse.json({ error: access.error || 'Não autorizado' }, { status: 403 });
    }

    const { data: categoryOwner } = await supabase
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .eq('restaurant_id', access.data.restaurant.id)
      .single();
    if (!categoryOwner) {
      return NextResponse.json(
        { error: 'Não autorizado ou categoria não encontrada' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', categoryId);

    if (error) {
      return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE category error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
