// src/lib/constants/cart.constants.ts
export const CART_MESSAGES = {
  addedToCart: 'Item adicionado ao carrinho!',
  removedFromCart: 'Item removido do carrinho',
  clearedCart: 'Carrinho limpo',
  differentRestaurant:
    'Seu carrinho tem itens de outro restaurante. Deseja limpar e adicionar este item?',
  emptyCart: 'Seu carrinho está vazio',
  emptyCartDescription: 'Adicione itens do cardápio para fazer seu pedido',
} as const;

export const CART_CONFIG = {
  maxQuantityPerItem: 99,
  minQuantityPerItem: 1,
} as const;
