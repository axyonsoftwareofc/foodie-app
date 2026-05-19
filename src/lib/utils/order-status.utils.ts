// src/lib/utils/order-status.utils.ts
import type { OrderStatus } from '@prisma/client'

export type KitchenColumn = 'NEW' | 'PREPARING' | 'READY'

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: []
}

export function canTransitionStatus(
    current: OrderStatus,
    next: OrderStatus
): boolean {
    return VALID_TRANSITIONS[current]?.includes(next) ?? false
}

export function getNextStatus(current: OrderStatus): OrderStatus | null {
    switch (current) {
        case 'PENDING':
            return 'CONFIRMED'
        case 'CONFIRMED':
            return 'PREPARING'
        case 'PREPARING':
            return 'READY'
        case 'READY':
            return 'DELIVERED'
        default:
            return null
    }
}

export function mapStatusToColumn(status: OrderStatus): KitchenColumn | null {
    if (status === 'PENDING' || status === 'CONFIRMED') return 'NEW'
    if (status === 'PREPARING') return 'PREPARING'
    if (status === 'READY') return 'READY'
    return null
}
