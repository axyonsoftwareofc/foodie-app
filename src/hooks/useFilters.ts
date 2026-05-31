// src/hooks/useFilters.ts
'use client';

import { useState, useMemo, useCallback } from 'react';
import { Restaurant } from '@/types';
import { ActiveFilters, DEFAULT_FILTERS } from '@/lib/constants/filter.constants';

export function useFilters(restaurants: Restaurant[]) {
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);

  const updateFilter = useCallback(
    <K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K]): void => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback((): void => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const filteredRestaurants = useMemo(() => {
    let result = [...restaurants];

    // Filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.category.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de categoria
    if (filters.category) {
      result = result.filter((r) => r.category === filters.category);
    }

    // Filtro de rating mínimo
    if (filters.minRating) {
      result = result.filter((r) => r.rating >= filters.minRating!);
    }

    // Filtro de taxa de entrega
    if (filters.freeDeliveryOnly) {
      result = result.filter((r) => r.deliveryFee === 0);
    } else if (filters.maxDeliveryFee) {
      result = result.filter((r) => r.deliveryFee <= filters.maxDeliveryFee!);
    }

    // Ordenação
    switch (filters.sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'delivery_time':
        result.sort((a, b) => {
          const getMinTime = (time: string) => parseInt(time.split('-')[0]);
          return getMinTime(a.deliveryTime) - getMinTime(b.deliveryTime);
        });
        break;
      case 'delivery_fee':
        result.sort((a, b) => a.deliveryFee - b.deliveryFee);
        break;
      default:
        // Relevância: promovidos primeiro, depois por rating
        result.sort((a, b) => {
          if (a.promoted && !b.promoted) return -1;
          if (!a.promoted && b.promoted) return 1;
          return b.rating - a.rating;
        });
    }

    return result;
  }, [restaurants, filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.category !== null ||
      filters.sortBy !== 'relevance' ||
      filters.minRating !== null ||
      filters.maxDeliveryFee !== null ||
      filters.freeDeliveryOnly
    );
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    filteredRestaurants,
    hasActiveFilters,
  };
}
