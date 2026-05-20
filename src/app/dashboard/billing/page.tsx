'use client'

import { useState } from 'react'
import { Check, CreditCard, Star, Zap } from 'lucide-react'
import { toast } from 'sonner'

const PLANS = [
    {
        name: 'Gratis',
        price: 'R$ 0',
        period: 'para sempre',
        icon: Zap,
        color: 'bg-gray-100 text-gray-600',
        features: [
            'Subdominio foodie.app',
            'Tema basico (1 cor)',
            'Ate 50 pedidos/mes',
            'Cardapio com categorias e produtos',
            'Dashboard basico',
            'Suporte por email',
        ],
        notIncluded: [
            'Dominio proprio',
            'Temas premium',
            'Pedidos ilimitados',
            'Relatorios avancados',
            'API de integracao',
        ],
        current: true,
    },
    {
        name: 'Pro',
        price: 'R$ 97',
        period: '/mes',
        icon: Star,
        color: 'bg-emerald-100 text-emerald-600',
        popular: true,
        features: [
            'Tudo do Gratis',
            'Dominio proprio',
            'Temas premium ilimitados',
            'Pedidos ilimitados',
            'Relatorios de vendas',
            'Suporte prioritario',
            'Remocao marca Foodie',
        ],
        notIncluded: [
            'API de integracao',
        ],
    },
    {
        name: 'Enterprise',
        price: 'R$ 297',
        period: '/mes',
        icon: CreditCard,
        color: 'bg-purple-100 text-purple-600',
        features: [
            'Tudo do Pro',
            'API de integracao',
            'Multiplos usuarios (equipe)',
            'Relatorios personalizados',
            'White-label completo',
            'Gerente de conta dedicado',
            'SLA 99.9%',
        ],
        notIncluded: [],
    },
]

export default function BillingPage() {
    const [selectedPlan] = useState('Gratis')

    const handleUpgrade = (plan: string) => {
        toast.info(`Upgrade para ${plan} em breve! Pagamento via Stripe sera integrado.`)
    }

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Planos e Assinatura</h1>
            <p className="text-gray-500 mb-8">Escolha o plano ideal para o seu restaurante</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => {
                    const Icon = plan.icon
                    const isCurrent = plan.name === selectedPlan

                    return (
                        <div
                            key={plan.name}
                            className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
                                plan.popular ? 'border-emerald-500' : 'border-gray-200'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                                    MAIS POPULAR
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${plan.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                                </div>
                            </div>

                            <div className="mb-6">
                                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                                <span className="text-gray-400 text-sm"> {plan.period}</span>
                            </div>

                            <div className="space-y-3 flex-1 mb-6">
                                {plan.features.map((f) => (
                                    <div key={f} className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-sm text-gray-700">{f}</span>
                                    </div>
                                ))}
                                {plan.notIncluded.map((f) => (
                                    <div key={f} className="flex items-start gap-2 opacity-40">
                                        <Check className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                                        <span className="text-sm text-gray-400 line-through">{f}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handleUpgrade(plan.name)}
                                disabled={isCurrent}
                                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                                    isCurrent
                                        ? 'bg-gray-100 text-gray-400 cursor-default'
                                        : plan.popular
                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {isCurrent ? 'Plano Atual' : `Assinar ${plan.name}`}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
