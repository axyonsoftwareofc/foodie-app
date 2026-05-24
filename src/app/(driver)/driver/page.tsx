// src/app/(driver)/driver/page.tsx — APP DO ENTREGADOR
'use client'

import { useState } from 'react'
import {
    MapPin, Phone, Navigation, Clock, Truck,
    Power, PowerOff, DollarSign, Loader2, User
} from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils/format.utils'

type DriverStatus = 'OFFLINE' | 'ONLINE' | 'BUSY'

interface DriverDelivery {
    id: string
    orderId: string
    status: string
    restaurantName: string
    customerName: string
    customerAddress: string
    customerPhone: string
    distance: string
    earnings: number
    pickupAddress: string
    deliveryAddress: string
    estimatedTime: string
}

function DeliveryCard({ delivery, onAction }: {
    delivery: DriverDelivery
    onAction: (action: string) => void
}) {
    const isAssigned = delivery.status === 'ASSIGNED'
    const isPickedUp = delivery.status === 'PICKED_UP'

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">#{delivery.orderId.slice(-4)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isAssigned ? 'bg-blue-100 text-blue-700' :
                    isPickedUp ? 'bg-purple-100 text-purple-700' :
                    'bg-emerald-100 text-emerald-700'
                }`}>
                    {isAssigned ? 'Aguardando coleta' :
                     isPickedUp ? 'Coletado' : 'Em entrega'}
                </span>
            </div>

            {/* Route */}
            <div className="space-y-2">
                <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-xs text-gray-400">Retirada</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{delivery.restaurantName}</p>
                        <p className="text-xs text-gray-500 truncate">{delivery.pickupAddress}</p>
                    </div>
                </div>
                <div className="pl-2 border-l-2 border-dashed border-gray-200 ml-2 h-3" />
                <div className="flex items-start gap-2">
                    <Navigation className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-xs text-gray-400">Entrega</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{delivery.customerName}</p>
                        <p className="text-xs text-gray-500 truncate">{delivery.deliveryAddress}</p>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {delivery.estimatedTime || '--'}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {delivery.distance || '--'} km</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium"><DollarSign className="w-3 h-3" /> {formatPrice(delivery.earnings)}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                {isAssigned && (
                    <>
                        <button onClick={() => onAction('accept')} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform">
                            ✅ Aceitar Entrega
                        </button>
                        <button onClick={() => onAction('reject')} className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium text-sm active:scale-95 transition-transform">
                            Recusar
                        </button>
                    </>
                )}
                {isPickedUp && (
                    <>
                        <a href={`tel:${delivery.customerPhone}`} className="flex items-center justify-center gap-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm">
                            <Phone className="w-4 h-4" /> Ligar
                        </a>
                        <button onClick={() => onAction('navigate')} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform">
                            🧭 Navegar
                        </button>
                        <button onClick={() => onAction('complete')} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform">
                            🎉 Entregue
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

// Mock deliveries for demo
const MOCK_DELIVERIES: DriverDelivery[] = []

export default function DriverPage() {
    const [status, setStatus] = useState<DriverStatus>('OFFLINE')
    const [isToggling, setIsToggling] = useState(false)
    const [deliveries] = useState<DriverDelivery[]>(MOCK_DELIVERIES)
    const [activeDelivery, setActiveDelivery] = useState<DriverDelivery | null>(null)
    const [todayEarnings, setTodayEarnings] = useState(0)
    const [todayDeliveries, setTodayDeliveries] = useState(0)

    const toggleStatus = async () => {
        setIsToggling(true)
        const newStatus: DriverStatus = status === 'OFFLINE' ? 'ONLINE' : 'OFFLINE'
        setStatus(newStatus)
        toast.success(newStatus === 'ONLINE' ? 'Voce esta online! Aguardando pedidos...' : 'Voce esta offline')
        setIsToggling(false)
    }

    const handleAction = (delivery: DriverDelivery, action: string) => {
        switch (action) {
            case 'accept':
                setActiveDelivery({ ...delivery, status: 'PICKED_UP' })
                setStatus('BUSY')
                toast.success('Entrega aceita! Va ate o restaurante.')
                break
            case 'navigate':
                const dest = encodeURIComponent(delivery.deliveryAddress)
                window.open(`https://maps.google.com/?daddr=${dest}`, '_blank')
                break
            case 'complete':
                setActiveDelivery(null)
                setStatus('ONLINE')
                setTodayDeliveries(d => d + 1)
                setTodayEarnings(e => e + delivery.earnings)
                toast.success('Entrega concluida! 🎉')
                break
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Status Bar */}
            <div className={`px-4 py-6 text-white ${status === 'OFFLINE' ? 'bg-gray-800' : status === 'BUSY' ? 'bg-emerald-700' : 'bg-emerald-600'}`}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold">Entregador</h1>
                        <p className="text-sm opacity-80">
                            {status === 'OFFLINE' ? 'Voce esta offline' :
                             status === 'BUSY' ? 'Em entrega...' : 'Online — aguardando'}
                        </p>
                    </div>
                    <button
                        onClick={toggleStatus}
                        disabled={isToggling || status === 'BUSY'}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 ${
                            status === 'OFFLINE' ? 'bg-emerald-500 text-white' :
                            status === 'BUSY' ? 'bg-white/20 text-white cursor-not-allowed' :
                            'bg-red-500 text-white'
                        } disabled:opacity-60`}
                    >
                        {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> :
                         status === 'OFFLINE' ? <Power className="w-4 h-4" /> :
                         status === 'BUSY' ? <Truck className="w-4 h-4" /> :
                         <PowerOff className="w-4 h-4" />}
                        {status === 'OFFLINE' ? 'Ficar Online' :
                         status === 'BUSY' ? 'Em Entrega' : 'Ficar Offline'}
                    </button>
                </div>

                {/* Earnings */}
                <div className="flex gap-4">
                    <div className="bg-white/10 rounded-xl px-4 py-2">
                        <p className="text-xs opacity-70">Ganhos Hoje</p>
                        <p className="text-lg font-bold">{formatPrice(todayEarnings)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl px-4 py-2">
                        <p className="text-xs opacity-70">Entregas</p>
                        <p className="text-lg font-bold">{todayDeliveries}</p>
                    </div>
                </div>
            </div>

            {/* Active Delivery */}
            {activeDelivery && (
                <div className="px-4 -mt-3 mb-4">
                    <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-lg shadow-emerald-100 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-xs font-bold text-emerald-600 uppercase">Em Andamento</span>
                        </div>
                        <DeliveryCard delivery={activeDelivery} onAction={(action) => handleAction(activeDelivery, action)} />
                    </div>
                </div>
            )}

            {/* Available Deliveries */}
            <div className="px-4 py-4">
                <h2 className="font-semibold text-gray-900 mb-3">
                    {status === 'ONLINE' ? 'Entregas Disponiveis' : 'Historico de Entregas'}
                </h2>

                {deliveries.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                        <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        {status === 'ONLINE' ? (
                            <>
                                <p className="font-medium text-gray-500">Aguardando pedidos</p>
                                <p className="text-sm text-gray-400 mt-1">Novos pedidos aparecerao aqui</p>
                            </>
                        ) : (
                            <p className="text-gray-400">Fique online para receber pedidos</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {deliveries.map((d) => (
                            <DeliveryCard key={d.id} delivery={d} onAction={(action) => handleAction(d, action)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
                <div className="flex justify-around">
                    <button className="flex flex-col items-center gap-1 text-emerald-600">
                        <Truck className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Entregas</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-400">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Ganhos</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-gray-400">
                        <User className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Perfil</span>
                    </button>
                </div>
            </div>

            <div className="h-16" />
        </div>
    )
}
