// src/hooks/useCart.ts
'use client';

import { useContext } from 'react';
import { CartContext } from '@/contexts/CartContext';
import { CartContextType } from '@/types/cart.types';

/**
 * Hook para acessar o contexto do carrinho
 * @throws Error se usado fora do CartProvider
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}
