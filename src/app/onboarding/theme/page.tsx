'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Palette, ChevronLeft, Loader2, Store } from 'lucide-react'
import { toast } from 'sonner'
import { tenantStep3Schema, type TenantStep3Data } from '@/lib/validations/tenant.validations'
import type { TenantStep1Data, TenantStep2Data } from '@/lib/validations/tenant.validations'

const PRESET_COLORS = [
    '#00A082', '#2563EB', '#DC2626', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#1A1A1A',
]

function getStep3Data(): TenantStep3Data {
    try {
        const raw = sessionStorage.getItem('onboarding_step3')
        return raw ? JSON.parse(raw) : { primaryColor: '#00A082' }
    } catch {
        return { primaryColor: '#00A082' }
    }
}

export default function OnboardingStep3() {
    const router = useRouter()
    const [form, setForm] = useState<TenantStep3Data>(getStep3Data)
    const [isCreating, setIsCreating] = useState(false)

    const step1: TenantStep1Data | null = (() => {
        try {
            const raw = sessionStorage.getItem('onboarding_step1')
            return raw ? JSON.parse(raw) : null
        } catch { return null }
    })()

    const step2: TenantStep2Data | null = (() => {
        try {
            const raw = sessionStorage.getItem('onboarding_step2')
            return raw ? JSON.parse(raw) : null
        } catch { return null }
    })()

    const handleCreate = async () => {
        if (!step1 || !step2) {
            toast.error('Dados incompletos. Volte e preencha todos os passos.')
            return
        }

        const result = tenantStep3Schema.safeParse(form)
        if (!result.success) {
            toast.error('Escolha uma cor valida')
            return
        }

        setIsCreating(true)

        try {
            const { createTenant } = await import('@/actions/tenant-actions')
            const tenantResult = await createTenant({
                name: step1.name,
                category: step1.category,
                cnpj: step1.cnpj,
                phone: step1.phone,
                email: step1.email,
                description: step1.description,
                subdomain: step2.subdomain,
                cep: step2.cep,
                street: step2.street,
                number: step2.number,
                complement: step2.complement,
                neighborhood: step2.neighborhood,
                city: step2.city,
                state: step2.state,
                deliveryRadius: step2.deliveryRadius,
                logo: form.logo,
                coverImage: form.coverImage,
                primaryColor: form.primaryColor,
            })

            if (tenantResult.error) {
                toast.error(tenantResult.error)
                setIsCreating(false)
                return
            }

            sessionStorage.removeItem('onboarding_step1')
            sessionStorage.removeItem('onboarding_step2')
            sessionStorage.removeItem('onboarding_step3')

            toast.success('Restaurante criado! 🎉')
            router.push('/dashboard')
        } catch {
            toast.error('Erro ao criar restaurante')
            setIsCreating(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Aparencia</h1>
                <p className="text-gray-500 mt-1">Deixe seu restaurante com a sua cara</p>
            </div>

            <div className="space-y-6">
                {/* Logo */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-medium text-gray-700 mb-3">Logo</h3>
                    <p className="text-sm text-gray-400 mb-3">URL da imagem (recomendado: PNG quadrado, max 2MB)</p>
                    <input
                        type="text"
                        value={form.logo || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, logo: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                    {form.logo && (
                        <div className="mt-3 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                            <img src={form.logo} alt="Preview logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                    )}
                </div>

                {/* Cover */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-medium text-gray-700 mb-3">Imagem de capa</h3>
                    <p className="text-sm text-gray-400 mb-3">URL da imagem (recomendado: 1200x400px)</p>
                    <input
                        type="text"
                        value={form.coverImage || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, coverImage: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                    {form.coverImage && (
                        <div className="mt-3 w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                            <img src={form.coverImage} alt="Preview capa" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        </div>
                    )}
                </div>

                {/* Cor Primaria */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-emerald-600" />
                        Cor principal
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => setForm((prev) => ({ ...prev, primaryColor: color }))}
                                className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                                style={{
                                    backgroundColor: color,
                                    borderColor: form.primaryColor === color ? '#1A1A1A' : 'transparent',
                                }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={form.primaryColor}
                            onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                            placeholder="#00A082"
                            maxLength={7}
                            className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 font-mono"
                        />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: form.primaryColor }} />
                    </div>
                </div>

                {/* Preview Card */}
                {step1 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Store className="w-4 h-4" />
                            Preview do cardapio
                        </h3>
                        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e5e7eb' }}>
                            <div className="h-20 flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: form.primaryColor }}>
                                {step1.name || 'Seu Restaurante'}
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-500">{step1.category || 'Categoria'}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {step2 ? `${step2.street}, ${step2.number} - ${step2.city}/${step2.state}` : 'Seu endereco'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Voltar
                </button>

                <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Criando...
                        </>
                    ) : (
                        'Criar meu restaurante 🎉'
                    )}
                </button>
            </div>
        </div>
    )
}
