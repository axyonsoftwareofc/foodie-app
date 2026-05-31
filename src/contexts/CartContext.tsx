// src/contexts/CartContext.tsx
'use client';

import { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { MenuItem, CartItem } from '@/types';
import { CartContextType } from '@/types/cart.types';
import { Coupon } from '@/lib/constants/coupon.constants';
import { calculateSubtotal, calculateTotalItems } from '@/lib/utils/cart.utils';
import { validateCoupon } from '@/lib/utils/coupon.utils';
import { CART_MESSAGES, CART_CONFIG } from '@/lib/constants/cart.constants';

export const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'foodie-cart';

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Estado do cupom
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // Hidratar do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed.items || []);
        setRestaurantId(parsed.restaurantId || null);
        setAppliedCoupon(parsed.appliedCoupon || null);
        setCouponDiscount(parsed.couponDiscount || 0);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Persistir no localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify({ items, restaurantId, appliedCoupon, couponDiscount })
        );
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [items, restaurantId, appliedCoupon, couponDiscount, isHydrated]);

  // Recalcular desconto quando items mudam
  useEffect(() => {
    if (appliedCoupon) {
      const subtotal = calculateSubtotal(items);
      const result = validateCoupon(appliedCoupon.code, subtotal);

      if (result.valid && result.discount !== undefined) {
        setCouponDiscount(result.discount);
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    }
  }, [items, appliedCoupon]);

  // Adicionar item ao carrinho
  const addItem = useCallback(
    (menuItem: MenuItem, quantity: number = 1, observation?: string) => {
      if (quantity < CART_CONFIG.minQuantityPerItem) return;

      setItems((currentItems) => {
        // Se for de outro restaurante, confirma antes de limpar
        if (restaurantId && restaurantId !== menuItem.restaurantId) {
          const confirmClear = window.confirm(CART_MESSAGES.differentRestaurant);
          if (!confirmClear) return currentItems;

          setRestaurantId(menuItem.restaurantId);
          setAppliedCoupon(null);
          setCouponDiscount(0);

          toast.info('Carrinho atualizado para novo restaurante', {
            icon: '🔄',
          });

          return [{ menuItem, quantity, observation }];
        }

        if (!restaurantId) {
          setRestaurantId(menuItem.restaurantId);
        }

        // Verifica se o item já existe (com mesma observação)
        const existingIndex = currentItems.findIndex(
          (item) => item.menuItem.id === menuItem.id && item.observation === observation
        );

        if (existingIndex >= 0) {
          const newItems = [...currentItems];
          const newQuantity = newItems[existingIndex].quantity + quantity;
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: Math.min(newQuantity, CART_CONFIG.maxQuantityPerItem),
          };

          toast.success(`${menuItem.name} atualizado no carrinho`, {
            icon: '🛒',
            duration: 2000,
          });

          return newItems;
        }

        toast.success(`${menuItem.name} adicionado ao carrinho`, {
          icon: '🛒',
          duration: 2000,
        });

        return [...currentItems, { menuItem, quantity, observation }];
      });

      setIsCartOpen(true);
    },
    [restaurantId]
  );

  // Remover item do carrinho
  const removeItem = useCallback((itemId: string, observation?: string) => {
    setItems((currentItems) => {
      const itemToRemove = currentItems.find(
        (item) => item.menuItem.id === itemId && item.observation === observation
      );

      const newItems = currentItems.filter(
        (item) => !(item.menuItem.id === itemId && item.observation === observation)
      );

      if (newItems.length === 0) {
        setRestaurantId(null);
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }

      if (itemToRemove) {
        toast.info(`${itemToRemove.menuItem.name} removido do carrinho`, {
          icon: '🗑️',
          duration: 2000,
        });
      }

      return newItems;
    });
  }, []);

  // Atualizar quantidade de um item
  const updateQuantity = useCallback(
    (itemId: string, quantity: number, observation?: string) => {
      if (quantity <= 0) {
        removeItem(itemId, observation);
        return;
      }

      if (quantity > CART_CONFIG.maxQuantityPerItem) return;

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.menuItem.id === itemId && item.observation === observation
            ? { ...item, quantity }
            : item
        )
      );
    },
    [removeItem]
  );

  // Limpar carrinho
  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setIsCartOpen(false);
    setAppliedCoupon(null);
    setCouponDiscount(0);

    toast.info('Carrinho limpo', {
      icon: '🧹',
    });
  }, []);

  // Aplicar cupom
  const applyCoupon = useCallback(
    (code: string): { success: boolean; error?: string } => {
      const subtotal = calculateSubtotal(items);
      const result = validateCoupon(code, subtotal);

      if (result.valid && result.coupon && result.discount !== undefined) {
        setAppliedCoupon(result.coupon);
        setCouponDiscount(result.discount);

        toast.success(`Cupom ${result.coupon.code} aplicado!`, {
          icon: '🎉',
          description: `Você ganhou R$ ${result.discount.toFixed(2)} de desconto`,
        });

        return { success: true };
      }

      return { success: false, error: result.error };
    },
    [items]
  );

  // Remover cupom
  const removeCoupon = useCallback(() => {
    const couponCode = appliedCoupon?.code;
    setAppliedCoupon(null);
    setCouponDiscount(0);

    if (couponCode) {
      toast.info(`Cupom ${couponCode} removido`);
    }
  }, [appliedCoupon]);

  const totalItems = calculateTotalItems(items);
  const totalPrice = calculateSubtotal(items);

  const value: CartContextType = {
    items,
    restaurantId,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
