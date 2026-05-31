// src/components/cart/CouponInput.tsx
'use client';

import { useState } from 'react';
import { Tag, X, Check, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatCouponSuccessMessage } from '@/lib/utils/coupon.utils';

export default function CouponInput() {
  const { appliedCoupon, couponDiscount, applyCoupon, removeCoupon } = useCart();

  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleApplyCoupon = async (): Promise<void> => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const result = applyCoupon(code.trim());

    if (result.success) {
      setCode('');
    } else {
      setError(result.error || 'Cupom inválido');
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  // Estado: Cupom aplicado com sucesso
  if (appliedCoupon) {
    return (
      <div
        className="rounded-2xl p-4 transition-colors"
        style={{ backgroundColor: 'var(--color-primary-light)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00A082] rounded-full flex items-center justify-center">
              <Check size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-[#00A082]">{appliedCoupon.code}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {formatCouponSuccessMessage(couponDiscount)}
              </p>
            </div>
          </div>

          <button
            onClick={removeCoupon}
            className="p-2 transition-colors hover:opacity-70"
            style={{ color: 'var(--color-text-tertiary)' }}
            aria-label="Remover cupom"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Estado: Input de cupom
  return (
    <div
      className="rounded-2xl border p-4 transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <Tag size={24} style={{ color: 'var(--color-text-secondary)' }} />

        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Digite seu cupom"
          className="flex-1 text-sm font-medium focus:outline-none bg-transparent"
          style={{ color: 'var(--color-text)' }}
          disabled={isLoading}
        />

        <button
          onClick={handleApplyCoupon}
          disabled={!code.trim() || isLoading}
          className="px-4 py-2 bg-[#00A082] text-white text-sm font-semibold rounded-full hover:bg-[#008F74] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Aplicar'}
        </button>
      </div>

      {error && (
        <p className="text-sm mt-2 ml-9" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
