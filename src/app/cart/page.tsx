// src/app/cart/page.tsx
'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { getRestaurantById } from '@/data/mock';
import { formatPrice } from '@/lib/utils/format.utils';
import CartHeader from '@/components/cart/CartHeader';
import CartRestaurantInfo from '@/components/cart/CartRestaurantInfo';
import CartItemCard from '@/components/cart/CartItemCard';
import CouponInput from '@/components/cart/CouponInput';
import CartSummary from '@/components/cart/CartSummary';
import CartEmpty from '@/components/cart/CartEmpty';

export default function CartPage() {
  const { items, restaurantId, totalPrice, couponDiscount, appliedCoupon } = useCart();

  const restaurant = restaurantId ? getRestaurantById(restaurantId) : null;
  const deliveryFee = restaurant?.deliveryFee || 0;

  const isFreeDeliveryCoupon = appliedCoupon?.code === 'FRETEGRATIS';
  const actualDeliveryFee = isFreeDeliveryCoupon ? 0 : deliveryFee;

  const finalTotal = totalPrice + actualDeliveryFee - couponDiscount;

  if (items.length === 0) {
    return (
      <div
        className="min-h-screen transition-colors"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <CartHeader />
        <CartEmpty />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-32 transition-colors"
      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <CartHeader />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {restaurant && <CartRestaurantInfo restaurant={restaurant} />}

        <div className="space-y-3">
          {items.map((item, index) => (
            <CartItemCard key={`${item.menuItem.id}-${index}`} item={item} />
          ))}
        </div>

        {restaurant && (
          <Link
            href={`/restaurant/${restaurant.id}`}
            className="block text-center py-4 text-[#00A082] font-semibold hover:underline"
          >
            + Adicionar mais itens
          </Link>
        )}

        <CouponInput />
        <CartSummary />
      </main>

      {/* Footer Fixo */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t p-4 transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <Link
            href="/checkout"
            className="block w-full bg-[#00A082] text-white py-4 rounded-full font-semibold hover:bg-[#008F74] transition-colors text-center"
          >
            Ir para pagamento • {formatPrice(Math.max(0, finalTotal))}
          </Link>
        </div>
      </div>
    </div>
  );
}
