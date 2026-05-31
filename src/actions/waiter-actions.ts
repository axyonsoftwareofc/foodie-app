// src/actions/waiter-actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';

export async function getTables(): Promise<{
  data?: { id: string; number: string; capacity: number; status: string }[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const restaurant = await prisma.restaurant.findFirst({
    where: { user_id: user.id },
    select: { id: true },
  });
  if (!restaurant) return { error: 'Restaurante não encontrado' };

  const tables = await prisma.restaurantTable.findMany({
    where: { restaurant_id: restaurant.id },
    select: { id: true, number: true, capacity: true, status: true },
    orderBy: { number: 'asc' },
  });

  return { data: tables };
}

export async function getMenu(): Promise<{
  data?: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    categoryName: string;
    image: string | null;
    isAvailable: boolean;
  }[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const restaurant = await prisma.restaurant.findFirst({
    where: { user_id: user.id },
    select: { id: true },
  });
  if (!restaurant) return { error: 'Restaurante não encontrado' };

  const products = await prisma.product.findMany({
    where: {
      restaurant_id: restaurant.id,
      is_active: true,
      is_available: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
      image: true,
      is_available: true,
      category: { select: { name: true } },
    },
    orderBy: [{ category: { sort_order: 'asc' } }, { name: 'asc' }],
  });

  return {
    data: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description,
      categoryName: p.category.name,
      image: p.image,
      isAvailable: p.is_available,
    })),
  };
}

export async function createDineInOrder(data: {
  tableId: string;
  tableNumber: string;
  customerName: string;
  items: { productId: string; name: string; quantity: number; price: number; notes?: string }[];
  kitchenNotes?: string;
}): Promise<{ success?: boolean; error?: string; orderId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const restaurant = await prisma.restaurant.findFirst({
    where: { user_id: user.id },
    select: { id: true },
  });
  if (!restaurant) return { error: 'Restaurante não encontrado' };

  const table = await prisma.restaurantTable.findFirst({
    where: { id: data.tableId, restaurant_id: restaurant.id },
  });
  if (!table) return { error: 'Mesa não encontrada' };

  const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    const order = await prisma.order.create({
      data: {
        restaurant_id: restaurant.id,
        table_id: data.tableId,
        table_number: data.tableNumber,
        customer_name: data.customerName || `Mesa ${data.tableNumber}`,
        order_type: 'DINE_IN',
        status: OrderStatus.PENDING,
        items: data.items.map((i) => ({
          menuItemName: i.name,
          quantity: i.quantity,
          menuItemPrice: i.price,
          notes: i.notes || undefined,
        })) as unknown as Prisma.InputJsonValue,
        kitchen_notes: data.kitchenNotes
          ? ({ general: data.kitchenNotes } as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        total,
        subtotal: total,
        payment_method: 'CASH',
      },
    });

    await prisma.restaurantTable.update({
      where: { id: data.tableId },
      data: { status: 'OCCUPIED' },
    });

    return { success: true, orderId: order.id };
  } catch (error) {
    return { error: 'Erro ao criar pedido' };
  }
}

export async function closeTable(tableId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const restaurant = await prisma.restaurant.findFirst({
    where: { user_id: user.id },
    select: { id: true },
  });
  if (!restaurant) return { error: 'Restaurante não encontrado' };

  await prisma.restaurantTable.update({
    where: { id: tableId, restaurant_id: restaurant.id },
    data: { status: 'AVAILABLE' },
  });

  return { success: true };
}
