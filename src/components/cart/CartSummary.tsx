// src/components/cart/CartSummary.tsx
'use client';

import { useCart } from '@/hooks/useCart';
import { getRestaurantById } from '@/data/mock';
import { formatPrice } from '@/lib/utils/format.utils';
import { FREE_DELIVERY_COUPON_CODE } from '@/lib/constants/coupon.constants';

export default function CartSummary() {
  const { totalPrice, restaurantId, appliedCoupon, couponDiscount } = useCart();

  const restaurant = restaurantId ? getRestaurantById(restaurantId) : null;
  const deliveryFee = restaurant?.deliveryFee || 0;

  const isFreeDeliveryCoupon = appliedCoupon?.code === FREE_DELIVERY_COUPON_CODE;
  const actualDeliveryFee = isFreeDeliveryCoupon ? 0 : deliveryFee;

  const finalTotal = totalPrice + actualDeliveryFee - couponDiscount;

  return (
    <div
      className="rounded-2xl border p-4 space-y-3 transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex justify-between" style={{ color: 'var(--color-text-secondary)' }}>
        <span>Subtotal</span>
        <span style={{ color: 'var(--color-text)' }}>{formatPrice(totalPrice)}</span>
      </div>

      <div className="flex justify-between" style={{ color: 'var(--color-text-secondary)' }}>
        <span>Taxa de entrega</span>
        <span
          className={actualDeliveryFee === 0 ? 'text-[#00A082] font-medium' : ''}
          style={{ color: actualDeliveryFee === 0 ? undefined : 'var(--color-text)' }}
        >
          {actualDeliveryFee === 0 ? 'Grátis' : formatPrice(actualDeliveryFee)}
        </span>
      </div>

      {couponDiscount > 0 && (
        <div className="flex justify-between text-[#00A082]">
          <span>Desconto ({appliedCoupon?.code})</span>
          <span>-{formatPrice(couponDiscount)}</span>
        </div>
      )}

      {isFreeDeliveryCoupon && deliveryFee > 0 && (
        <div className="flex justify-between text-[#00A082]">
          <span>Frete Grátis</span>
          <span>-{formatPrice(deliveryFee)}</span>
        </div>
      )}

      <div
        className="flex justify-between font-bold text-lg pt-3 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span style={{ color: 'var(--color-text)' }}>Total</span>
        <span style={{ color: 'var(--color-text)' }}>{formatPrice(Math.max(0, finalTotal))}</span>
      </div>
    </div>
  );
}
