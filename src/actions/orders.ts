// src/actions/orders.ts
'use server';

import { prisma } from '@/lib/prisma';
import { OrderStatus, OrderType, Prisma } from '@prisma/client';
import { canTransitionStatus } from '@/lib/utils/order-status.utils';
import { recalculateRestaurantRating } from '@/lib/review-utils';
import { sendEmail, orderConfirmationTemplate, orderStatusTemplate } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { calculateOrderPricing } from '@/lib/orders/pricing';

export interface OrderItemData {
  menuItemId: string;
  menuItemName: string;
  menuItemImage: string | null;
  menuItemPrice: number;
  quantity: number;
  observation?: string | undefined;
}

export interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface OrderData {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string | null;
  restaurantId: string;
  restaurantName: string;
  orderType: string;
  tableNumber: string | null;
  status: string;
  items: OrderItemData[];
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentMethod: string;
  changeFor: number | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
  estimatedDelivery: string | null;
  estimatedPreparationTime: number | null;
  preparationStartedAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  review?: ReviewData | null;
}

export interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minValue?: number;
  maxValue?: number;
  orderType?: string;
  search?: string;
}

export interface OrderStats {
  totalToday: number;
  revenueToday: number;
  pendingCount: number;
  preparingCount: number;
  avgPreparationTime: number;
}

function isValidOrderStatus(status: string): status is OrderStatus {
  return Object.values(OrderStatus).includes(status as OrderStatus);
}

function parseOrderItems(items: unknown): OrderItemData[] {
  if (Array.isArray(items)) {
    return items as OrderItemData[];
  }
  if (typeof items === 'string') {
    return JSON.parse(items);
  }
  return [];
}

function parseAddress(deliveryAddress: unknown): OrderData['address'] {
  if (!deliveryAddress) {
    return { street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '' };
  }
  if (typeof deliveryAddress === 'string') {
    try {
      return JSON.parse(deliveryAddress);
    } catch {
      return {
        street: deliveryAddress,
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
      };
    }
  }
  return deliveryAddress as OrderData['address'];
}

type OrderReviewRecord = {
  id: string;
  rating: number;
  comment: string | null;
  created_at?: Date | string | null;
  createdAt?: string;
};

type OrderRecord = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  restaurant_id: string;
  order_type: string;
  table_number: string | null;
  status: string;
  items: unknown;
  delivery_address: unknown;
  total: number;
  payment_method?: string | null;
  change_for?: number | null;
  subtotal?: number | null;
  delivery_fee?: number | null;
  discount?: number | null;
  coupon_code?: string | null;
  estimated_delivery?: string | null;
  estimated_preparation_time?: number | null;
  preparation_started_at?: Date | null;
  ready_at?: Date | null;
  delivered_at?: Date | null;
  cancelled_at?: Date | null;
  cancel_reason?: string | null;
  created_at?: Date;
  updated_at?: Date;
  restaurant?: { name: string } | null;
  reviews?: OrderReviewRecord[];
};

function toDateString(value?: Date | string | null): string {
  if (!value) return '';
  return value instanceof Date ? value.toISOString() : value;
}

function mapOrderToData(order: OrderRecord, userId: string, restaurantName?: string): OrderData {
  const items = parseOrderItems(order.items);
  const address = parseAddress(order.delivery_address);

  let review: ReviewData | null = null;
  if (order.reviews && order.reviews.length > 0) {
    const r = order.reviews[0];
    review = {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: toDateString(r.created_at) || r.createdAt || '',
    };
  }

  return {
    id: order.id,
    userId,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    restaurantId: order.restaurant_id,
    restaurantName: restaurantName || order.restaurant?.name || '',
    orderType: order.order_type,
    tableNumber: order.table_number,
    status: order.status,
    items,
    address,
    paymentMethod: order.payment_method || 'Dinheiro',
    changeFor: order.change_for || null,
    subtotal: order.subtotal ?? order.total,
    deliveryFee: order.delivery_fee ?? 0,
    discount: order.discount ?? 0,
    total: order.total,
    couponCode: order.coupon_code || null,
    estimatedDelivery: order.estimated_delivery || null,
    estimatedPreparationTime: order.estimated_preparation_time || null,
    preparationStartedAt: order.preparation_started_at?.toISOString?.() || null,
    readyAt: order.ready_at?.toISOString?.() || null,
    deliveredAt: order.delivered_at?.toISOString?.() || null,
    cancelledAt: order.cancelled_at?.toISOString?.() || null,
    cancelReason: order.cancel_reason || null,
    createdAt: order.created_at?.toISOString?.() || '',
    updatedAt: order.updated_at?.toISOString?.() || '',
    review,
  };
}

export async function createOrder(orderData: {
  restaurantId: string;
  restaurantName: string;
  items: OrderItemData[];
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentMethod: string;
  changeFor?: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode?: string;
}): Promise<{ data?: OrderData; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Usuário não autenticado' };
  }

  const estimatedMinutes = 40 + Math.floor(Math.random() * 20);
  const estimatedDelivery = new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString();

  try {
    const pricedOrder = await calculateOrderPricing(orderData.restaurantId, orderData.items);
    if (pricedOrder.error || !pricedOrder.data) {
      return { error: pricedOrder.error || 'Erro ao calcular pedido' };
    }

    // Transaction: ensures order creation is atomic with restaurant validation
    const order = await prisma.$transaction(async (tx) => {
      // Re-validate restaurant is still active inside the transaction
      const restaurant = await tx.restaurant.findFirst({
        where: { id: pricedOrder.data!.restaurantId, is_active: true },
        select: { id: true, accepting_orders: true },
      });
      if (!restaurant) {
        throw new Error('Restaurante nao encontrado ou inativo');
      }
      if (!restaurant.accepting_orders) {
        throw new Error('Restaurante nao esta aceitando pedidos no momento');
      }

      return tx.order.create({
        data: {
          customer_id: user.id,
          customer_name: user.email || 'Cliente',
          customer_phone: null,
          order_type: 'DELIVERY',
          delivery_address: JSON.stringify(orderData.address),
          status: OrderStatus.PENDING,
          items: pricedOrder.data!.items as unknown as Prisma.InputJsonValue,
          total: pricedOrder.data!.total,
          restaurant_id: pricedOrder.data!.restaurantId,
          estimated_preparation_time: estimatedMinutes,
          payment_method: orderData.paymentMethod,
          change_for: orderData.changeFor ?? null,
          subtotal: pricedOrder.data!.subtotal,
          delivery_fee: pricedOrder.data!.deliveryFee,
          discount: pricedOrder.data!.discount,
          coupon_code: orderData.couponCode ?? null,
          estimated_delivery: estimatedDelivery,
        },
      });
    });

    void sendEmail({
      to: user.email!,
      subject: `Pedido #${order.id.slice(-8).toUpperCase()} confirmado — ${orderData.restaurantName}`,
      html: orderConfirmationTemplate(
        order.id,
        orderData.restaurantName,
        pricedOrder.data.total,
        pricedOrder.data.items.map((i) => ({ name: i.menuItemName, quantity: i.quantity }))
      ),
    });

    return {
      data: {
        id: order.id,
        userId: user.id,
        customerName: order.customer_name,
        customerPhone: null,
        restaurantId: pricedOrder.data.restaurantId,
        restaurantName: pricedOrder.data.restaurantName,
        orderType: 'DELIVERY',
        tableNumber: null,
        status: order.status,
        items: pricedOrder.data.items,
        address: orderData.address,
        paymentMethod: orderData.paymentMethod,
        changeFor: orderData.changeFor || null,
        subtotal: pricedOrder.data.subtotal,
        deliveryFee: pricedOrder.data.deliveryFee,
        discount: pricedOrder.data.discount,
        total: order.total,
        couponCode: null,
        estimatedDelivery,
        estimatedPreparationTime: estimatedMinutes,
        preparationStartedAt: null,
        readyAt: null,
        deliveredAt: null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: order.created_at.toISOString(),
        updatedAt: order.updated_at.toISOString(),
      },
    };
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    if (error instanceof Error && error.message.includes('Restaurante nao encontrado')) {
      return { error: 'Restaurante nao encontrado ou inativo. Tente novamente.' };
    }
    return { error: 'Erro ao criar pedido. Tente novamente.' };
  }
}

export async function getOrders(): Promise<{ data?: OrderData[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Usuário não autenticado' };
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        customer_id: user.id,
      },
      include: {
        restaurant: { select: { name: true, user_id: true } },
        reviews: {
          where: { user_id: user.id },
          take: 1,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const mappedOrders: OrderData[] = orders.map((order) =>
      mapOrderToData(order, user.id, order.restaurant?.name)
    );

    return { data: mappedOrders };
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return { error: 'Erro ao carregar pedidos' };
  }
}

export async function getOrderById(orderId: string): Promise<{ data?: OrderData; error?: string }> {
  console.log('🔍 [getOrderById] Buscando pedido:', orderId);

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('❌ [getOrderById] Não autenticado');
    return { error: 'Usuário não autenticado' };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: { select: { name: true, user_id: true } },
        reviews: true,
      },
    });

    if (!order) {
      console.log('❌ [getOrderById] Pedido não encontrado:', orderId);
      return { error: 'Pedido não encontrado' };
    }

    console.log('✅ [getOrderById] Pedido encontrado:', order.id);
    const isCustomer = order.customer_id === user.id;
    const isRestaurantOwner = order.restaurant?.user_id === user.id;
    if (!isCustomer && !isRestaurantOwner) {
      return { error: 'NÃ£o autorizado' };
    }

    return { data: mapOrderToData(order, user.id, order.restaurant?.name) };
  } catch (error) {
    console.error('❌ [getOrderById] Erro:', error);
    return { error: 'Pedido não encontrado' };
  }
}

export async function updateOrderStatus({
  orderId,
  newStatus,
  restaurantId,
}: {
  orderId: string;
  newStatus: OrderStatus;
  restaurantId: string;
}): Promise<{ success?: boolean; error?: string }> {
  if (!isValidOrderStatus(newStatus)) {
    return { error: 'Status inválido' };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Usuário não autenticado' };
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurantId,
      user_id: user.id,
    },
  });

  if (!restaurant) {
    return { error: 'Não autorizado ou restaurante não encontrado' };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId, restaurant_id: restaurantId },
      select: { status: true },
    });

    if (!order) {
      return { error: 'Pedido não encontrado' };
    }

    if (!canTransitionStatus(order.status, newStatus)) {
      return {
        error: `Transição inválida: ${order.status} → ${newStatus}`,
      };
    }

    const updateData: Prisma.OrderUpdateInput = {
      status: newStatus,
      updated_at: new Date(),
    };

    if (newStatus === 'PREPARING') {
      updateData.preparation_started_at = new Date();
    } else if (newStatus === 'READY') {
      updateData.ready_at = new Date();
    } else if (newStatus === 'DELIVERING') {
      updateData.delivering_at = new Date();
    } else if (newStatus === 'DELIVERED') {
      updateData.delivered_at = new Date();
    }

    await prisma.order.update({
      where: {
        id: orderId,
        restaurant_id: restaurantId,
      },
      data: updateData,
    });

    try {
      const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          customer_name: true,
          customer_id: true,
          restaurant: { select: { name: true } },
        },
      });
      if (updatedOrder?.customer_id) {
        const profile = await prisma.profile.findUnique({
          where: { id: updatedOrder.customer_id },
          select: { email: true },
        });
        if (profile?.email) {
          const labels: Record<string, string> = {
            CONFIRMED: 'Pedido confirmado',
            PREPARING: 'Seu pedido esta sendo preparado',
            READY: 'Seu pedido esta pronto',
            DELIVERING: 'Seu pedido saiu para entrega',
            DELIVERED: 'Pedido entregue',
          };
          void sendEmail({
            to: profile.email,
            subject: `Pedido #${orderId.slice(-8).toUpperCase()} — ${labels[newStatus] || newStatus}`,
            html: orderStatusTemplate(
              orderId,
              updatedOrder.restaurant?.name || '',
              newStatus,
              labels[newStatus] || newStatus
            ),
          });
        }
      }
    } catch {
      // Email e otimizacao, nao bloqueia o fluxo
    }

    revalidatePath('/dashboard/orders');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return { error: 'Erro ao atualizar pedido' };
  }
}

export async function cancelOrder({
  orderId,
  reason,
}: {
  orderId: string;
  reason?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Usuário não autenticado' };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { error: 'Pedido não encontrado' };
    }

    if (order.customer_id !== user.id) {
      return { error: 'Não autorizado' };
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return { error: 'Não é possível cancelar este pedido. O preparo já foi iniciado.' };
    }

    await prisma.order.update({
      where: { id: orderId, status: { in: ['PENDING', 'CONFIRMED'] } },
      data: {
        status: OrderStatus.CANCELLED,
        cancelled_at: new Date(),
        cancel_reason: reason || 'Cancelado pelo cliente',
        updated_at: new Date(),
      },
    });

    revalidatePath('/orders');
    revalidatePath(`/order/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    return { error: 'Erro ao cancelar pedido' };
  }
}

export async function cancelOrderByRestaurant({
  orderId,
  restaurantId,
  reason,
}: {
  orderId: string;
  restaurantId: string;
  reason?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Usuário não autenticado' };
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, user_id: user.id },
  });

  if (!restaurant) {
    return { error: 'Não autorizado' };
  }

  try {
    await prisma.order.update({
      where: {
        id: orderId,
        restaurant_id: restaurantId,
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
      data: {
        status: OrderStatus.CANCELLED,
        cancelled_at: new Date(),
        cancel_reason: reason || 'Cancelado pelo restaurante',
        updated_at: new Date(),
      },
    });

    revalidatePath('/dashboard/orders');
    revalidatePath('/orders');
    return { success: true };
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    return { error: 'Erro ao cancelar pedido' };
  }
}

export async function createOrderReview({
  orderId,
  restaurantId,
  rating,
  comment,
}: {
  orderId: string;
  restaurantId: string;
  rating: number;
  comment?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Usuário não autenticado' };
  }

  if (rating < 1 || rating > 5) {
    return { error: 'Avaliação deve ser entre 1 e 5' };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { reviews: { where: { user_id: user.id } } },
    });

    if (!order) {
      return { error: 'Pedido não encontrado' };
    }

    if (order.customer_id !== user.id) {
      return { error: 'Não autorizado' };
    }

    if (order.restaurant_id !== restaurantId) {
      return { error: 'Restaurante invÃ¡lido para este pedido' };
    }

    if (order.status !== 'DELIVERED') {
      return { error: 'Só é possível avaliar pedidos entregues' };
    }

    if (order.reviews.length > 0) {
      await prisma.review.update({
        where: { id: order.reviews[0].id },
        data: { rating, comment },
      });
    } else {
      await prisma.review.create({
        data: {
          order_id: orderId,
          restaurant_id: restaurantId,
          user_id: user.id,
          rating,
          comment,
        },
      });
    }

    await recalculateRestaurantRating(restaurantId);

    revalidatePath('/orders');
    revalidatePath(`/order/${orderId}`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao avaliar pedido:', error);
    return { error: 'Erro ao avaliar pedido' };
  }
}

export async function getOrdersForRestaurant({
  filters,
}: {
  filters?: OrderFilters;
} = {}): Promise<{ data?: OrderData[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Usuário não autenticado' };
  }

  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { user_id: user.id },
      select: { id: true, name: true },
    });

    if (!restaurant) {
      return { error: 'Restaurante não encontrado' };
    }

    const where: Prisma.OrderWhereInput = { restaurant_id: restaurant.id };

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status as OrderStatus;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.created_at = {};
      if (filters.dateFrom) {
        where.created_at.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.created_at.lte = endDate;
      }
    }

    if (filters?.minValue !== undefined || filters?.maxValue !== undefined) {
      where.total = {};
      if (filters.minValue !== undefined) {
        where.total.gte = filters.minValue;
      }
      if (filters.maxValue !== undefined) {
        where.total.lte = filters.maxValue;
      }
    }

    if (filters?.orderType && filters.orderType !== 'ALL') {
      where.order_type = filters.orderType as OrderType;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        reviews: true,
      },
      orderBy: { created_at: 'desc' },
    });

    let mappedOrders = orders.map((order) => mapOrderToData(order, user.id, restaurant.name));

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      mappedOrders = mappedOrders.filter(
        (o) =>
          o.id.toLowerCase().includes(searchTerm) ||
          o.customerName.toLowerCase().includes(searchTerm) ||
          o.items.some((i) => i.menuItemName.toLowerCase().includes(searchTerm))
      );
    }

    return { data: mappedOrders };
  } catch (error) {
    console.error('Erro ao buscar pedidos do restaurante:', error);
    return { error: 'Erro ao carregar pedidos' };
  }
}

export async function getOrderStats(): Promise<{ data?: OrderStats; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Usuário não autenticado' };
  }

  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { user_id: user.id },
      select: { id: true },
    });

    if (!restaurant) {
      return { error: 'Restaurante não encontrado' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, pendingCount, preparingCount] = await Promise.all([
      prisma.order.findMany({
        where: {
          restaurant_id: restaurant.id,
          created_at: { gte: today },
        },
        select: {
          total: true,
          status: true,
          created_at: true,
          ready_at: true,
          preparation_started_at: true,
        },
      }),
      prisma.order.count({
        where: {
          restaurant_id: restaurant.id,
          status: OrderStatus.PENDING,
        },
      }),
      prisma.order.count({
        where: {
          restaurant_id: restaurant.id,
          status: OrderStatus.PREPARING,
        },
      }),
    ]);

    const totalToday = todayOrders.length;
    const revenueToday = todayOrders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.total, 0);

    const completedOrders = todayOrders.filter((o) => o.ready_at && o.preparation_started_at);
    const avgPreparationTime =
      completedOrders.length > 0
        ? completedOrders.reduce((sum, o) => {
            const diff = (o.ready_at!.getTime() - o.preparation_started_at!.getTime()) / 60000;
            return sum + diff;
          }, 0) / completedOrders.length
        : 0;

    return {
      data: {
        totalToday,
        revenueToday,
        pendingCount,
        preparingCount,
        avgPreparationTime: Math.round(avgPreparationTime),
      },
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { error: 'Erro ao carregar estatísticas' };
  }
}
