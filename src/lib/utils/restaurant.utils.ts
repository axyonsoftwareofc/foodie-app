// src/lib/utils/restaurant.utils.ts
import { Restaurant, MenuItem, MenuCategory, type DayOfWeek } from '@/types';

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

  return Object.entries(grouped).map(([name, items]) => ({
    name,
    items,
  }));
}

/**
 * Filtra itens populares
 */
export function getPopularItems(items: MenuItem[]): MenuItem[] {
  return items.filter((item) => item.popular);
}

const DAY_NAMES: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Verifica se o restaurante está aberto agora com base nos horários de funcionamento
 */
export function isRestaurantOpen(restaurant: Restaurant): boolean {
  if (restaurant.isOpen === false) {
    return false;
  }

  if (!restaurant.openingHours || restaurant.openingHours.length === 0) {
    return restaurant.isOpen ?? true;
  }

  const now = new Date();
  const today = DAY_NAMES[now.getDay()];

  const todayHours = restaurant.openingHours.find((h) => h.day === today);
  if (!todayHours || !todayHours.isOpen) {
    return false;
  }

  if (todayHours.openTime && todayHours.closeTime) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = timeToMinutes(todayHours.openTime);
    const closeMinutes = timeToMinutes(todayHours.closeTime);

    if (closeMinutes <= openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  return true;
}

/**
 * Converte o JSON de operating_hours do Prisma para OpeningHours[]
 */
export function parseOperatingHours(raw: unknown): Restaurant['openingHours'] {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (item): item is { day: string; isOpen: boolean; openTime?: string; closeTime?: string } =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.day === 'string' &&
          typeof item.isOpen === 'boolean'
      )
      .map((item) => ({
        day: item.day as DayOfWeek,
        isOpen: item.isOpen,
        openTime: item.openTime || undefined,
        closeTime: item.closeTime || undefined,
      }));
  } catch {
    return [];
  }
}

/**
 * Gera slug para URL do restaurante
 */
export function generateRestaurantSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
