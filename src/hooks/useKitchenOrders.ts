// src/hooks/useKitchenOrders.ts
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getOrdersForRestaurant } from '@/actions/orders'
import type { KitchenOrder } from '@/types/kitchen.types'
import type { OrderType } from '@/types'
import { toast } from 'sonner'

// EXPORTAR o tipo para uso em outros componentes
export type { KitchenOrder as Order }

export interface KitchenFilters {
    status?: string
    orderType?: OrderType | 'ALL'
    searchQuery?: string
    dateFrom?: string
    dateTo?: string
}

export function useKitchenOrders() {
    const [orders, setOrders] = useState<KitchenOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState<KitchenFilters>({})
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const previousOrderIdsRef = useRef<Set<string>>(new Set())
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        audioRef.current = new Audio('/sounds/new-order.mp3')
    }, [])

    const fetchOrders = useCallback(async () => {
        const result = await getOrdersForRestaurant({
            filters: {
                status: filters.status !== 'ALL' ? filters.status : undefined,
                orderType: filters.orderType !== 'ALL' ? filters.orderType : undefined,
                search: filters.searchQuery,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
            }
        })

        if (result.data) {
            const newOrders = result.data
            const currentIds = new Set(newOrders.map(o => o.id))
            const previousIds = previousOrderIdsRef.current

            // Detectar novos pedidos (apenas PENDING)
            for (const order of newOrders) {
                if (!previousIds.has(order.id) && order.status === 'PENDING') {
                    // Tocar som
                    audioRef.current?.play().catch(() => {})

                    // Toast
                    toast.success(`🔔 Novo pedido #${order.id.slice(-4)}!`, {
                        description:
                            order.orderType === 'DINE_IN'
                                ? `Mesa ${order.tableNumber}`
                                : order.orderType,
                        duration: 5000
                    })
                }
            }

            previousOrderIdsRef.current = currentIds
            setOrders(newOrders)
            setLastUpdate(new Date())
        }

        setLoading(false)
    }, [filters])

    useEffect(() => {
        fetchOrders()

        let interval: NodeJS.Timeout | null = null

        const startPolling = () => {
            if (interval) clearInterval(interval)
            interval = setInterval(fetchOrders, 30000)
        }

        const stopPolling = () => {
            if (interval) { clearInterval(interval); interval = null }
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchOrders()
                startPolling()
            } else {
                stopPolling()
            }
        }

        startPolling()
        document.addEventListener('visibilitychange', handleVisibility)

        return () => {
            stopPolling()
            document.removeEventListener('visibilitychange', handleVisibility)
        }
    }, [fetchOrders])

    const updateFilters = useCallback((newFilters: Partial<KitchenFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }))
        setLoading(true)
    }, [])

    const clearFilters = useCallback(() => {
        setFilters({})
        setLoading(true)
    }, [])

    return {
        orders,
        loading,
        filters,
        lastUpdate,
        refresh: fetchOrders,
        updateFilters,
        clearFilters
    }
}
