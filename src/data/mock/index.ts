// src/data/mock/index.ts
import { restaurants } from './restaurants';
import { menuItems } from './menu-items';
import { Restaurant, MenuItem, MenuCategory } from '@/types';

// ============================================
// RE-EXPORT DATA
// ============================================

export { restaurants, menuItems };

// ============================================
// RESTAURANT HELPERS
// ============================================

/**
 * Busca restaurante por ID
 */
export function getRestaurantById(id: string): Restaurant | undefined {
  return restaurants.find((r) => r.id === id);
}

/**
 * Busca restaurantes por categoria
 */
export function getRestaurantsByCategory(category: string): Restaurant[] {
  return restaurants.filter((r) => r.category === category);
}

/**
 * Busca restaurantes com entrega grátis
 */
export function getFreeDeliveryRestaurants(): Restaurant[] {
  return restaurants.filter((r) => r.deliveryFee === 0);
}

/**
 * Busca restaurantes populares (rating >= 4.5)
 */
export function getPopularRestaurants(): Restaurant[] {
  return restaurants.filter((r) => r.rating >= 4.5);
}

/**
 * Busca restaurantes promovidos
 */
export function getPromotedRestaurants(): Restaurant[] {
  return restaurants.filter((r) => r.promoted);
}

/**
 * Busca restaurantes abertos
 */
export function getOpenRestaurants(): Restaurant[] {
  return restaurants.filter((r) => r.isOpen);
}

/**
 * Busca restaurantes por termo de pesquisa
 */
export function searchRestaurants(query: string): Restaurant[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return restaurants;

  return restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(normalizedQuery) ||
      r.category.toLowerCase().includes(normalizedQuery)
  );
}

// ============================================
// MENU HELPERS
// ============================================

/**
 * Busca itens do menu por restaurante
 */
export function getMenuByRestaurant(restaurantId: string): MenuItem[] {
  return menuItems.filter((item) => item.restaurantId === restaurantId);
}

/**
 * Agrupa itens do menu por categoria
 */
export function groupMenuByCategory(items: MenuItem[]): MenuCategory[] {
  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>
  );

  return Object.entries(grouped).map(([name, categoryItems]) => ({
    name,
    items: categoryItems,
  }));
}

/**
 * Busca itens do menu agrupados por categoria
 */
export function getMenuCategoriesByRestaurant(restaurantId: string): MenuCategory[] {
  const items = getMenuByRestaurant(restaurantId);
  return groupMenuByCategory(items);
}

/**
 * Busca itens populares de um restaurante
 */
export function getPopularMenuItems(restaurantId: string): MenuItem[] {
  return menuItems.filter((item) => item.restaurantId === restaurantId && item.popular);
}

/**
 * Busca item do menu por ID
 */
export function getMenuItemById(id: string): MenuItem | undefined {
  return menuItems.find((item) => item.id === id);
}

/**
 * Busca itens disponíveis de um restaurante
 */
export function getAvailableMenuItems(restaurantId: string): MenuItem[] {
  return menuItems.filter((item) => item.restaurantId === restaurantId && item.available !== false);
}
