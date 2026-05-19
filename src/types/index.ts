// src/types/index.ts

// ============================================
// RESTAURANT TYPES
// ============================================

export interface Restaurant {
    id: string;
    name: string;
    image: string;
    rating: number;
    reviewCount?: number;
    deliveryTime: string;
    deliveryFee: number;
    category: string;
    promoted?: boolean;
    isOpen?: boolean;
    isActive?: boolean;
    address?: string;
    description?: string;
    deliveryRadius?: number;
    minimumOrder?: number;
    deliveryTimeMin?: number;
    deliveryTimeMax?: number;
    addressLat?: number;
    addressLng?: number;
    addressStreet?: string;
    addressNumber?: string;
    logo?: string;
    coverImage?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    openingHours?: OpeningHours[];
    settings?: RestaurantSettings;
    cnpj?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
}

export type DayOfWeek =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';

export interface OpeningHours {
    day: DayOfWeek;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
}

export interface RestaurantSettings {
    acceptsReservation?: boolean;
    deliveryRadius?: number;
    minimumOrder?: number;
    estimatedDeliveryTime?: number;
    taxPercentage?: number;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
}

// ============================================
// MENU TYPES
// ============================================

export interface MenuItem {
    id: string;
    restaurantId: string;
    name: string;
    description: string | null | undefined;
    price: number;
    image: string | null;
    category: string;
    popular?: boolean;
    available?: boolean;
}

export interface MenuCategory {
    name: string;
    items: MenuItem[];
}

// ============================================
// CART TYPES
// ============================================

export interface CartItem {
    menuItem: MenuItem;
    quantity: number;
    observation?: string;
}

export interface CartState {
    items: CartItem[];
    restaurantId: string | null;
}

export interface CartSummary {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    itemCount: number;
}

// ============================================
// ORDER TYPES
// ============================================

export type OrderStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'READY'
    | 'PICKED_UP'
    | 'DELIVERED'
    | 'CANCELLED';

export type OrderType = 'DELIVERY' | 'DINE_IN' | 'PICKUP';

export interface Order {
    id: string;
    customerId: string;
    restaurantId: string;
    status: OrderStatus;
    items: CartItem[];
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
    deliveryAddress: Address;
    paymentMethod: PaymentMethod;
    createdAt: Date | string;
    updatedAt: Date | string;
    estimatedDelivery?: string;
}

// ============================================
// KITCHEN ORDER TYPES (Painel da Cozinha)
// ============================================

export interface KitchenOrderItem {
    name?: string;
    productName?: string;
    quantity?: number;
    price?: number;
    observations?: string;
    addons?: Array<{ name: string }>;
}

export interface KitchenOrder {
    id: string;
    orderNumber?: number;
    orderType: OrderType;
    status: OrderStatus;
    customerName: string;
    customerPhone?: string;
    tableNumber?: string;
    items: KitchenOrderItem[];
    total: number;
    createdAt: string;
    confirmedAt?: string;
    preparingAt?: string;
    readyAt?: string;
    deliveredAt?: string;
}

// ============================================
// USER TYPES
// ============================================

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatar?: string;
}

export interface Address {
    id: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault?: boolean;
    label?: string;
}

export type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH';

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ============================================
// FILTER TYPES
// ============================================

export interface RestaurantFilters {
    category?: string;
    search?: string;
    minRating?: number;
    maxDeliveryFee?: number;
    freeDeliveryOnly?: boolean;
    sortBy?: 'relevance' | 'rating' | 'deliveryTime' | 'deliveryFee';
}

export interface KitchenFiltersState {
    status?: string;
    searchQuery: string;
    orderType?: OrderType | 'ALL';
    sortBy: 'newest' | 'oldest' | 'priority';
}

// Re-export de tipos específicos
export * from './menu.types';
export * from './cart.types';
export * from './checkout.types';
