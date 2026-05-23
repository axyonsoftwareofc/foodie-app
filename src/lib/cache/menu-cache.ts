import { redisGet, redisSet, redisDel, cacheKey } from '@/lib/redis'
import type { Restaurant, MenuCategory } from '@/types'

const DOMAIN = 'menu'
const TTL = 300 // 5 minutos

interface CachedMenu {
    restaurant: Restaurant
    categories: MenuCategory[]
    cachedAt: number
}

function keyBySlug(slug: string): string {
    return cacheKey(DOMAIN, 'slug', slug)
}

function keyByRestaurant(restaurantId: string): string {
    return cacheKey(DOMAIN, 'restaurant', restaurantId)
}

export async function getCachedMenu(slug: string): Promise<CachedMenu | null> {
    return redisGet<CachedMenu>(keyBySlug(slug))
}

export async function setCachedMenu(slug: string, restaurant: Restaurant, categories: MenuCategory[]): Promise<void> {
    await redisSet(keyBySlug(slug), { restaurant, categories, cachedAt: Date.now() }, TTL)
}

export async function invalidateMenuCache(restaurantId: string): Promise<void> {
    await redisDel(keyByRestaurant(restaurantId))
}
