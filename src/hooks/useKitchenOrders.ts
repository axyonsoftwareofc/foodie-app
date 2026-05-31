// src/hooks/useKitchenOrders.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getOrdersForRestaurant } from '@/actions/orders';
import type { KitchenOrder } from '@/types/kitchen.types';
import type { OrderType } from '@/types';
import { toast } from 'sonner';
import { playOrderAlert } from '@/lib/audio';

export type { KitchenOrder as Order };

export interface KitchenFilters {
  status?: string;
  orderType?: OrderType | 'ALL';
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useKitchenOrders() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<KitchenFilters>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const derivedRestaurantIdRef = useRef<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const result = await getOrdersForRestaurant({
      filters: {
        status: filters.status !== 'ALL' ? filters.status : undefined,
        orderType: filters.orderType !== 'ALL' ? filters.orderType : undefined,
        search: filters.searchQuery,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      },
    });

    if (result.data) {
      const newOrders = result.data;
      const currentIds = new Set(newOrders.map((o) => o.id));
      const previousIds = previousOrderIdsRef.current;

      for (const order of newOrders) {
        if (!previousIds.has(order.id) && order.status === 'PENDING') {
          playOrderAlert();
          toast.success(`🔔 Novo pedido #${order.id.slice(-4)}!`, {
            description:
              order.orderType === 'DINE_IN' ? `Mesa ${order.tableNumber}` : order.orderType,
            duration: 5000,
          });
        }
      }

      previousOrderIdsRef.current = currentIds;
      setOrders(newOrders);
      setLastUpdate(new Date());

      if (!derivedRestaurantIdRef.current && newOrders.length > 0) {
        derivedRestaurantIdRef.current = newOrders[0].restaurantId;
      }
    }

    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const rid = derivedRestaurantIdRef.current;
    if (!rid) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`kitchen-orders-${rid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${rid}`,
        },
        (payload) => {
          const eventOrder = payload.new as Record<string, unknown>;
          if (payload.eventType === 'INSERT' && eventOrder.status === 'PENDING') {
            if (!previousOrderIdsRef.current.has(eventOrder.id as string)) {
              previousOrderIdsRef.current.add(eventOrder.id as string);
              playOrderAlert();
              toast.success(`🔔 Novo pedido #${(eventOrder.id as string).slice(-4)}!`, {
                duration: 5000,
              });
            }
          }

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const payloadTime = eventOrder.updated_at
              ? new Date(eventOrder.updated_at as string).getTime()
              : Date.now();

            setOrders((prev) => {
              const existing = prev.find((o) => o.id === eventOrder.id);
              if (existing?.updatedAt) {
                const existingTime = new Date(existing.updatedAt).getTime();
                if (payloadTime <= existingTime) return prev;
              }
              return prev;
            });

            setOrders((prev) => {
              const exists = prev.find((o) => o.id === eventOrder.id);
              if (exists) {
                return prev.map((o) =>
                  o.id === eventOrder.id
                    ? {
                        ...o,
                        status: (eventOrder.status as KitchenOrder['status']) || o.status,
                        updatedAt: (eventOrder.updated_at as string) || o.updatedAt,
                      }
                    : o
                );
              }
              return prev;
            });
          }

          setLastUpdate(new Date());
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orders.length > 0 ? derivedRestaurantIdRef.current : null]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(fetchOrders, derivedRestaurantIdRef.current ? 60000 : 30000);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchOrders]);

  const updateFilters = useCallback((newFilters: Partial<KitchenFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setLoading(true);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setLoading(true);
  }, []);

  return {
    orders,
    loading,
    filters,
    lastUpdate,
    refresh: fetchOrders,
    updateFilters,
    clearFilters,
  };
}
