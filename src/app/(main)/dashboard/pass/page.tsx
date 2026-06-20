// src/app/dashboard/pass/page.tsx — PASS / BALCÃO EXPEDIDOR
'use client';

import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import { updateOrderStatus } from '@/actions/orders';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Truck, UtensilsCrossed, ShoppingBag, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import type { OrderStatus } from '@prisma/client';
import Link from 'next/link';
import { AssignDriverModal } from '@/components/kitchen/AssignDriverModal';

function formatWait(minutes: number): string {
  if (minutes < 1) return 'agora';
  if (minutes === 1) return '1 min';
  return `${minutes} min`;
}

function getWaitColor(minutes: number): string {
  if (minutes < 5) return 'text-emerald-500 bg-emerald-50';
  if (minutes < 10) return 'text-amber-500 bg-amber-50';
  return 'text-red-500 bg-red-50 animate-pulse';
}

const ORDER_TYPE_CONFIG = {
  DELIVERY: {
    icon: Truck,
    label: 'Delivery',
    color: 'bg-blue-50 border-blue-300',
    headerBg: 'bg-blue-600',
    actionLabel: 'Despachar',
    actionIcon: '🛵',
    actionClass: 'bg-blue-600 hover:bg-blue-700',
    completeStatus: 'DELIVERED',
  },
  DINE_IN: {
    icon: UtensilsCrossed,
    label: 'Mesa',
    color: 'bg-purple-50 border-purple-300',
    headerBg: 'bg-purple-600',
    actionLabel: 'Servido',
    actionIcon: '🍽️',
    actionClass: 'bg-purple-600 hover:bg-purple-700',
    completeStatus: 'DELIVERED',
  },
  PICKUP: {
    icon: ShoppingBag,
    label: 'Retirada',
    color: 'bg-orange-50 border-orange-300',
    headerBg: 'bg-orange-600',
    actionLabel: 'Retirado',
    actionIcon: '🤝',
    actionClass: 'bg-orange-600 hover:bg-orange-700',
    completeStatus: 'DELIVERED',
  },
} as const;

type OrderType = keyof typeof ORDER_TYPE_CONFIG;

export default function PassPage() {
  const { orders, refresh, loading } = useKitchenOrders();
  const [assignOrderId, setAssignOrderId] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [, setTick] = useState(0);

  // Relógio centralizado — 1 timer para todos
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const readyOrders = useMemo(() => orders.filter((o) => o.status === 'READY'), [orders]);

  const grouped = useMemo(() => {
    const groups: Record<OrderType, typeof readyOrders> = {
      DELIVERY: [],
      DINE_IN: [],
      PICKUP: [],
    };
    readyOrders.forEach((o) => {
      const type = (o.orderType as OrderType) || 'DELIVERY';
      if (groups[type]) groups[type].push(o);
    });
    return groups;
  }, [readyOrders]);

  const waitingMinutes = useCallback((readyAt: string | null) => {
    if (!readyAt) return 0;
    return Math.floor((Date.now() - new Date(readyAt).getTime()) / 60000);
  }, []);

  const handleComplete = useCallback(
    async (orderId: string, restaurantId: string, type: OrderType) => {
      const config = ORDER_TYPE_CONFIG[type];
      const result = await updateOrderStatus({
        orderId,
        newStatus: config.completeStatus as OrderStatus,
        restaurantId,
      });
      if (result.success) {
        toast.success(`${config.label} finalizado!`);
        refresh();
      } else {
        toast.error(result.error || 'Erro');
      }
    },
    [refresh]
  );

  const handleAssignDriver = useCallback((orderId: string) => {
    setAssignOrderId(orderId);
    setIsAssignModalOpen(true);
  }, []);

  const readyCount = readyOrders.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900 text-white px-4 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders" className="p-1 -ml-1">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="font-bold text-xl">Pass / Balcao</h1>
            <p className="text-xs text-gray-400">
              {readyCount} pedido{readyCount !== 1 ? 's' : ''} pronto{readyCount !== 1 ? 's' : ''}{' '}
              aguardando
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
        >
          Atualizar
        </button>
      </header>

      {readyCount === 0 ? (
        <div className="flex items-center justify-center h-[calc(100vh-73px)]">
          <div className="text-center">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Tudo em ordem! 🎉</h2>
            <p className="text-gray-500">Nenhum pedido aguardando no balcao</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-[calc(100vh-73px)]">
          {(
            Object.entries(ORDER_TYPE_CONFIG) as [
              OrderType,
              (typeof ORDER_TYPE_CONFIG)[OrderType],
            ][]
          ).map(([type, config]) => {
            const Icon = config.icon;
            const ordersOfType = grouped[type];

            return (
              <div
                key={type}
                className={`rounded-2xl border-2 ${config.color} flex flex-col overflow-hidden`}
              >
                {/* Column Header */}
                <div
                  className={`${config.headerBg} text-white px-4 py-3 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <h2 className="font-bold">{config.label}</h2>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                    {ordersOfType.length}
                  </span>
                </div>

                {/* Orders */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {ordersOfType.map((order) => {
                    const items = (order as unknown as Record<string, unknown>).items;
                    const itemList = Array.isArray(items)
                      ? (items as Array<{
                          menuItemName?: string;
                          name?: string;
                          quantity?: number;
                        }>)
                      : [];
                    const tableNumber = (order as unknown as Record<string, unknown>)
                      .tableNumber as string;
                    const readyAt = (order as unknown as Record<string, unknown>).readyAt as
                      | string
                      | null;
                    const wait = waitingMinutes(readyAt);

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 shadow-sm"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-gray-400">
                            #{order.id.slice(-4)}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${getWaitColor(wait)}`}
                          >
                            <Clock className="w-3 h-3" />
                            {formatWait(wait)}
                          </span>
                        </div>

                        {/* Customer */}
                        <div>
                          <p className="font-semibold text-gray-900">{order.customerName}</p>
                          {type === 'DINE_IN' && tableNumber && (
                            <p className="text-sm text-purple-600 font-medium">
                              Mesa {tableNumber}
                            </p>
                          )}
                        </div>

                        {/* Items */}
                        <div className="flex flex-wrap gap-1">
                          {itemList.slice(0, 4).map((item, i) => (
                            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-lg">
                              {item.quantity || 1}x {item.menuItemName || item.name || 'Item'}
                            </span>
                          ))}
                          {itemList.length > 4 && (
                            <span className="text-xs text-gray-400 self-end">
                              +{itemList.length - 4}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {type === 'DELIVERY' && (
                            <button
                              onClick={() => handleAssignDriver(order.id)}
                              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
                            >
                              🛵 Atribuir Entregador
                            </button>
                          )}
                          <button
                            onClick={() => handleComplete(order.id, order.restaurantId, type)}
                            className={`flex-1 py-3 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform ${config.actionClass}`}
                          >
                            {config.actionIcon} {config.actionLabel}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {ordersOfType.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Icon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum pedido {config.label.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AssignDriverModal
        orderId={assignOrderId || ''}
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssignOrderId(null);
        }}
        onAssigned={refresh}
      />
    </div>
  );
}
