// src/lib/utils/coupon.utils.ts
import { Coupon, AVAILABLE_COUPONS } from '@/lib/constants/coupon.constants';

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discount?: number;
  error?: string;
}

/**
 * Valida e calcula desconto de um cupom
 */
export function validateCoupon(code: string, subtotal: number): CouponValidationResult {
  const normalizedCode = code.trim().toUpperCase();

  const coupon = AVAILABLE_COUPONS.find((c) => c.code === normalizedCode);

  if (!coupon) {
    return { valid: false, error: 'Cupom inválido ou expirado' };
  }

  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    return {
      valid: false,
      error: `Pedido mínimo de R$ ${coupon.minOrderValue.toFixed(2)} para este cupom`,
    };
  }

  let discount = 0;

  if (coupon.type === 'percentage') {
    discount = (subtotal * coupon.value) / 100;
    if (coupon.maxDiscount) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else if (coupon.type === 'fixed') {
    discount = coupon.value;
  }

  return {
    valid: true,
    coupon,
    discount,
  };
}

/**
 * Formata mensagem de sucesso do cupom
 */
export function formatCouponSuccessMessage(discount: number): string {
  return `Você ganhou R$ ${discount.toFixed(2)} de desconto!`;
}
