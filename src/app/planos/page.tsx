import Link from 'next/link'
import { Check, Zap, Star, Building2, ChevronRight } from 'lucide-react'

const PLANS = [
    {
        name: 'Gratis',
        price: '0',
        icon: Zap,
        color: 'border-gray-200',
        badge: null,
        cta: 'Comecar gratis',
        ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
        features: [
            'Subdominio foodie.app',
            'Cardapio com ate 30 produtos',
            'Pedidos ilimitados',
            'Pagamento via Pix',
            'Tema basico (1 cor)',
            'Suporte por email',
        ],
    },
    {
        name: 'Pro',
        price: '97',
        icon: Star,
        color: 'border-emerald-500 ring-2 ring-emerald-500',
        badge: 'Mais popular',
        cta: 'Assinar Pro',
        ctaStyle: 'bg-emerald-600 text-white hover:bg-emerald-700',
        features: [
            'Tudo do Gratis',
            'Dominio proprio',
            'Produtos ilimitados',
            'Temas premium',
            'Cartao de credito/debito',
            'Relatorios de vendas',
            'Remocao marca Foodie',
            'Suporte prioritario',
        ],
    },
    {
        name: 'Enterprise',
        price: '297',
        icon: Building2,
        color: 'border-gray-200',
        badge: null,
        cta: 'Falar com vendas',
        ctaStyle: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        features: [
            'Tudo do Pro',
            'API de integracao',
            'Multiplos usuarios',
            'White-label completo',
            'Relatorios personalizados',
            'Gerente de conta',
            'SLA 99.9%',
            'Treinamento da equipe',
        ],
    },
]

const FAQ = [
    { q: 'Preciso pagar alguma coisa pra começar?', a: 'Nao. O plano Gratis e realmente gratis, sem taxa por pedido. Voce so paga quando fizer upgrade para o Pro ou Enterprise.' },
    { q: 'Quanto tempo leva pra montar o cardapio?', a: 'Em media 5 minutos. Nosso onboarding guiado em 3 passos te ajuda a cadastrar nome, endereco e aparencia do restaurante.' },
    { q: 'Meus clientes conseguem pagar com Pix?', a: 'Sim! O Pix ja vem ativado em todos os planos, sem custo adicional. Cartao de credito/debito disponivel no plano Pro.' },
    { q: 'Posso usar meu proprio dominio?', a: 'Sim, nos planos Pro e Enterprise. Basta configurar um registro CNAME no seu provedor de dominio.' },
    { q: 'Como recebo os pedidos?', a: 'Pelo painel da cozinha em tempo real, com notificacao sonora. Tambem pode ativar notificacoes por email.' },
    { q: 'Tem contrato de fidelidade?', a: 'Nao. Voce pode cancelar a qualquer momento, sem multa.' },
]

export default function PlanosPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <section className="bg-gray-50 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <span className="text-emerald-600 font-semibold text-sm">Planos</span>
                    <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-3">
                        Escolha o plano ideal
                    </h1>
                    <p className="text-gray-500 max-w-lg mx-auto">
                        Comece gratis e faca upgrade quando seu restaurante crescer.
                        Sem taxa por pedido, sem surpresas.
                    </p>
                </div>
            </section>

            {/* Plans Grid */}
            <section className="max-w-5xl mx-auto px-4 py-12">
                <div className="grid md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon
                        return (
                            <div key={plan.name} className={`relative bg-white rounded-2xl border p-6 flex flex-col ${plan.color}`}>
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900">{plan.name}</h3>
                                </div>

                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-gray-900">R$ {plan.price}</span>
                                    <span className="text-gray-400">/mes</span>
                                </div>

                                <ul className="space-y-3 flex-1 mb-6">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-700">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                {plan.name === 'Enterprise' ? (
                                    <Link
                                        href="mailto:contato@foodie.app"
                                        className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${plan.ctaStyle}`}
                                    >
                                        {plan.cta}
                                    </Link>
                                ) : (
                                    <Link
                                        href="/onboarding"
                                        className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors ${plan.ctaStyle}`}
                                    >
                                        {plan.cta}
                                    </Link>
                                )}
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* FAQ */}
            <section className="max-w-3xl mx-auto px-4 py-16">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                    Duvidas frequentes
                </h2>
                <div className="space-y-4">
                    {FAQ.map((item) => (
                        <details key={item.q} className="group border border-gray-200 rounded-xl">
                            <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-gray-900">
                                {item.q}
                                <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                            </summary>
                            <p className="px-4 pb-4 text-sm text-gray-500">{item.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="bg-emerald-600 py-16 text-center text-white">
                <div className="max-w-2xl mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-3">Comece agora, gratis</h2>
                    <p className="text-emerald-100 mb-8">Monte seu cardapio online em menos de 5 minutos.</p>
                    <Link
                        href="/onboarding"
                        className="inline-flex items-center gap-2 px-10 py-4 bg-white text-emerald-700 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors"
                    >
                        Criar meu restaurante gratis
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-100 py-8 text-center">
                <Link href="/criar-restaurante" className="text-sm text-gray-400 hover:text-gray-600">
                    Foodie App
                </Link>
            </footer>
        </div>
    )
}
