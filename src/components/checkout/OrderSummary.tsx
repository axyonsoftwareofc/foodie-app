// src/components/checkout/OrderSummary.tsx
'use client';

import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils/format.utils';
import { Truck, Clock, MapPin, Tag } from 'lucide-react';
import { FREE_DELIVERY_COUPON_CODE } from '@/lib/constants/coupon.constants';

interface OrderSummaryProps {
  customDeliveryFee?: number | null;
  deliveryDistance?: number;
  estimatedTime?: string | null;
}

export default function OrderSummary({
  customDeliveryFee,
  deliveryDistance,
  estimatedTime,
}: OrderSummaryProps) {
  const { items, restaurantId, totalPrice, appliedCoupon, couponDiscount } = useCart();

  const deliveryFee = customDeliveryFee ?? 0;
  const isFreeDeliveryCoupon = appliedCoupon?.code === FREE_DELIVERY_COUPON_CODE;
  const finalDeliveryFee = isFreeDeliveryCoupon ? 0 : deliveryFee;
  const finalTotal = totalPrice + finalDeliveryFee - couponDiscount;

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
          🛒 Resumo do Pedido
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {itemCount} {itemCount === 1 ? 'item' : 'itens'}
        </p>
      </div>

      {/* Items List */}
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.menuItem.id} className="flex gap-3">
            {/* Imagem do produto */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={item.menuItem.image || '/placeholder.svg'}
                alt={item.menuItem.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>

            {/* Detalhes do item */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p
                    className="font-medium text-sm truncate"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {item.quantity}x {item.menuItem.name}
                  </p>
                  {item.observation && (
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      Obs: {item.observation}
                    </p>
                  )}
                </div>
                <span className="font-medium text-sm ml-2" style={{ color: 'var(--color-text)' }}>
                  {formatPrice(item.menuItem.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="p-4 space-y-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Subtotal
          </span>
          <span className="font-medium" style={{ color: 'var(--color-text)' }}>
            {formatPrice(totalPrice)}
          </span>
        </div>

        {/* Entrega */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Truck size={14} style={{ color: 'var(--color-text-tertiary)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Entrega
              </span>
            </div>

            {isFreeDeliveryCoupon ? (
              <div className="text-right">
                <span
                  className="text-sm line-through mr-2"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {formatPrice(deliveryFee)}
                </span>
                <span className="font-medium" style={{ color: '#00A082' }}>
                  Grátis
                </span>
              </div>
            ) : (
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                {formatPrice(finalDeliveryFee)}
              </span>
            )}
          </div>

          {/* Informações adicionais da entrega */}
          {deliveryDistance !== undefined && deliveryDistance > 0 && (
            <div className="flex items-center gap-1.5 ml-6">
              <MapPin size={12} style={{ color: 'var(--color-text-tertiary)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Distância: {deliveryDistance} km
              </span>
            </div>
          )}

          {estimatedTime && (
            <div className="flex items-center gap-1.5 ml-6">
              <Clock size={12} style={{ color: 'var(--color-text-tertiary)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Tempo estimado: {estimatedTime}
              </span>
            </div>
          )}
        </div>

        {/* Cupom de desconto */}
        {appliedCoupon && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Tag size={14} style={{ color: '#00A082' }} />
              <span className="text-sm" style={{ color: '#00A082' }}>
                Cupom: {appliedCoupon.code}
              </span>
            </div>
            <span className="font-medium" style={{ color: '#00A082' }}>
              - {formatPrice(couponDiscount)}
            </span>
          </div>
        )}

        {/* Total */}
        <div
          className="flex justify-between items-center pt-3 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
            Total
          </span>
          <span className="font-bold text-xl" style={{ color: 'var(--color-text)' }}>
            {formatPrice(Math.max(0, finalTotal))}
          </span>
        </div>

        {/* Aviso de pedido mínimo */}
        {restaurantId && (
          <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            Pedido mínimo: {formatPrice(0)}
          </p>
        )}
      </div>
    </div>
  );
}
