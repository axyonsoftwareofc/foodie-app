// src/types/restaurant-management.types.ts
export interface RestaurantProfile {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  cuisine: string[];
  images: RestaurantImages;
  contact: RestaurantContact;
  address: RestaurantAddress;
  location: GeoLocation;
  operatingHours: OperatingHours[];
  status: RestaurantStatus;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime: number;
  acceptsReservation: boolean;
  tables: RestaurantTable[];
  /** Somente OWNER. Não é preenchido por leituras de contexto (ex.: layout do dashboard). */
  bankInfo?: BankInfo;
  rating: number;
  reviewCount: number;
  theme?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantImages {
  logo: string;
  banner: string;
  gallery: string[];
}

export interface RestaurantContact {
  phone: string;
  email: string;
  website?: string;
  whatsapp?: string;
}

export interface RestaurantAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

import type { DayOfWeek } from './restaurant.types';

export interface OperatingHours {
  day: DayOfWeek;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export type RestaurantStatus = 'OPEN' | 'CLOSED' | 'TEMPORARILY_CLOSED' | 'MAINTENANCE';

/** Status de mesa — mesmos valores do enum `TableStatus` do Prisma (maiúsculas). */
export type RestaurantTableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export interface RestaurantTable {
  id: string;
  /** `String` no banco (ex.: "12", "A3") — não é numérico. */
  number: string;
  location?: string;
  capacity: number;
  status: RestaurantTableStatus;
  qrCode?: string;
}

export interface BankInfo {
  bank: string;
  agency: string;
  account: string;
  accountType: 'checking' | 'savings';
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  holderName: string;
  document: string;
}

export interface Review {
  id: string;
  restaurantId: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  photos?: string[];
  response?: string;
  createdAt: string;
  helpful: number;
}

export interface RestaurantStats {
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  totalTables: number;
  occupancyRate: number;
  peakHours: string[];
}

export interface CreateRestaurantForm {
  name: string;
  subdomain?: string;
  description: string;
  category: string;
  cuisine: string[];
  phone: string;
  email: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime: number;
}
