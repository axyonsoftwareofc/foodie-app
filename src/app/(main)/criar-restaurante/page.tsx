import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Store,
  Smartphone,
  CreditCard,
  Palette,
  TrendingUp,
  Bell,
  ChevronRight,
  Star,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Crie seu delivery online em 3 minutos — Foodie',
  description:
    'Cardapio digital, pedidos organizados, Pix e cartao. Monte sua loja online gratis e comece a vender hoje.',
  openGraph: {
    title: 'Foodie — Delivery online para restaurantes',
    description:
      'Cardapio digital, pedidos organizados, Pix e cartao. Monte sua loja online gratis.',
    type: 'website',
  },
};

const FEATURES = [
  {
    icon: Smartphone,
    title: 'Cardapio online',
    desc: 'Monte seu cardapio com categorias, fotos e precos em minutos. Acessivel em qualquer dispositivo.',
  },
  {
    icon: Bell,
    title: 'Pedidos organizados',
    desc: 'Receba pedidos em tempo real no painel da cozinha. Nunca mais perca um pedido no WhatsApp.',
  },
  {
    icon: CreditCard,
    title: 'Pix e Cartao',
    desc: 'Aceite pagamentos via Pix (sem taxa额外) e cartao de credito/debito via Stripe.',
  },
  {
    icon: TrendingUp,
    title: 'Relatorios de vendas',
    desc: 'Acompanhe faturamento, ticket medio e produtos mais vendidos. Tome decisoes com dados.',
  },
  {
    icon: Palette,
    title: 'Tema personalizado',
    desc: 'Cores, fontes e logo do seu restaurante. Seu cardapio com a sua cara.',
  },
  {
    icon: Store,
    title: 'Dominio proprio',
    desc: 'Use seu proprio dominio (pizzariadoze.com.br) ou um subdominio gratuito no Foodie.',
  },
];

export default function CriarRestaurantePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-6 backdrop-blur">
            Para donos de restaurante
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Seu delivery online
            <br />
            <span className="text-emerald-200">em 3 minutos</span>
          </h1>
          <p className="text-lg text-emerald-100 mb-8 max-w-xl mx-auto">
            Cardapio digital, pedidos organizados, gestao de entregas e pagamentos via Pix. Tudo que
            seu restaurante precisa para vender online, sem complicacao.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-700 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors shadow-lg"
            >
              Criar meu restaurante gratis
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/planos"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors backdrop-blur"
            >
              Ver planos
            </Link>
          </div>
          <p className="text-sm text-emerald-200/70 mt-6">
            Sem taxa por pedido. Comece gratis, escale quando quiser.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Tudo que voce precisa</h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Do cardapio a entrega, todas as ferramentas para seu restaurante vender mais.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <blockquote className="text-xl text-gray-700 italic mb-4">
            &ldquo;Aumentei minhas vendas em 40% na primeira semana. Meus clientes adoraram a
            facilidade de fazer pedido pelo cardapio online.&rdquo;
          </blockquote>
          <p className="font-semibold text-gray-900">Pizzaria do Ze</p>
          <p className="text-sm text-gray-500">Sao Paulo, SP</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Pronto para vender online?</h2>
        <p className="text-gray-500 mb-8">Crie sua loja agora mesmo. Zero custo para começar.</p>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 px-10 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg"
        >
          Criar meu restaurante gratis
          <ChevronRight className="w-5 h-5" />
        </Link>
        <p className="text-sm text-gray-400 mt-6">
          Ja tem uma loja?{' '}
          <Link href="/dashboard" className="text-emerald-600 hover:underline font-medium">
            Acesse seu restaurante
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-sm text-gray-400">
          Foodie App — Plataforma de delivery para restaurantes
        </p>
      </footer>
    </div>
  );
}
