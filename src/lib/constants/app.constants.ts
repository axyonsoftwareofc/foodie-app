// src/lib/constants/app.constants.ts
export const APP_NAME = 'Foodie';
export const APP_DESCRIPTION = 'Delivery de comida dos melhores restaurantes';

export const CURRENCY = {
  code: 'BRL',
  symbol: 'R$',
  locale: 'pt-BR',
} as const;

export const DELIVERY = {
  freeDeliveryThreshold: 50, // Entrega grátis acima de R$ 50
  minOrderValue: 15, // Pedido mínimo
} as const;
