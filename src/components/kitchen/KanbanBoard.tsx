// src/components/kitchen/KanbanBoard.tsx
'use client'

import { useKitchenOrders } from '@/hooks/useKitchenOrders'
import { useOrderNotifications } from '@/hooks/useOrderNotifications'
import type { KitchenOrder } from '@/types/kitchen.types'
import { updateOrderStatus, cancelOrderByRestaurant } from '@/actions/orders'
import {
    canTransitionStatus,
    getNextStatus,
} from '@/lib/utils/order-status.utils'
import { useState, useEffect, useMemo } from 'react'
import { Clock, ChefHat, Package, CheckCircle, Truck, Filter } from 'lucide-react'
import { toast } from 'sonner'
import type { OrderStatus } from '@prisma/client'
import { KanbanColumn } from './KanbanColumn'
import { OrderDetailsModal } from './OrderDetailsModal'
import { NewOrderAlert } from './NewOrderAlert'
import { OrderFilters } from './OrderFilters'
import { AssignDriverModal } from './AssignDriverModal'

const COLUMNS = [
    {
        id: 'NEW',
        title: '🔔 Novos',
        color: '#F59E0B',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: Clock
    },
    {
        id: 'PREPARING',
        title: '👨‍🍳 Em Preparo',
        color: '#3B82F6',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: ChefHat
    },
    {
        id: 'READY',
        title: '📦 Prontos',
        color: '#10B981',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        icon: Package
    },
    {
        id: 'DELIVERING',
        title: '🛵 Em Entrega',
        color: '#8B5CF6',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        icon: Truck
    },
    {
        id: 'COMPLETED',
        title: '✅ Finalizados',
        color: '#6B7280',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: CheckCircle
    }
] as const

export function KanbanBoard() {
    const { orders, refresh, loading, filters, updateFilters } = useKitchenOrders()
    const { requestPermission, notifyNewOrder, notifyStatusChange, isSupported } = useOrderNotifications()

    const [, setUpdating] = useState<string | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newOrders, setNewOrders] = useState<KitchenOrder[]>([])
    const [dismissedOrderIds, setDismissedOrderIds] = useState<Set<string>>(new Set())
    const [showFilters, setShowFilters] = useState(false)
    const [assignOrderId, setAssignOrderId] = useState<string | null>(null)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

    // Solicitar permissão para notificações ao montar
    useEffect(() => {
        if (isSupported) {
            requestPermission()
        }
    }, [isSupported, requestPermission])

    // Detectar novos pedidos para NewOrderAlert e notificações
    useEffect(() => {
        const pendingOrders = orders.filter(
            o => o.status === 'PENDING' && !dismissedOrderIds.has(o.id)
        )

        if (pendingOrders.length > 0) {
            // Pegar apenas os 3 mais recentes
            const recentNewOrders = pendingOrders
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3)

            setNewOrders(recentNewOrders)

            // Notificar apenas o primeiro (mais recente)
            if (recentNewOrders.length > 0) {
                notifyNewOrder(recentNewOrders[0])
            }
        }
    }, [orders, dismissedOrderIds, notifyNewOrder])

    const grouped = useMemo(() => ({
        NEW: orders.filter(
            o => o.status === 'PENDING' || o.status === 'CONFIRMED'
        ),
        PREPARING: orders.filter(o => o.status === 'PREPARING'),
        READY: orders.filter(o => o.status === 'READY'),
        DELIVERING: orders.filter(o => o.status === 'DELIVERING'),
        COMPLETED: orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED')
    }), [orders])

    async function handleMove(order: KitchenOrder, nextStatus?: string) {
        const targetStatus = nextStatus || getNextStatus(order.status as OrderStatus)
        if (!targetStatus) return

        if (!canTransitionStatus(order.status as OrderStatus, targetStatus as OrderStatus)) {
            toast.error('Transição de status inválida')
            return
        }

        setUpdating(order.id)

        const result = await updateOrderStatus({
            orderId: order.id,
            newStatus: targetStatus,
            restaurantId: order.restaurantId
        })

        if (result.success) {
            toast.success('Status atualizado')
            notifyStatusChange(order, targetStatus)
            refresh()
        } else {
            toast.error(result.error || 'Erro ao atualizar')
        }

        setUpdating(null)
    }

    async function handleCancel(order: KitchenOrder) {
        const reason = prompt('Motivo do cancelamento:')
        if (!reason) return

        setUpdating(order.id)

        const result = await cancelOrderByRestaurant({
            orderId: order.id,
            restaurantId: order.restaurantId,
            reason
        })

        if (result.success) {
            toast.success('Pedido cancelado')
            notifyStatusChange(order, 'CANCELLED')
            refresh()
        } else {
            toast.error(result.error || 'Erro ao cancelar')
        }

        setUpdating(null)
    }

    function handlePrint(order: KitchenOrder) {
        const content = `
PEDIDO #${order.id.slice(-6)}
Cliente: ${order.customerName}
Tipo: ${order.orderType === 'DINE_IN' ? `Mesa ${order.tableNumber}` : order.orderType}

${order.items
            .map(
                i =>
                    `${i.quantity}x ${i.menuItemName} - R$ ${(i.menuItemPrice * i.quantity)
                        .toFixed(2)
                        .replace('.', ',')}`
            )
            .join('\n')}

TOTAL: R$ ${order.total.toFixed(2).replace('.', ',')}
`

        const win = window.open('', '_blank')
        if (!win) return

        win.document.write(`
      <html>
      <body style="font-family: monospace; padding:20px">
      <pre>${content}</pre>
      <script>window.print();window.close();</script>
      </body>
      </html>
    `)
        win.document.close()
    }

    function handleOrderClick(order: KitchenOrder) {
        setSelectedOrder(order)
        setIsModalOpen(true)
    }

    function handleOrderAction(action: string, orderId: string) {
        const order = orders.find(o => o.id === orderId)
        if (!order) return

        switch (action) {
            case 'CONFIRM':
                handleMove(order, 'CONFIRMED')
                break
            case 'START_PREPARING':
                handleMove(order, 'PREPARING')
                break
            case 'MARK_READY':
                handleMove(order, 'READY')
                break
            case 'START_DELIVERY':
                handleMove(order, 'DELIVERING')
                break
            case 'COMPLETE':
                handleMove(order, 'DELIVERED')
                break
            case 'CANCEL':
                handleCancel(order)
                break
            case 'PRINT':
                handlePrint(order)
                break
            case 'VIEW_DETAILS':
                handleOrderClick(order)
                break
            case 'ASSIGN_DRIVER':
                setAssignOrderId(orderId)
                setIsAssignModalOpen(true)
                break
        }
    }

    function handleDismissAlert(orderId: string) {
        setDismissedOrderIds(prev => new Set([...prev, orderId]))
        setNewOrders(prev => prev.filter(o => o.id !== orderId))
    }

    if (loading) {
        return <div className="p-8 text-gray-500">Carregando pedidos...</div>
    }

    return (
        <>
            {/* New Order Alerts */}
            {newOrders.map((order) => (
                <NewOrderAlert
                    key={order.id}
                    order={order}
                    onDismiss={() => handleDismissAlert(order.id)}
                />
            ))}

            {/* Filters Bar */}
            <div className="mb-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    <Filter className="w-4 h-4" />
                    Filtros
                    {(filters.status || filters.orderType || filters.searchQuery) && (
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                </button>
            </div>

            {showFilters && (
                <div className="mb-6">
                    <OrderFilters
                        filters={{
                            status: filters.status || 'ALL',
                            orderType: filters.orderType || 'ALL',
                            searchQuery: filters.searchQuery || '',
                            sortBy: 'newest',
                        }}
                        onFilterChange={(newFilters) => {
                            updateFilters({
                                status: newFilters.status,
                                orderType: newFilters.orderType,
                                searchQuery: newFilters.searchQuery,
                            })
                        }}
                    />
                </div>
            )}

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[65vh]">
                {COLUMNS.map(col => {
                    const columnOrders = grouped[col.id]

                    const adaptedOrders = columnOrders.map(order => ({
                        ...order,
                        items: order.items.map(item => ({
                            ...item,
                            name: item.menuItemName,
                            price: item.menuItemPrice,
                        }))
                    }))

                    return (
                        <KanbanColumn
                            key={col.id}
                            title={col.title}
                            status={col.id}
                            orders={adaptedOrders}
                            color={col.color}
                            count={columnOrders.length}
                            onAction={handleOrderAction}
                            onOrderClick={handleOrderClick}
                        />
                    )
                })}
            </div>

            <OrderDetailsModal
                order={selectedOrder}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setSelectedOrder(null)
                }}
            />

            <AssignDriverModal
                orderId={assignOrderId || ''}
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false)
                    setAssignOrderId(null)
                }}
                onAssigned={refresh}
            />
        </>
    )
}
