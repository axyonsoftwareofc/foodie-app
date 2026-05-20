'use client'

import { useState, useEffect } from 'react'
import { X, Truck, User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getDrivers, assignDriver } from '@/actions/delivery-actions'
import type { DeliveryDriver } from '@/types/delivery.types'

interface AssignDriverModalProps {
    orderId: string
    isOpen: boolean
    onClose: () => void
    onAssigned: () => void
}

export function AssignDriverModal({ orderId, isOpen, onClose, onAssigned }: AssignDriverModalProps) {
    const [drivers, setDrivers] = useState<DeliveryDriver[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAssigning, setIsAssigning] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true)
            getDrivers().then((result) => {
                if (result.data) {
                    setDrivers(result.data.filter((d) => d.isAvailable))
                }
                setIsLoading(false)
            })
        }
    }, [isOpen])

    const handleAssign = async (driverId: string) => {
        setIsAssigning(true)
        const result = await assignDriver(orderId, driverId)
        if (result.success) {
            toast.success('Entregador atribuido!')
            onAssigned()
            onClose()
        } else {
            toast.error(result.error || 'Erro ao atribuir')
        }
        setIsAssigning(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto shadow-xl">
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-emerald-600" />
                        <h2 className="font-bold text-gray-900">Atribuir Entregador</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                        </div>
                    ) : drivers.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 font-medium">Nenhum entregador disponivel</p>
                            <p className="text-sm text-gray-400 mt-1">Todos os entregadores estao ocupados ou offline</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {drivers.map((driver) => (
                                <button
                                    key={driver.id}
                                    onClick={() => handleAssign(driver.id)}
                                    disabled={isAssigning}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors disabled:opacity-50 text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                                        {driver.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{driver.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {driver.vehicleType === 'MOTO' ? '🛵 Moto' :
                                             driver.vehicleType === 'BIKE' ? '🚲 Bike' : '🚗 Carro'}
                                            {driver.vehiclePlate && ` • ${driver.vehiclePlate}`}
                                            {' • '}⭐ {driver.rating}
                                        </p>
                                    </div>
                                    <div className="text-xs text-emerald-600 font-medium">
                                        Atribuir →
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
