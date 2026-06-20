import { redisGet, redisSet, redisDel, cacheKey } from '@/lib/redis';

const DOMAIN = 'menu';
const TTL = 300; // 5 minutos

export interface CachedMenu {
  restaurant: Record<string, unknown>;
  categories: Record<string, unknown>[];
  cachedAt: number;
}

function keyBySlug(slug: string): string {
  return cacheKey(DOMAIN, 'slug', slug);
}

export async function getCachedMenu(slug: string): Promise<CachedMenu | null> {
  return redisGet<CachedMenu>(keyBySlug(slug));
}

export async function setCachedMenu(
  slug: string,
  payload: { restaurant: Record<string, unknown>; categories: Record<string, unknown>[] }
): Promise<void> {
  await redisSet(keyBySlug(slug), { ...payload, cachedAt: Date.now() }, TTL);
}

export async function invalidateMenuCache(slug: string): Promise<void> {
  await redisDel(keyBySlug(slug));
}
