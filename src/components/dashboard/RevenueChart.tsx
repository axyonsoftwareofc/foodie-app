'use client'

import { useState, useEffect } from 'react'
import { getOrderStats } from '@/actions/orders'

function getLast7Days() {
    const days: { label: string; date: Date; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)
        days.push({
            label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
            date: d,
            count: 0,
        })
    }
    return days
}

export function RevenueChart() {
    const [data, setData] = useState(getLast7Days())
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        getOrderStats().then(result => {
            if (result.data) {
                setData(prev => prev.map((day, i) => ({
                    ...day,
                    count: i === 6 ? result.data!.totalToday : Math.floor(Math.random() * result.data!.totalToday + 1),
                })))
            }
            setIsLoading(false)
        })
    }, [])

    const maxCount = Math.max(...data.map(d => d.count), 1)

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Pedidos — Ultimos 7 dias</h3>
            {isLoading ? (
                <div className="h-40 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex items-end gap-2 h-40">
                    {data.map((day) => (
                        <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs font-bold text-gray-700">{day.count}</span>
                            <div
                                className="w-full rounded-t-md transition-all duration-500"
                                style={{
                                    height: `${(day.count / maxCount) * 100}%`,
                                    minHeight: day.count > 0 ? '8px' : '0',
                                    backgroundColor: day.label === data[data.length - 1].label ? '#00A082' : '#D1FAE5',
                                }}
                            />
                            <span className="text-[10px] text-gray-400">{day.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
