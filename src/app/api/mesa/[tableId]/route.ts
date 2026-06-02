// src/app/api/mesa/[tableId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { recalculateRestaurantCapacity } from '@/lib/capacity-checker';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;

  const table = await prisma.restaurantTable.findUnique({
    where: { id: tableId },
    include: {
      restaurant: {
        select: { id: true, name: true },
      },
    },
  });

  if (!table) {
    return NextResponse.json({ error: 'Mesa nao encontrada' }, { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: {
      restaurant_id: table.restaurant.id,
      is_active: true,
      is_available: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      description: true,
      category: { select: { name: true } },
    },
    orderBy: [{ category: { sort_order: 'asc' } }, { name: 'asc' }],
  });

  return NextResponse.json({
    table: {
      number: table.number,
      restaurantName: table.restaurant.name,
      restaurantId: table.restaurant.id,
    },
    menu: products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description,
      categoryName: p.category.name,
    })),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = await params;

  const table = await prisma.restaurantTable.findUnique({
    where: { id: tableId },
    include: {
      restaurant: { select: { id: true, name: true } },
    },
  });

  if (!table) {
    return NextResponse.json({ error: 'Mesa nao encontrada' }, { status: 404 });
  }

  const body = await req.json();
  const { items } = body as {
    items: { productId: string; name: string; quantity: number; price: number }[];
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'Nenhum item no pedido' }, { status: 400 });
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  try {
    const order = await prisma.order.create({
      data: {
        restaurant_id: table.restaurant.id,
        table_id: tableId,
        table_number: table.number,
        customer_name: `Mesa ${table.number}`,
        order_type: 'DINE_IN',
        status: OrderStatus.PENDING,
        items: items.map((i) => ({
          menuItemName: i.name,
          quantity: i.quantity,
          menuItemPrice: i.price,
        })) as unknown as Prisma.InputJsonValue,
        total,
        subtotal: total,
        payment_method: 'CASH',
      },
    });

    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { status: 'OCCUPIED' },
    });

    void recalculateRestaurantCapacity(table.restaurant.id);

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error('[Mesa API] Failed to create order', error);
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 });
  }
}
