import { redisGet, redisSet, redisDel, cacheKey } from '@/lib/redis';
import type { Restaurant } from '@/types';

const DOMAIN = 'restaurant';
const TTL = 3600; // 1 hora

function keyById(id: string): string {
  return cacheKey(DOMAIN, 'id', id);
}

function keyBySubdomain(subdomain: string): string {
  return cacheKey(DOMAIN, 'subdomain', subdomain);
}

export async function getCachedRestaurant(id: string): Promise<Restaurant | null> {
  return redisGet<Restaurant>(keyById(id));
}

export async function getCachedRestaurantBySubdomain(
  subdomain: string
): Promise<Restaurant | null> {
  return redisGet<Restaurant>(keyBySubdomain(subdomain));
}

export async function setCachedRestaurant(restaurant: Restaurant): Promise<void> {
  await redisSet(keyById(restaurant.id), restaurant, TTL);
}

export async function invalidateRestaurantCache(restaurantId: string): Promise<void> {
  await redisDel(keyById(restaurantId));
}
