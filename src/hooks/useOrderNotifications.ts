// src/hooks/useOrderNotifications.ts
'use client';

import { useEffect, useCallback, useRef } from 'react';
import type { KitchenOrder } from '@/types/kitchen.types';

export function useOrderNotifications() {
  const permissionRef = useRef<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      permissionRef.current = permission;
      return permission === 'granted';
    }
    return permissionRef.current === 'granted';
  }, []);

  const notifyNewOrder = useCallback((order: KitchenOrder) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const orderNumber = String(order.id).slice(-4).toUpperCase();
      const title = `🔔 Novo Pedido #${orderNumber}`;

      let body = '';
      if (order.orderType === 'DINE_IN') {
        body = `Mesa ${order.tableNumber} - ${order.customerName}`;
      } else if (order.orderType === 'DELIVERY') {
        body = `Delivery - ${order.customerName}`;
      } else {
        body = `Retirada - ${order.customerName}`;
      }

      const itemsCount = order.items?.length || 0;
      if (itemsCount > 0) {
        body += `\n${itemsCount} ${itemsCount === 1 ? 'item' : 'itens'}`;
      }

      body += `\nTotal: R$ ${order.total.toFixed(2).replace('.', ',')}`;

      const notification = new Notification(title, {
        body,
        icon: '/android-chrome-192x192.png',
        badge: '/android-chrome-192x192.png',
        tag: `order-${order.id}`,
        requireInteraction: true,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Opcional: navegar para o pedido específico
      };

      // Auto-close após 10 segundos
      setTimeout(() => notification.close(), 10000);
    }
  }, []);

  const notifyStatusChange = useCallback((order: KitchenOrder, newStatus: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const orderNumber = String(order.id).slice(-4).toUpperCase();

      const statusMessages: Record<string, string> = {
        CONFIRMED: '✅ Pedido confirmado',
        PREPARING: '👨‍🍳 Em preparo',
        READY: '📦 Pronto para retirada/entrega',
        DELIVERING: '🛵 Saiu para entrega',
        DELIVERED: '🎉 Pedido entregue',
        CANCELLED: '❌ Pedido cancelado',
      };

      const title = statusMessages[newStatus] || `Status atualizado: ${newStatus}`;

      const notification = new Notification(`Pedido #${orderNumber}`, {
        body: title,
        icon: '/android-chrome-192x192.png',
        tag: `order-${order.id}-status`,
      });

      setTimeout(() => notification.close(), 5000);
    }
  }, []);

  return {
    requestPermission,
    notifyNewOrder,
    notifyStatusChange,
    isSupported: 'Notification' in window,
    permission: permissionRef.current,
  };
}
