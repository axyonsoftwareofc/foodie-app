// src/app/dashboard/cozinha/cozinha-client.tsx
'use client';

import { useKitchenOrders, type Order } from '@/hooks/useKitchenOrders';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import { useTabTitle } from '@/hooks/useTabTitle';
import type { KitchenOrder } from '@/types/kitchen.types';
import { updateOrderStatus, cancelOrderByRestaurant } from '@/actions/orders';
import { getNextStatus } from '@/lib/utils/order-status.utils';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { OrderStatus } from '@prisma/client';
import Link from 'next/link';

const COLORS = {
  NEW: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  PREPARING: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  READY: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  DELIVERING: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  COMPLETED: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
  },
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500',
  CONFIRMED: 'bg-amber-600',
  PREPARING: 'bg-blue-500',
  READY: 'bg-emerald-500',
  DELIVERING: 'bg-purple-500',
  DELIVERED: 'bg-gray-400',
  CANCELLED: 'bg-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  DELIVERING: 'Entregando',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

export default function CozinhaClient({
  initialOrders,
  initialError,
}: {
  initialOrders?: Order[];
  initialError?: string;
}) {
  const { orders, refresh, loading } = useKitchenOrders(initialOrders);
  const { requestPermission, notifyNewOrder, isSupported } = useOrderNotifications();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | undefined>(initialError);

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length,
    [orders]
  );
  useTabTitle(pendingCount, 'Cozinha — Foodie');

  useEffect(() => {
    if (isSupported) requestPermission();
  }, [isSupported, requestPermission]);

  const grouped = useMemo(
    () => ({
      NEW: orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED'),
      PREPARING: orders.filter((o) => o.status === 'PREPARING'),
      READY: orders.filter((o) => o.status === 'READY'),
      DELIVERING: orders.filter((o) => o.status === 'DELIVERING'),
      COMPLETED: orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED'),
    }),
    [orders]
  );

  useEffect(() => {
    const newOrders = grouped.NEW.filter((o) => !dismissedIds.has(o.id));
    if (newOrders.length > 0) notifyNewOrder(newOrders[0]);
  }, [grouped.NEW, dismissedIds, notifyNewOrder]);

  const handleAction = useCallback(
    async (order: KitchenOrder, action: string) => {
      const statusMap: Record<string, string> = {
        CONFIRM: 'CONFIRMED',
        MARK_READY: 'READY',
        COMPLETE: 'DELIVERED',
        COMPLETE_DINE_IN: 'DELIVERED',
        COMPLETE_PICKUP: 'DELIVERED',
      };
      const targetStatus = statusMap[action] || getNextStatus(order.status as OrderStatus);
      if (!targetStatus) return;

      const result = await updateOrderStatus({
        orderId: order.id,
        newStatus: targetStatus as OrderStatus,
        restaurantId: order.restaurantId as string,
      });

      if (result.success) {
        notifyNewOrder({ ...order, status: targetStatus as KitchenOrder['status'] });
        refresh();
      } else {
        toast.error(result.error || 'Erro ao atualizar');
      }
    },
    [refresh, notifyNewOrder]
  );

  const handleCancel = useCallback(
    async (order: KitchenOrder) => {
      const reason = prompt('Motivo do cancelamento:');
      if (!reason) return;
      const result = await cancelOrderByRestaurant({
        orderId: order.id,
        restaurantId: order.restaurantId,
        reason,
      });
      if (result.success) {
        toast.success('Pedido cancelado');
        refresh();
      } else {
        toast.error(result.error || 'Erro ao cancelar');
      }
    },
    [refresh]
  );

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  }, []);

  const renderActions = (order: KitchenOrder) => {
    const status = order.status as OrderStatus;
    const next = getNextStatus(status);
    if (!next) return null;

    if (status === 'PENDING') {
      return (
        <button
          onClick={() => handleAction(order, 'CONFIRM')}
          className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
        >
          Confirmar
        </button>
      );
    }
    if (status === 'CONFIRMED') {
      return (
        <button
          onClick={() => handleAction(order, 'MARK_READY')}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
        >
          Iniciar Preparo
        </button>
      );
    }
    if (status === 'PREPARING') {
      return (
        <button
          onClick={() => handleAction(order, 'MARK_READY')}
          className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
        >
          Marcar Pronto
        </button>
      );
    }
    if (status === 'READY') {
      if (order.orderType === 'DINE_IN') {
        return (
          <button
            onClick={() => handleAction(order, 'COMPLETE_DINE_IN')}
            className="px-4 py-2 bg-gray-600 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
          >
            Entregue na Mesa
          </button>
        );
      }
      return (
        <button
          onClick={() => handleAction(order, 'COMPLETE')}
          className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
        >
          Iniciar Entrega
        </button>
      );
    }
    if (status === 'DELIVERING') {
      return (
        <button
          onClick={() => handleAction(order, 'COMPLETE')}
          className="px-4 py-2 bg-gray-600 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
        >
          Finalizar Entrega
        </button>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-20"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {fetchError && (
        <div
          className="m-4 p-3 rounded-lg border flex items-center justify-between"
          style={{
            borderColor: 'var(--color-error)',
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-error)',
          }}
        >
          <span className="text-sm font-medium">{fetchError}</span>
          <button
            onClick={() => {
              setFetchError(undefined);
              refresh();
            }}
            className="text-xs px-3 py-1 rounded-md border"
            style={{ borderColor: 'var(--color-error)' }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      <div
        className="flex items-center gap-4 p-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <Link href="/dashboard" className="p-1 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
        </Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Cozinha
        </h1>
        <span className="ml-auto text-sm font-medium px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
          {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(COLORS).map(([key, colors]) => {
          const columnOrders = grouped[key as keyof typeof grouped];
          return (
            <div
              key={key}
              className={`rounded-2xl ${colors.bg} border ${colors.border} p-3 min-h-[200px]`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <h3 className={`text-sm font-semibold ${colors.text}`}>
                  {key === 'NEW' && `🔔 Novos (${columnOrders.length})`}
                  {key === 'PREPARING' && `👨‍🍳 Preparando (${columnOrders.length})`}
                  {key === 'READY' && `📦 Prontos (${columnOrders.length})`}
                  {key === 'DELIVERING' && `🛵 Entregando (${columnOrders.length})`}
                  {key === 'COMPLETED' && `✅ Finalizados (${columnOrders.length})`}
                </h3>
              </div>
              <div className="space-y-2">
                {columnOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-400">#{order.id.slice(-4)}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${order.orderType === 'DINE_IN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                      >
                        {order.orderType === 'DINE_IN'
                          ? `🍽️ Mesa ${order.tableNumber || ''}`
                          : order.orderType === 'PICKUP'
                            ? '📦 Retirada'
                            : '🛵 Delivery'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>
                            {item.quantity}x {item.menuItemName}
                          </span>
                        </div>
                      ))}
                      {order.items && order.items.length > 3 && (
                        <span className="text-gray-400">+{order.items.length - 3} itens</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <span className="text-sm font-bold text-emerald-600">
                        R$ {order.total.toFixed(2).replace('.', ',')}
                      </span>
                      <div className="flex gap-1">{renderActions(order)}</div>
                    </div>
                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                      <button
                        onClick={() => {
                          handleDismiss(order.id);
                          handleCancel(order);
                        }}
                        className="w-full py-1 text-xs text-red-500 hover:text-red-700 mt-1"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
