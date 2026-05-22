// src/app/dashboard/cozinha/page.tsx — MODO COZINHA FULL-SCREEN
'use client'

import { useKitchenOrders } from '@/hooks/useKitchenOrders'
import { useOrderNotifications } from '@/hooks/useOrderNotifications'
import { useTabTitle } from '@/hooks/useTabTitle'
import type { KitchenOrder } from '@/types/kitchen.types'
import { updateOrderStatus, cancelOrderByRestaurant } from '@/actions/orders'
import { canTransitionStatus, getNextStatus } from '@/lib/utils/order-status.utils'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Clock, ChefHat, Package, CheckCircle, Truck, AlertTriangle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { OrderStatus } from '@prisma/client'
import Link from 'next/link'

const COLORS = {
    NEW: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', dot: 'bg-amber-500' },
    PREPARING: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', dot: 'bg-blue-500' },
    READY: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    DELIVERING: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', dot: 'bg-purple-500' },
    COMPLETED: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-500', dot: 'bg-gray-400' },
}

function formatElapsed(minutes: number): string {
    if (minutes < 1) return 'agora'
    if (minutes === 1) return '1 min'
    return `${minutes} min`
}

function getTimerColor(minutes: number, estimated: number): string {
    if (estimated <= 0) return 'text-gray-500'
    const ratio = minutes / estimated
    if (ratio < 0.5) return 'text-emerald-500'
    if (ratio < 0.8) return 'text-amber-500'
    return 'text-red-500 animate-pulse'
}

function getTimerBg(minutes: number, estimated: number): string {
    if (estimated <= 0) return 'bg-gray-100'
    const ratio = minutes / estimated
    if (ratio < 0.5) return 'bg-emerald-100'
    if (ratio < 0.8) return 'bg-amber-100'
    return 'bg-red-100'
}

function KitchenOrderCard({ order, onAction, onCancel }: {
    order: KitchenOrder
    onAction: (action: string) => void
    onCancel: (reason: string) => void
}) {
    const [showCancel, setShowCancel] = useState(false)
    const [cancelReason, setCancelReason] = useState('')

    const items = useMemo(() => {
        const raw = (order as unknown as Record<string, unknown>).items
        if (Array.isArray(raw)) return raw as Array<{ menuItemName?: string; name?: string; quantity?: number }>
        return []
    }, [order])

    const elapsed = useMemo(() => {
        if (!order.createdAt) return 0
        return Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
    }, [order.createdAt])

    const prepTime = (order as unknown as Record<string, unknown>).estimatedPreparationTime as number || 20

    const isNew = order.status === 'PENDING' || order.status === 'CONFIRMED'
    const isPreparing = order.status === 'PREPARING'
    const isReady = order.status === 'READY'
    const isDelivering = order.status === 'DELIVERING'

    const typeLabel = order.orderType === 'DINE_IN' ? `Mesa ${(order as unknown as Record<string, unknown>).tableNumber || ''}` :
        order.orderType === 'PICKUP' ? 'Retirada' : 'Delivery'

    const typeColor = order.orderType === 'DINE_IN' ? 'bg-purple-100 text-purple-700' :
        order.orderType === 'PICKUP' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'

    const nextStatus = getNextStatus(order.status as OrderStatus)

    return (
        <div className={`rounded-xl border-2 p-4 flex flex-col gap-3 ${isNew ? 'animate-pulse border-amber-400 shadow-lg shadow-amber-200' : 'border-gray-200'} bg-white`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400">#{order.id.slice(-4)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor}`}>{typeLabel}</span>
                </div>
                <span className={`text-xs font-bold ${getTimerColor(elapsed, prepTime)}`}>
                    {isNew ? `🆕 ${formatElapsed(elapsed)}` : `⏱ ${formatElapsed(elapsed)}`}
                </span>
            </div>

            {/* Items */}
            <div className="flex-1">
                <div className="flex flex-wrap gap-1">
                    {items.slice(0, 6).map((item, i) => (
                        <span key={i} className="text-sm font-medium bg-gray-100 px-2 py-1 rounded-lg">
                            {item.quantity || 1}x {item.menuItemName || item.name || 'Item'}
                        </span>
                    ))}
                    {items.length > 6 && (
                        <span className="text-xs text-gray-400 self-end">+{items.length - 6} itens</span>
                    )}
                </div>
            </div>

            {/* Actions — botões ENORMES pra toque */}
            <div className="flex gap-2">
                {isNew && (
                    <>
                        <button onClick={() => onAction('CONFIRM')} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform">
                            ✅ Aceitar
                        </button>
                        <button onClick={() => setShowCancel(true)} className="px-4 py-4 bg-red-50 text-red-600 rounded-xl font-bold active:scale-95 transition-transform">
                            ✕
                        </button>
                    </>
                )}

                {isPreparing && (
                    <button onClick={() => onAction('MARK_READY')} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform">
                        📦 Pronto!
                    </button>
                )}

                {isReady && (
                    <>
                        {order.orderType === 'DELIVERY' && (
                            <>
                                <button onClick={() => onAction('ASSIGN_DRIVER')} className="flex-1 py-4 bg-purple-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform">
                                    🛵 Despachar
                                </button>
                            </>
                        )}
                        {order.orderType === 'DINE_IN' && (
                            <button onClick={() => onAction('COMPLETE_DINE_IN')} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform">
                                🍽️ Servido
                            </button>
                        )}
                        {order.orderType === 'PICKUP' && (
                            <button onClick={() => onAction('COMPLETE_PICKUP')} className="flex-1 py-4 bg-orange-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform">
                                🤝 Retirado
                            </button>
                        )}
                    </>
                )}

                {isDelivering && (
                    <button onClick={() => onAction('COMPLETE')} className="flex-1 py-4 bg-gray-600 text-white rounded-xl font-bold text-lg active:scale-95 transition-transform">
                        ✅ Concluir
                    </button>
                )}
            </div>

            {/* Cancel Modal inline */}
            {showCancel && (
                <div className="border-t border-red-200 pt-3 mt-1">
                    <p className="text-sm font-medium text-red-700 mb-2">Motivo do cancelamento:</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                        {['Cliente desistiu', 'Sem ingredientes', 'Fora da area', 'Erro no pedido'].map((r) => (
                            <button key={r} onClick={() => setCancelReason(r)} className={`text-xs px-2 py-1 rounded-full ${cancelReason === r ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'}`}>
                                {r}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Ou digite o motivo..."
                        className="w-full text-sm px-3 py-2 border border-red-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => { onCancel(cancelReason || 'Cancelado'); setShowCancel(false) }} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium text-sm">
                            Confirmar Cancelamento
                        </button>
                        <button onClick={() => setShowCancel(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
                            Voltar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function CozinhaPage() {
    const router = useRouter()
    const { orders, refresh, loading } = useKitchenOrders()
    const { requestPermission, notifyNewOrder, isSupported } = useOrderNotifications()
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

    const pendingCount = useMemo(() =>
        orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').length,
    [orders])
    useTabTitle(pendingCount, 'Cozinha — Foodie')

    useEffect(() => {
        if (isSupported) requestPermission()
    }, [isSupported, requestPermission])

    const grouped = useMemo(() => ({
        NEW: orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED'),
        PREPARING: orders.filter(o => o.status === 'PREPARING'),
        READY: orders.filter(o => o.status === 'READY'),
        DELIVERING: orders.filter(o => o.status === 'DELIVERING'),
        COMPLETED: orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED'),
    }), [orders])

    useEffect(() => {
        const newOrders = grouped.NEW.filter(o => !dismissedIds.has(o.id))
        if (newOrders.length > 0) {
            notifyNewOrder(newOrders[0])
        }
    }, [grouped.NEW, dismissedIds, notifyNewOrder])

    const handleAction = useCallback(async (order: KitchenOrder, action: string) => {
        const statusMap: Record<string, string> = {
            CONFIRM: 'CONFIRMED',
            MARK_READY: 'READY',
            COMPLETE: 'DELIVERED',
            COMPLETE_DINE_IN: 'DELIVERED',
            COMPLETE_PICKUP: 'DELIVERED',
        }

        const targetStatus = statusMap[action] || getNextStatus(order.status as OrderStatus)
        if (!targetStatus) return

        const result = await updateOrderStatus({
            orderId: order.id,
            newStatus: targetStatus,
            restaurantId: order.restaurantId as string,
        })

        if (result.success) {
            setDismissedIds(prev => new Set([...prev, order.id]))
            toast.success(`Pedido #${order.id.slice(-4)} → ${targetStatus}`)
            refresh()
        } else {
            toast.error(result.error || 'Erro')
        }
    }, [refresh])

    const handleCancel = useCallback(async (order: KitchenOrder, reason: string) => {
        const result = await cancelOrderByRestaurant({
            orderId: order.id,
            restaurantId: order.restaurantId as string,
            reason,
        })
        if (result.success) {
            toast.success('Pedido cancelado')
            refresh()
        } else {
            toast.error(result.error || 'Erro ao cancelar')
        }
    }, [refresh])

    const columns = [
        { id: 'NEW' as const, title: '🔔 Novos', count: grouped.NEW.length },
        { id: 'PREPARING' as const, title: '👨‍🍳 Preparando', count: grouped.PREPARING.length },
        { id: 'READY' as const, title: '📦 Prontos', count: grouped.READY.length },
        { id: 'DELIVERING' as const, title: '🛵 Entrega', count: grouped.DELIVERING.length },
        { id: 'COMPLETED' as const, title: '✅ Finalizados', count: grouped.COMPLETED.length },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Carregando cozinha...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Bar */}
            <header className="sticky top-0 z-40 bg-gray-900 text-white px-4 py-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/orders" className="p-1 -ml-1">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="font-bold text-lg">Cozinha</h1>
                        <p className="text-xs text-gray-400">
                            {orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length} ativos
                        </p>
                    </div>
                </div>
                <button onClick={refresh} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform">
                    Atualizar
                </button>
            </header>

            {/* Columns Grid */}
            <div className="h-[calc(100vh-57px)] overflow-x-auto">
                <div className="flex gap-3 p-3 min-h-full" style={{ minWidth: columns.length * 320 }}>
                    {columns.map((col) => (
                        <div key={col.id} className="flex-shrink-0 w-80 flex flex-col">
                            {/* Column Header */}
                            <div className={`sticky top-[57px] z-30 ${COLORS[col.id].bg} ${COLORS[col.id].border} border rounded-xl p-3 mb-3`}>
                                <div className="flex items-center justify-between">
                                    <h2 className={`font-bold ${COLORS[col.id].text}`}>{col.title}</h2>
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${COLORS[col.id].dot} text-white`}>
                                        {col.count}
                                    </span>
                                </div>
                            </div>

                            {/* Orders */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                {grouped[col.id].map((order) => (
                                    <KitchenOrderCard
                                        key={order.id}
                                        order={order}
                                        onAction={(action) => handleAction(order, action)}
                                        onCancel={(reason) => handleCancel(order, reason)}
                                    />
                                ))}
                                {grouped[col.id].length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        {col.id === 'NEW' ? 'Nenhum pedido novo 🎉' :
                                            col.id === 'PREPARING' ? 'Nada preparando' :
                                                col.id === 'READY' ? 'Nada pronto ainda' :
                                                    col.id === 'DELIVERING' ? 'Nada em entrega' :
                                                        'Vazio'}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
