// src/app/orders/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getOrderById } from '@/actions/orders'
import type { OrderData } from '@/actions/orders'
import { formatPrice } from '@/lib/utils/format.utils'
import { ORDER_STATUS_CONFIG } from '@/lib/constants/order.constants'
import {
    ArrowLeft,
    Clock,
    MapPin,
    Phone,
    Receipt,
    Store,
    User,
    CreditCard
} from 'lucide-react'
import { toast } from 'sonner'

export default function OrderDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<OrderData | null>(null)
    const [loading, setLoading] = useState(true)

    const orderId = params.id as string

    useEffect(() => {
        async function loadOrder() {
            const result = await getOrderById(orderId)

            if (result.error || !result.data) {
                toast.error('Pedido não encontrado')
                router.push('/orders')
                return
            }

            setOrder(result.data)
            setLoading(false)
        }

        loadOrder()
    }, [orderId, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-[#00A082] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Carregando pedido...</p>
                </div>
            </div>
        )
    }

    if (!order) {
        return null
    }

    const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
        label: order.status,
        color: '#999',
        bgColor: '#f3f3f3',
        icon: '📋'
    }

    const orderDate = new Date(order.createdAt)
    const formattedDate = orderDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold">
                                Pedido #{String(order.id).slice(-4).toUpperCase()}
                            </h1>
                            <p className="text-sm text-gray-500">{formattedDate}</p>
                        </div>
                        <div
                            className="px-3 py-1.5 rounded-full text-sm font-medium"
                            style={{
                                backgroundColor: statusConfig.bgColor,
                                color: statusConfig.color
                            }}
                        >
                            {statusConfig.icon} {statusConfig.label}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
                {/* Status Timeline */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock size={18} />
                        Status do Pedido
                    </h2>

                    <div className="relative">
                        {/* Timeline */}
                        <div className="space-y-4">
                            <TimelineItem
                                label="Pedido Realizado"
                                time={order.createdAt}
                                active={true}
                                icon="🛒"
                            />

                            <TimelineItem
                                label="Confirmado"
                                time={order.preparationStartedAt}
                                active={order.status !== 'PENDING'}
                                icon="✅"
                            />

                            <TimelineItem
                                label="Em Preparo"
                                time={order.preparationStartedAt}
                                active={order.status === 'PREPARING' || order.status === 'READY' || order.status === 'DELIVERED'}
                                icon="👨‍🍳"
                            />

                            <TimelineItem
                                label="Pronto"
                                time={order.readyAt}
                                active={order.status === 'READY' || order.status === 'DELIVERED'}
                                icon="📦"
                            />

                            {order.orderType === 'DELIVERY' && (
                                <TimelineItem
                                    label="Saiu para Entrega"
                                    time={order.deliveredAt}
                                    active={order.status === 'DELIVERING'}
                                    icon="🛵"
                                />
                            )}

                            <TimelineItem
                                label={order.orderType === 'DELIVERY' ? 'Entregue' : 'Finalizado'}
                                time={order.deliveredAt}
                                active={order.status === 'DELIVERED'}
                                icon="🎉"
                            />
                        </div>
                    </div>

                    {order.estimatedPreparationTime && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                ⏱️ Tempo estimado: {order.estimatedPreparationTime} minutos
                            </p>
                        </div>
                    )}
                </div>

                {/* Restaurant Info */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Store size={18} />
                        Restaurante
                    </h2>
                    <p className="text-lg font-medium">{order.restaurantName}</p>
                </div>

                {/* Delivery Address */}
                {order.orderType === 'DELIVERY' && order.address && (
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <MapPin size={18} />
                            Endereço de Entrega
                        </h2>
                        <div className="space-y-1">
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-gray-600">
                                {order.address.street}, {order.address.number}
                                {order.address.complement && ` - ${order.address.complement}`}
                            </p>
                            <p className="text-gray-600">
                                {order.address.neighborhood} - {order.address.city}/{order.address.state}
                            </p>
                            <p className="text-gray-600">CEP: {order.address.zipCode}</p>
                        </div>
                    </div>
                )}

                {/* Pickup/Dine-in Info */}
                {order.orderType === 'PICKUP' && (
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <Store size={18} />
                            Retirada no Local
                        </h2>
                        <p className="text-gray-600">
                            Dirija-se ao restaurante para retirar seu pedido
                        </p>
                    </div>
                )}

                {order.orderType === 'DINE_IN' && order.tableNumber && (
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-semibold mb-4 flex items-center gap-2">
                            <User size={18} />
                            Consumo no Local
                        </h2>
                        <p className="text-gray-600">
                            Mesa: <span className="font-bold">{order.tableNumber}</span>
                        </p>
                    </div>
                )}

                {/* Customer Info */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Phone size={18} />
                        Informações de Contato
                    </h2>
                    <div className="space-y-2">
                        <p>
                            <span className="text-gray-500">Nome:</span>{' '}
                            <span className="font-medium">{order.customerName}</span>
                        </p>
                        {order.customerPhone && (
                            <p>
                                <span className="text-gray-500">Telefone:</span>{' '}
                                <span className="font-medium">{order.customerPhone}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Receipt size={18} />
                        Itens do Pedido
                    </h2>

                    <div className="space-y-3">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start py-2 border-b last:border-0">
                                <div className="flex-1">
                                    <div className="flex items-start gap-2">
                                        <span className="font-medium min-w-[2rem]">
                                            {item.quantity}x
                                        </span>
                                        <div>
                                            <p className="font-medium">{item.menuItemName}</p>
                                            {item.observation && (
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    Obs: {item.observation}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="font-medium">
                                    {formatPrice(item.menuItemPrice * item.quantity)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <CreditCard size={18} />
                        Pagamento
                    </h2>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span>{formatPrice(order.subtotal)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600">Taxa de Entrega</span>
                            <span>{formatPrice(order.deliveryFee)}</span>
                        </div>

                        {order.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Desconto {order.couponCode && `(${order.couponCode})`}</span>
                                <span>- {formatPrice(order.discount)}</span>
                            </div>
                        )}

                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total</span>
                            <span>{formatPrice(order.total)}</span>
                        </div>

                        <div className="pt-2">
                            <p className="text-sm text-gray-600">
                                Método: <span className="font-medium capitalize">
                                    {order.paymentMethod === 'pix_manual' ? 'PIX' :
                                        order.paymentMethod === 'cash' ? 'Dinheiro' :
                                            order.paymentMethod}
                                </span>
                            </p>
                            {order.changeFor && (
                                <p className="text-sm text-gray-600">
                                    Troco para: {formatPrice(order.changeFor)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Cancel Button */}
                {['PENDING', 'CONFIRMED'].includes(order.status) && (
                    <button
                        onClick={() => {
                            // Implementar cancelamento
                            toast.info('Funcionalidade de cancelamento em desenvolvimento')
                        }}
                        className="w-full py-3 text-red-600 font-medium border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                    >
                        Cancelar Pedido
                    </button>
                )}
            </div>
        </div>
    )
}

function TimelineItem({
                          label,
                          time,
                          active,
                          icon
                      }: {
    label: string
    time: string | null
    active: boolean
    icon: string
}) {
    const formattedTime = time ? new Date(time).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    }) : null

    return (
        <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg
                ${active ? 'bg-[#00A082] text-white' : 'bg-gray-200 text-gray-400'}`}
            >
                {icon}
            </div>
            <div className="flex-1">
                <p className={`font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {label}
                </p>
                {active && formattedTime && (
                    <p className="text-sm text-gray-500">{formattedTime}</p>
                )}
            </div>
        </div>
    )
}