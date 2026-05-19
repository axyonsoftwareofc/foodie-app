// src/types/kitchen.types.ts
import type { OrderData } from '@/actions/orders'
import type { OrderStatus } from '@prisma/client'

export type KitchenOrder = OrderData

export type KitchenColumn =
    | 'PENDING'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'READY'
    | 'DELIVERED'

export interface KitchenGroupedOrders {
    PENDING: KitchenOrder[]
    CONFIRMED: KitchenOrder[]
    PREPARING: KitchenOrder[]
    READY: KitchenOrder[]
    DELIVERED: KitchenOrder[]
}