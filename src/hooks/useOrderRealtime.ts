'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface OrderRealtimeUpdate {
  status: string;
  updatedAt: string;
  preparationStartedAt?: string | null;
  readyAt?: string | null;
  deliveringAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
}

function toISO(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

/**
 * Assina alteracoes em tempo real de um pedido via Supabase Realtime.
 * O callback recebe apenas campos simples (status/timestamps) para atualizacao
 * otimista e instantanea na UI do cliente.
 */
export function useOrderRealtime(
  orderId: string | null | undefined,
  onUpdate: (update: OrderRealtimeUpdate) => void
): void {
  const callbackRef = useRef(onUpdate);
  useEffect(() => {
    callbackRef.current = onUpdate;
  });

  useEffect(() => {
    if (!orderId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          const row = payload.new as Record<string, unknown> | null;
          if (!row) return;
          callbackRef.current({
            status: (row.status as string) ?? '',
            updatedAt: toISO(row.updated_at) ?? new Date().toISOString(),
            preparationStartedAt: toISO(row.preparation_started_at),
            readyAt: toISO(row.ready_at),
            deliveringAt: toISO(row.delivering_at),
            deliveredAt: toISO(row.delivered_at),
            cancelledAt: toISO(row.cancelled_at),
            cancelReason: (row.cancel_reason as string) ?? null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);
}
