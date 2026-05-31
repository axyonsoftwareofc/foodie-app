// src/lib/utils/cart.utils.ts
import { CartItem, CartSummary } from '@/types';

/**
 * Calcula o subtotal do carrinho
 */
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
}

/**
 * Calcula a quantidade total de itens
 */
export function calculateTotalItems(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Gera o resumo completo do carrinho
 */
export function calculateCartSummary(
  items: CartItem[],
  deliveryFee: number,
  discount: number = 0
): CartSummary {
  const subtotal = calculateSubtotal(items);
  const itemCount = calculateTotalItems(items);
  const total = subtotal + deliveryFee - discount;

  return {
    subtotal,
    deliveryFee,
    discount,
    total: Math.max(0, total),
    itemCount,
  };
}

/**
 * Verifica se o carrinho tem itens de um restaurante específico
 */
export function isCartFromRestaurant(items: CartItem[], restaurantId: string): boolean {
  if (items.length === 0) return true;
  return items[0].menuItem.restaurantId === restaurantId;
}
