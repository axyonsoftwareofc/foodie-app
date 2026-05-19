// src/lib/utils/checkout.utils.ts
import { OrderData, CartItem, Address, PaymentMethod } from '@/types';

/**
 * Gera um ID único para o pedido
 */
export function generateOrderId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`.toUpperCase();
}

/**
 * Calcula tempo estimado de entrega
 */
export function calculateEstimatedDelivery(deliveryTime: string): string {
    // deliveryTime é algo como "25-35 min"
    const match = deliveryTime.match(/(\d+)-(\d+)/);

    if (!match) {
        return new Date(Date.now() + 45 * 60 * 1000).toISOString();
    }

    const maxMinutes = parseInt(match[2], 10);
    const estimatedTime = new Date(Date.now() + maxMinutes * 60 * 1000);

    return estimatedTime.toISOString();
}

/**
 * Formata o endereço para exibição
 */
export function formatAddress(address: Address): string {
    const parts = [
        `${address.street}, ${address.number}`,
        address.complement,
        address.neighborhood,
        `${address.city} - ${address.state}`,
        address.zipCode,
    ].filter(Boolean);

    return parts.join(', ');
}

/**
 * Formata CEP enquanto digita
 */
export function formatZipCode(value: string): string {
    const numbers = value.replace(/\D/g, '');

    if (numbers.length <= 5) {
        return numbers;
    }

    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
}

/**
 * Cria objeto do pedido
 */
export function createOrder(
    items: CartItem[],
    address: Address,
    paymentMethod: PaymentMethod,
    subtotal: number,
    deliveryFee: number,
    discount: number,
    restaurantId: string,
    restaurantName: string,
    deliveryTime: string,
    changeFor?: number
): OrderData {
    return {
        id: generateOrderId(),
        items,
        address,
        paymentMethod,
        changeFor,
        subtotal,
        deliveryFee,
        discount,
        total: subtotal + deliveryFee - discount,
        restaurantId,
        restaurantName,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        estimatedDelivery: calculateEstimatedDelivery(deliveryTime),
    };
}

/**
 * Calcula distância entre duas coordenadas (Haversine)
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371 // Raio da Terra em km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return Math.round(distance * 10) / 10
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
}

/**
 * Calcula taxa de entrega baseada na distância
 */
export function calculateDeliveryFeeByDistance(
    distanceKm: number,
    baseFee: number = 5,
    pricePerKm: number = 2
): number {
    if (distanceKm <= 1) return baseFee

    const additionalKm = Math.ceil(distanceKm - 1)
    return baseFee + additionalKm * pricePerKm
}

/**
 * Estima tempo de entrega
 */
export function estimateDeliveryTimeByDistance(
    distanceKm: number,
    preparationTimeMin: number = 15
): { min: number; max: number } {
    const travelTime = Math.ceil(distanceKm * 3)

    return {
        min: preparationTimeMin + travelTime,
        max: preparationTimeMin + travelTime + 10,
    }
}

/**
 * Formata tempo estimado para exibição
 */
export function formatEstimatedTime(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`
    }

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (mins === 0) {
        return `${hours}h`
    }

    return `${hours}h ${mins}min`
}

/**
 * Verifica se endereço está dentro do raio de entrega
 */
export function isWithinDeliveryRadius(
    distanceKm: number,
    maxRadiusKm: number
): boolean {
    return distanceKm <= maxRadiusKm
}