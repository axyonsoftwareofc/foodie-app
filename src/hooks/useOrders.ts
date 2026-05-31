// src/hooks/useOrders.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOrders as getOrdersFromDB, type OrderData } from '@/actions/orders';

const ORDERS_STORAGE_KEY = 'foodie-orders';

function readStoredOrders(): OrderData[] {
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing stored orders:', error);
    return [];
  }
}

export function useOrders() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load from DB first, fallback to localStorage
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const result = await getOrdersFromDB();
        if (result.data) {
          setOrders(result.data);
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(result.data));
        } else {
          // Fallback to localStorage
          setOrders(readStoredOrders());
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders(readStoredOrders());
      }
      setIsLoading(false);
      setIsHydrated(true);
    };

    loadOrders();
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      } catch (error) {
        console.error('Error saving orders:', error);
      }
    }
  }, [orders, isHydrated]);

  const addOrder = useCallback((order: OrderData): void => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const getOrderById = useCallback(
    (id: string): OrderData | undefined => {
      return orders.find((order) => order.id === id);
    },
    [orders]
  );

  const updateOrderStatus = useCallback((id: string, status: OrderData['status']): void => {
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const result = await getOrdersFromDB();
      if (result.data) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
  }, []);

  return {
    orders,
    addOrder,
    getOrderById,
    updateOrderStatus,
    refresh,
    isHydrated,
    isLoading,
  };
}
