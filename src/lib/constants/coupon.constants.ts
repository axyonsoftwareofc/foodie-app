// src/lib/constants/coupon.constants.ts
export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  description: string;
}

export const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: 'PRIMEIRA',
    type: 'percentage',
    value: 50,
    maxDiscount: 25,
    description: '50% OFF até R$ 25',
  },
  {
    code: 'FRETEGRATIS',
    type: 'fixed',
    value: 0, // Será tratado como frete grátis
    description: 'Frete Grátis',
  },
  {
    code: 'DESCONTO10',
    type: 'fixed',
    value: 10,
    minOrderValue: 30,
    description: 'R$ 10 OFF em pedidos acima de R$ 30',
  },
  {
    code: 'VOLTA20',
    type: 'percentage',
    value: 20,
    maxDiscount: 15,
    minOrderValue: 40,
    description: '20% OFF até R$ 15 em pedidos acima de R$ 40',
  },
];

export const COUPON_MESSAGES = {
  placeholder: 'Digite seu cupom',
  apply: 'Aplicar',
  applied: 'Cupom aplicado!',
  removed: 'Cupom removido',
  invalid: 'Cupom inválido ou expirado',
  minOrderNotMet: 'Pedido mínimo de {value} para este cupom',
  success: 'Você ganhou {discount} de desconto!',
} as const;

export const FREE_DELIVERY_COUPON_CODE = 'FRETEGRATIS';
