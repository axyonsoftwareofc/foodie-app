// src/app/api/tables/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!restaurant)
    return NextResponse.json({ error: 'Restaurante nao encontrado' }, { status: 404 });

  const { data: tables } = await supabase
    .from('restaurant_tables')
    .select('id, number, capacity, status')
    .eq('restaurant_id', restaurant.id)
    .order('number');

  return NextResponse.json({ tables: tables || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!restaurant)
    return NextResponse.json({ error: 'Restaurante nao encontrado' }, { status: 404 });

  const body = await request.json();
  const { number, capacity } = body;

  if (!number) return NextResponse.json({ error: 'Numero obrigatorio' }, { status: 400 });

  const { data: table, error } = await supabase
    .from('restaurant_tables')
    .insert({
      restaurant_id: restaurant.id,
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!restaurant)
    return NextResponse.json({ error: 'Restaurante nao encontrado' }, { status: 404 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatorio' }, { status: 400 });

  const { error } = await supabase
    .from('restaurant_tables')
    .delete()
    .eq('id', id)
    .eq('restaurant_id', restaurant.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
