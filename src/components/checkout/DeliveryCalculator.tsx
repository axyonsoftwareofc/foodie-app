// src/components/checkout/DeliveryCalculator.tsx
'use client'

import { useState, useEffect } from 'react'
import { Navigation, AlertCircle, Loader2, MapPin } from 'lucide-react'
import { useGeolocation } from '@/hooks/useGeolocation'
import {
    calculateDistance,
    calculateDeliveryFeeByDistance,
    estimateDeliveryTimeByDistance,
    isWithinDeliveryRadius
} from '@/lib/utils/checkout.utils'
import { formatPrice } from '@/lib/utils/format.utils'

interface DeliveryCalculatorProps {
    restaurantAddress: {
        lat: number
        lng: number
        address: string
    }
    restaurantConfig: {
        deliveryFee: number
        deliveryRadius: number
        minimumOrder: number
        estimatedTime: string
    }
    onFeeCalculated?: (fee: number, distance: number, estimatedTime: string, withinRadius: boolean) => void
}

export function DeliveryCalculator({
                                       restaurantAddress,
                                       restaurantConfig,
                                       onFeeCalculated,
                                   }: DeliveryCalculatorProps) {
    const { loading, error, getCurrentPosition } = useGeolocation()
    const [distance, setDistance] = useState<number | null>(null)
    const [deliveryFee, setDeliveryFee] = useState<number>(restaurantConfig.deliveryFee)
    const [estimatedTime, setEstimatedTime] = useState<string>(restaurantConfig.estimatedTime)
    const [isWithinRadius, setIsWithinRadius] = useState<boolean>(true)
    const [calculating, setCalculating] = useState(false)

    const handleCalculate = async () => {
        setCalculating(true)
        const position = await getCurrentPosition()

        if (position.latitude && position.longitude) {
            const dist = calculateDistance(
                position.latitude,
                position.longitude,
                restaurantAddress.lat,
                restaurantAddress.lng
            )

            setDistance(dist)

            const withinRadius = isWithinDeliveryRadius(dist, restaurantConfig.deliveryRadius)
            setIsWithinRadius(withinRadius)

            if (withinRadius) {
                const fee = calculateDeliveryFeeByDistance(dist, restaurantConfig.deliveryFee)
                setDeliveryFee(fee)

                const time = estimateDeliveryTimeByDistance(dist)
                const timeString = `${time.min}-${time.max} min`
                setEstimatedTime(timeString)

                if (onFeeCalculated) {
                    onFeeCalculated(fee, dist, timeString, withinRadius)
                }
            } else {
                // Fora do raio - usar taxa base mas marcar como inválido
                if (onFeeCalculated) {
                    onFeeCalculated(restaurantConfig.deliveryFee, dist, restaurantConfig.estimatedTime, withinRadius)
                }
            }
        }

        setCalculating(false)
    }

    useEffect(() => {
        // Notificar componente pai sobre valores iniciais
        if (onFeeCalculated) {
            onFeeCalculated(
                restaurantConfig.deliveryFee,
                0,
                restaurantConfig.estimatedTime,
                true
            )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div
            className="rounded-xl border p-4 space-y-3"
            style={{
                backgroundColor: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
            }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#00A082] rounded-full flex items-center justify-center">
                        <MapPin size={16} className="text-white" />
                    </div>
                    <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        Calcular Frete
                    </h3>
                </div>

                {!distance && (
                    <button
                        onClick={handleCalculate}
                        disabled={loading || calculating}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors"
                        style={{ backgroundColor: '#00A082' }}
                    >
                        {loading || calculating ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Calculando...
                            </>
                        ) : (
                            <>
                                <Navigation size={14} />
                                Usar localização
                            </>
                        )}
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{
                    backgroundColor: 'var(--color-error-light)',
                    color: 'var(--color-error)',
                }}>
                    <AlertCircle size={16} />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {distance !== null && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                            Distância:
                        </span>
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                            {distance} km
                        </span>
                    </div>

                    {!isWithinRadius ? (
                        <div className="p-3 rounded-lg" style={{
                            backgroundColor: 'var(--color-error-light)',
                            color: 'var(--color-error)',
                        }}>
                            <p className="text-sm font-medium">
                                ⚠️ Endereço fora da área de entrega
                            </p>
                            <p className="text-xs mt-1">
                                Raio máximo: {restaurantConfig.deliveryRadius} km
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between text-sm">
                                <span style={{ color: 'var(--color-text-secondary)' }}>
                                    Taxa de entrega:
                                </span>
                                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                                    {formatPrice(deliveryFee)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span style={{ color: 'var(--color-text-secondary)' }}>
                                    Tempo estimado:
                                </span>
                                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                                    {estimatedTime}
                                </span>
                            </div>
                        </>
                    )}

                    <button
                        onClick={handleCalculate}
                        className="w-full text-sm text-[#00A082] hover:underline mt-2"
                    >
                        Recalcular
                    </button>
                </div>
            )}

            {!distance && !error && (
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    Clique no botão para calcular o frete baseado na sua localização
                </p>
            )}
        </div>
    )
}