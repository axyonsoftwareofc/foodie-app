// src/types/cart.types.ts
import { CartItem, MenuItem } from './index';
import { Coupon } from '@/lib/constants/coupon.constants';

export interface CartContextType {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (item: MenuItem, quantity?: number, observation?: string) => void;
  removeItem: (itemId: string, observation?: string) => void;
  updateQuantity: (itemId: string, quantity: number, observation?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  // Cupom
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  applyCoupon: (code: string) => { success: boolean; error?: string };
  removeCoupon: () => void;
}
