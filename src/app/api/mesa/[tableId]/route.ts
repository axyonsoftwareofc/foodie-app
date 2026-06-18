// src/app/api/mesa/[tableId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { recalculateRestaurantCapacity } from '@/lib/capacity-checker';
import { calculateOrderPricing } from '@/lib/orders/pricing';
import {
  checkRateLimit,
  getClientIp,
  RateLimitConfig,
  buildRateLimitResponse,
} from '@/lib/rate-limit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ tableId: string }> }) {
  const ip = getClientIp(req);
  const rate = await checkRateLimit(
    `mesa:get:${ip}`,
    RateLimitConfig.relaxed.limit,
    RateLimitConfig.relaxed.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

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
  const ip = getClientIp(req);
  const rate = await checkRateLimit(
    `mesa:post:${ip}`,
    RateLimitConfig.strict.limit,
    RateLimitConfig.strict.windowSeconds,
    true
  );
  if (!rate.success) return buildRateLimitResponse(rate);

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

  // Validar corpo — apenas productId + quantity, NUNCA price/name do cliente
  const orderSchema = z.object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().min(1).max(99),
        })
      )
      .min(1),
  });

  let parsed: z.infer<typeof orderSchema>;
  try {
    parsed = orderSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Dados do pedido invalidos' }, { status: 400 });
  }

  // Recalcular precos server-side (nao confiar no cliente)
  const priced = await calculateOrderPricing(
    table.restaurant.id,
    parsed.items.map((i) => ({ menuItemId: i.productId, quantity: i.quantity }))
  );

  if (priced.error || !priced.data) {
    return NextResponse.json({ error: priced.error ?? 'Erro ao calcular preco' }, { status: 400 });
  }

  const { items, total } = priced.data;

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
          menuItemName: i.menuItemName,
          quantity: i.quantity,
          menuItemPrice: i.menuItemPrice,
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
