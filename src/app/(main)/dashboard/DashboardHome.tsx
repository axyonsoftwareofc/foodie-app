'use client';

import { useMemo } from 'react';
import type { OrderStats } from '@/actions/orders';
import { Receipt, TrendingUp, Clock, Package, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { WhatsAppShare } from '@/components/dashboard/WhatsAppShare';
import { useDashboard } from './DashboardProvider';

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function DashboardHome({ stats }: { stats: OrderStats | null }) {
  const { profile: restaurant } = useDashboard();

  const cards = useMemo(
    () => [
      {
        label: 'Pedidos Hoje',
        value: stats?.totalToday ?? '--',
        sub: stats ? `${stats.pendingCount} pendentes • ${stats.preparingCount} preparando` : '',
        icon: Receipt,
        color: 'bg-blue-50 text-blue-600',
      },
      {
        label: 'Faturamento Hoje',
        value: stats ? formatCurrency(stats.revenueToday) : '--',
        sub: stats?.totalToday
          ? `Ticket medio: ${formatCurrency(stats.revenueToday / Math.max(stats.totalToday, 1))}`
          : '',
        icon: TrendingUp,
        color: 'bg-emerald-50 text-emerald-600',
      },
      {
        label: 'Tempo Medio Preparo',
        value: stats?.avgPreparationTime ? `${stats.avgPreparationTime} min` : '--',
        sub: stats ? 'Media dos pedidos de hoje' : '',
        icon: Clock,
        color: 'bg-amber-50 text-amber-600',
      },
      {
        label: 'Status',
        value:
          restaurant?.status === 'OPEN'
            ? '🟢 Aberto'
            : restaurant?.status === 'CLOSED'
              ? '🔴 Fechado'
              : '🟡 Ocupado',
        sub: restaurant ? `Plano Gratis` : '',
        icon: Package,
        color: 'bg-purple-50 text-purple-600',
      },
    ],
    [stats, restaurant]
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo{restaurant?.name ? `, ${restaurant.name.split(' ')[0]}` : ''}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Acompanhe o desempenho do seu restaurante</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{card.label}</span>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="mb-8">
        <RevenueChart stats={stats} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/dashboard/menu"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">
            🍽️
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Gerenciar Cardapio</h3>
            <p className="text-sm text-gray-500">Adicione ou edite produtos e categorias</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 transition-colors" />
        </Link>

        <Link
          href="/dashboard/cozinha"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-xl">
            👨‍🍳
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Modo Cozinha</h3>
            <p className="text-sm text-gray-500">Tela cheia para a cozinha acompanhar pedidos</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 transition-colors" />
        </Link>

        <Link
          href="/dashboard/pass"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-xl">
            📦
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Pass / Balcao</h3>
            <p className="text-sm text-gray-500">Organize pedidos prontos por tipo de entrega</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 transition-colors" />
        </Link>

        <Link
          href={restaurant?.slug ? `https://${restaurant.slug}.foodie.app` : '/criar-restaurante'}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl">
            🌐
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Ver Cardapio Publico</h3>
            <p className="text-sm text-gray-500">Veja como seus clientes veem seu restaurante</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 transition-colors" />
        </Link>
      </div>

      {/* WhatsApp Share */}
      {restaurant && (
        <div className="mb-8">
          <WhatsAppShare
            restaurantName={restaurant.name}
            menuUrl={`https://${restaurant.slug}.foodie.app`}
            phone={restaurant.contact?.phone}
          />
        </div>
      )}

      {/* Dica */}
      {(!stats || stats.totalToday === 0) && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-6 text-white">
          <h2 className="text-lg font-bold mb-2">Pronto para receber pedidos! 🎉</h2>
          <p className="text-emerald-100 mb-4 max-w-xl">
            Compartilhe o link do seu cardapio com seus clientes e comece a receber pedidos hoje
            mesmo.
          </p>
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 text-sm font-mono max-w-sm">
            {restaurant?.slug || 'restaurante'}.foodie.app
          </div>
        </div>
      )}
    </div>
  );
}
