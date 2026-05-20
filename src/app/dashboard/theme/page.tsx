'use client'

import { useState, useEffect } from 'react'
import { Palette, Save, Loader2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { getRestaurantProfile, updateRestaurantProfile } from '@/actions/restaurantActions'
import type { RestaurantProfile } from '@/types/restaurant-management.types'
import { DEFAULT_THEME, PRESET_THEMES, FONT_OPTIONS, type RestaurantTheme } from '@/lib/theme/resolver'

export default function ThemePage() {
    const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [theme, setTheme] = useState<Partial<RestaurantTheme>>({ ...DEFAULT_THEME })

    useEffect(() => {
        getRestaurantProfile().then((result) => {
            if (result.data) {
                setRestaurant(result.data)
                if (result.data.theme) {
                    try {
                        const stored = typeof result.data.theme === 'string'
                            ? JSON.parse(result.data.theme)
                            : result.data.theme
                        setTheme({ ...DEFAULT_THEME, ...stored })
                    } catch { /* usa default */ }
                }
            }
            setIsLoading(false)
        })
    }, [])

    const updateField = (field: keyof RestaurantTheme, value: string) => {
        setTheme((prev) => ({ ...prev, [field]: value }))
    }

    const applyPreset = (preset: (typeof PRESET_THEMES)[number]) => {
        setTheme({ ...DEFAULT_THEME, ...preset.theme })
    }

    const handleSave = async () => {
        if (!restaurant) return
        setIsSaving(true)

        try {
            const result = await updateRestaurantProfile({
                id: restaurant.id,
                theme: JSON.stringify(theme),
            } as Partial<RestaurantProfile>)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Tema salvo!')
            }
        } catch {
            toast.error('Erro ao salvar tema')
        }
        setIsSaving(false)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Aprencia do Cardapio</h1>
            <p className="text-gray-500 mb-8">Personalize as cores e fontes do seu cardapio publico</p>

            <div className="space-y-6">
                {/* Presets */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Temas prontos</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {PRESET_THEMES.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => applyPreset(preset)}
                                className="p-3 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors text-left"
                            >
                                <div className="flex gap-1 mb-2">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.theme.primaryColor || '#00A082' }} />
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.theme.textColor || '#111' }} />
                                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: preset.theme.cardBackgroundColor || '#FFF' }} />
                                </div>
                                <span className="text-xs text-gray-600">{preset.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Cores */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-emerald-600" />
                        Cores
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {(['primaryColor', 'primaryColorHover', 'backgroundColor', 'cardBackgroundColor', 'textColor', 'textSecondaryColor'] as (keyof RestaurantTheme)[]).map((field) => (
                            <div key={field}>
                                <label className="block text-xs text-gray-500 mb-1">
                                    {field === 'primaryColor' ? 'Cor Principal' :
                                     field === 'primaryColorHover' ? 'Cor Hover' :
                                     field === 'backgroundColor' ? 'Fundo' :
                                     field === 'cardBackgroundColor' ? 'Fundo Cards' :
                                     field === 'textColor' ? 'Texto' : 'Texto Secundario'}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={theme[field] || '#000000'}
                                        onChange={(e) => updateField(field, e.target.value)}
                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                    />
                                    <input
                                        type="text"
                                        value={theme[field] || ''}
                                        onChange={(e) => updateField(field, e.target.value)}
                                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Fontes */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Fontes</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Titulos</label>
                            <select
                                value={theme.fontHeading || 'Inter'}
                                onChange={(e) => updateField('fontHeading', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
                            >
                                {FONT_OPTIONS.map((f) => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Corpo</label>
                            <select
                                value={theme.fontBody || 'Inter'}
                                onChange={(e) => updateField('fontBody', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
                            >
                                {FONT_OPTIONS.map((f) => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Preview */}
                <section className="rounded-xl border-2 overflow-hidden" style={{ borderColor: theme.primaryColor || '#00A082' }}>
                    <div className="p-3 text-xs text-white font-medium" style={{ backgroundColor: theme.primaryColor || '#00A082' }}>
                        Preview do Cardapio
                    </div>
                    <div className="p-3 space-y-2" style={{ backgroundColor: theme.backgroundColor || '#F9FAFB' }}>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: theme.cardBackgroundColor || '#FFF', borderRadius: theme.borderRadius || '12px' }}>
                            <p className="font-bold text-sm" style={{ color: theme.textColor || '#111', fontFamily: theme.fontHeading || 'Inter' }}>
                                {restaurant?.name || 'Seu Restaurante'}
                            </p>
                            <p className="text-xs" style={{ color: theme.textSecondaryColor || '#6B7280', fontFamily: theme.fontBody || 'Inter' }}>
                                Aberto agora • 30-40 min • Frete R$ 5,00
                            </p>
                        </div>
                        <div className="p-3 rounded-lg" style={{ backgroundColor: theme.cardBackgroundColor || '#FFF', borderRadius: theme.borderRadius || '12px' }}>
                            <p className="font-semibold text-xs" style={{ color: theme.textColor || '#111', fontFamily: theme.fontHeading || 'Inter' }}>
                                Pizza Margherita
                            </p>
                            <div className="flex justify-between mt-1">
                                <span className="text-xs" style={{ color: theme.textSecondaryColor || '#6B7280' }}>Mussarela, tomate, manjericao</span>
                                <span className="font-bold text-xs" style={{ color: theme.primaryColor || '#00A082' }}>R$ 45,90</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setTheme({ ...DEFAULT_THEME })}
                        className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <Undo2 className="w-4 h-4" />
                        Restaurar padrao
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                        ) : (
                            <><Save className="w-4 h-4" /> Salvar Tema</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
