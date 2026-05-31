// src/hooks/useFavorites.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'foodie-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidratar do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
    setIsHydrated(true);
  }, []);

  // Persistir no localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Error saving favorites:', error);
      }
    }
  }, [favorites, isHydrated]);

  const addFavorite = useCallback((restaurantId: string): void => {
    setFavorites((prev) => {
      if (prev.includes(restaurantId)) return prev;
      return [...prev, restaurantId];
    });
  }, []);

  const removeFavorite = useCallback((restaurantId: string): void => {
    setFavorites((prev) => prev.filter((id) => id !== restaurantId));
  }, []);

  const toggleFavorite = useCallback(
    (restaurantId: string): boolean => {
      const isFavorite = favorites.includes(restaurantId);
      if (isFavorite) {
        removeFavorite(restaurantId);
        return false;
      } else {
        addFavorite(restaurantId);
        return true;
      }
    },
    [favorites, addFavorite, removeFavorite]
  );

  const isFavorite = useCallback(
    (restaurantId: string): boolean => {
      return favorites.includes(restaurantId);
    },
    [favorites]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    isHydrated,
  };
}
