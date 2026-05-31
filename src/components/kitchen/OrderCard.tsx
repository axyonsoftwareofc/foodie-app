// src/components/kitchen/OrderCard.tsx
'use client';

import { Order } from '@/hooks/useKitchenOrders';
import { OrderTimer } from './OrderTimer';
import { Printer, XCircle, Eye } from 'lucide-react';

interface OrderItem {
  name?: string;
  productName?: string;
  menuItemName?: string;
  quantity?: number;
  price?: number;
  observation?: string;
  addons?: Array<{ name: string }>;
}

export interface OrderCardProps {
  order: Order;
  onAction: (action: string, orderId: string) => void;
  onClick?: () => void;
}

export function OrderCard({ order, onAction, onClick }: OrderCardProps) {
  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return `Mesa ${order.tableNumber || ''}`;
      case 'DELIVERY':
        return 'Delivery';
      case 'PICKUP':
        return 'Retirada';
      default:
        return type;
    }
  };

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return 'bg-purple-100 text-purple-700';
      case 'DELIVERY':
        return 'bg-blue-100 text-blue-700';
      case 'PICKUP':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getItemsSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return 'Sem itens';
    if (items.length === 1)
      return items[0].name || items[0].productName || items[0].menuItemName || '1 item';
    const firstItem = items[0].name || items[0].productName || items[0].menuItemName || 'item';
    const remaining = items.length - 1;
    return remaining > 0 ? `${firstItem} +${remaining}` : firstItem;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
      CONFIRMED: { label: 'Confirmado', color: 'bg-green-100 text-green-700' },
      PREPARING: { label: 'Preparando', color: 'bg-blue-100 text-blue-700' },
      READY: { label: 'Pronto', color: 'bg-emerald-100 text-emerald-700' },
      DELIVERED: { label: 'Entregue', color: 'bg-gray-100 text-gray-700' },
      CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
    };
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const statusBadge = getStatusBadge(order.status);

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">
              #{String(order.id).slice(-4).toUpperCase()}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600 truncate max-w-[120px]">
              {order.customerName}
            </span>
          </div>
          <OrderTimer startTime={order.createdAt} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${getOrderTypeColor(order.orderType)}`}
            >
              {getOrderTypeLabel(order.orderType)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
          <span className="text-sm font-semibold text-gray-700">{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Items Summary */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-600 line-clamp-2">{getItemsSummary(order.items)}</p>
        {order.items && order.items.length > 0 && order.items[0]?.observation && (
          <p className="text-xs text-gray-400 mt-1 truncate">Obs: {order.items[0].observation}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex gap-2">
          {/* Botão principal baseado no status */}
          {order.status === 'PENDING' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction('CONFIRM', order.id);
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              Confirmar
            </button>
          )}
          {order.status === 'CONFIRMED' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction('START_PREPARING', order.id);
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Iniciar Preparo
            </button>
          )}
          {order.status === 'PREPARING' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction('MARK_READY', order.id);
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Marcar Pronto
            </button>
          )}
          {order.status === 'READY' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction('COMPLETE', order.id);
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {order.orderType === 'DELIVERY' ? 'Confirmar Entrega' : 'Finalizar'}
            </button>
          )}

          {/* Botões secundários */}
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction('VIEW_DETAILS', order.id);
              }}
              className="px-2 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Ver detalhes"
            >
              <Eye className="w-4 h-4" />
            </button>

            {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('CANCEL', order.id);
                }}
                className="px-2 py-2 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                title="Cancelar pedido"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction('PRINT', order.id);
              }}
              className="px-2 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Imprimir"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
