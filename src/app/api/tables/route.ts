// src/app/api/tables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRestaurantAccess, MANAGEMENT_ROLES } from '@/lib/restaurant-access';
import {
  checkRateLimit,
  getClientIp,
  RateLimitConfig,
  buildRateLimitResponse,
} from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rate = await checkRateLimit(
    `tables:get:${ip}`,
    RateLimitConfig.relaxed.limit,
    RateLimitConfig.relaxed.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  const supabase = await createClient();
  const access = await getRestaurantAccess(MANAGEMENT_ROLES);
  if (access.error || !access.data) {
    return NextResponse.json({ error: access.error || 'Nao autorizado' }, { status: 403 });
  }

  const { data: tables } = await supabase
    .from('restaurant_tables')
    .select('id, number, capacity, status')
    .eq('restaurant_id', access.data.restaurant.id)
    .order('number');

  return NextResponse.json({ tables: tables || [] });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `tables:post:${ip}`,
    RateLimitConfig.moderate.limit,
    RateLimitConfig.moderate.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  const supabase = await createClient();
  const access = await getRestaurantAccess(MANAGEMENT_ROLES);
  if (access.error || !access.data) {
    return NextResponse.json({ error: access.error || 'Nao autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const { number, capacity } = body;

  if (!number) return NextResponse.json({ error: 'Numero obrigatorio' }, { status: 400 });

  const { data: table, error } = await supabase
    .from('restaurant_tables')
    .insert({
      restaurant_id: access.data.restaurant.id,
      number,
      capacity: capacity || 4,
      status: 'AVAILABLE',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ table }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `tables:del:${ip}`,
    RateLimitConfig.moderate.limit,
    RateLimitConfig.moderate.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  const supabase = await createClient();
  const access = await getRestaurantAccess(MANAGEMENT_ROLES);
  if (access.error || !access.data) {
    return NextResponse.json({ error: access.error || 'Nao autorizado' }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });

  const { error } = await supabase
    .from('restaurant_tables')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', access.data.restaurant.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
