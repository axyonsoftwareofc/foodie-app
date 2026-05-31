import { prisma } from '@/lib/prisma';
import type { OrderItemData } from '@/actions/orders';

type PricingInputItem = Pick<OrderItemData, 'menuItemId' | 'quantity' | 'observation'>;

export type PricedOrder = {
  restaurantId: string;
  restaurantName: string;
  items: OrderItemData[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function calculateOrderPricing(
  restaurantId: string,
  inputItems: PricingInputItem[]
): Promise<{ data?: PricedOrder; error?: string }> {
  if (!restaurantId) {
    return { error: 'Restaurante invalido' };
  }

  if (!Array.isArray(inputItems) || inputItems.length === 0) {
    return { error: 'Pedido sem itens' };
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurantId,
      is_active: true,
    },
    select: {
      id: true,
      name: true,
      delivery_fee: true,
      minimum_order: true,
    },
  });

  if (!restaurant) {
    return { error: 'Restaurante nao encontrado ou inativo' };
  }

  const productIds = [...new Set(inputItems.map((item) => item.menuItemId).filter(Boolean))];
  if (productIds.length !== inputItems.length) {
    return { error: 'Itens duplicados ou invalidos no pedido' };
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      restaurant_id: restaurant.id,
      is_active: true,
      is_available: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      image: true,
    },
  });

  const productsById = new Map(products.map((product) => [product.id, product]));
  if (productsById.size !== inputItems.length) {
    return { error: 'Um ou mais itens nao pertencem ao restaurante ou estao indisponiveis' };
  }

  const items: OrderItemData[] = [];
  let subtotal = 0;

  for (const inputItem of inputItems) {
    const product = productsById.get(inputItem.menuItemId);
    const quantity = Number(inputItem.quantity);

    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { error: 'Quantidade invalida no pedido' };
    }

    const price = roundMoney(product.price);
    subtotal += price * quantity;
    items.push({
      menuItemId: product.id,
      menuItemName: product.name,
      menuItemImage: product.image,
      menuItemPrice: price,
      quantity,
      observation: inputItem.observation,
    });
  }

  subtotal = roundMoney(subtotal);

  if (restaurant.minimum_order && subtotal < restaurant.minimum_order) {
    return { error: `Pedido minimo de R$ ${restaurant.minimum_order.toFixed(2)}` };
  }

  const deliveryFee = roundMoney(restaurant.delivery_fee ?? 0);
  const discount = 0;
  const total = roundMoney(Math.max(0, subtotal + deliveryFee - discount));

  return {
    data: {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
    },
  };
}
