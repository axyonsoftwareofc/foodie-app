// src/actions/waiter-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { getRestaurantAccess, recordAuditLog, WAITER_ROLES } from '@/lib/restaurant-access';

export async function getTables(): Promise<{
  data?: { id: string; number: string; capacity: number; status: string }[];
  error?: string;
}> {
  const access = await getRestaurantAccess(WAITER_ROLES);
  if (access.error || !access.data) {
    return { error: access.error || 'Nao autorizado' };
  }
  const data = access.data;

  const tables = await prisma.restaurantTable.findMany({
    where: { restaurant_id: data.restaurant.id },
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
  const access = await getRestaurantAccess(WAITER_ROLES);
  if (access.error || !access.data) {
    return { error: access.error || 'Nao autorizado' };
  }
  const data = access.data;

  const products = await prisma.product.findMany({
    where: {
      restaurant_id: data.restaurant.id,
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
  const access = await getRestaurantAccess(WAITER_ROLES);
  if (access.error || !access.data) {
    return { error: access.error || 'Nao autorizado' };
  }
  const acc = access.data;

  const table = await prisma.restaurantTable.findFirst({
    where: { id: data.tableId, restaurant_id: acc.restaurant.id },
  });
  if (!table) return { error: 'Mesa nao encontrada' };

  const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    const order = await prisma.order.create({
      data: {
        restaurant_id: acc.restaurant.id,
        table_id: data.tableId,
        table_number: data.tableNumber,
        created_by_user_id: acc.user.id,
        created_by_member_id: acc.member.id,
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

    await recordAuditLog({
      restaurantId: acc.restaurant.id,
      actorUserId: acc.user.id,
      actorMemberId: acc.member.id,
      action: 'waiter.order.created',
      entityType: 'order',
      entityId: order.id,
      metadata: {
        tableId: data.tableId,
        tableNumber: data.tableNumber,
        total,
        itemCount: data.items.length,
      },
    });

    return { success: true, orderId: order.id };
  } catch (error) {
    console.error('[Waiter] Failed to create dine-in order', error);
    return { error: 'Erro ao criar pedido' };
  }
}

export async function closeTable(tableId: string): Promise<{ success?: boolean; error?: string }> {
  const access = await getRestaurantAccess(WAITER_ROLES);
  if (access.error || !access.data) {
    return { error: access.error || 'Nao autorizado' };
  }
  const data = access.data;

  const table = await prisma.restaurantTable.findFirst({
    where: { id: tableId, restaurant_id: data.restaurant.id },
    select: { id: true, number: true },
  });
  if (!table) return { error: 'Mesa nao encontrada' };

  await prisma.restaurantTable.update({
    where: { id: tableId },
    data: { status: 'AVAILABLE' },
  });

  await recordAuditLog({
    restaurantId: data.restaurant.id,
    actorUserId: data.user.id,
    actorMemberId: data.member.id,
    action: 'waiter.table.closed',
    entityType: 'restaurant_table',
    entityId: tableId,
    metadata: { tableNumber: table.number },
  });

  return { success: true };
}
