import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedis(): Redis | null {
    if (redis) return redis

    const url = process.env.REDIS_URL
    const token = process.env.REDIS_TOKEN

    if (!url || !token) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('[Redis] REDIS_URL ou REDIS_TOKEN nao configurados. Cache desabilitado.')
        }
        return null
    }

    try {
        redis = new Redis({ url, token })
        return redis
    } catch (error) {
        console.error('[Redis] Erro ao conectar:', error)
        return null
    }
}

export async function redisGet<T>(key: string): Promise<T | null> {
    const client = getRedis()
    if (!client) return null

    try {
        const value = await client.get<string>(key)
        if (!value) return null
        return JSON.parse(value) as T
    } catch {
        return null
    }
}

export async function redisSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    const client = getRedis()
    if (!client) return

    try {
        await client.set(key, JSON.stringify(value), { ex: ttlSeconds })
    } catch {
        // Silencioso — cache é otimização, não requisito
    }
}

export async function redisDel(key: string): Promise<void> {
    const client = getRedis()
    if (!client) return

    try {
        await client.del(key)
    } catch {
        // Silencioso
    }
}

export async function redisDelPattern(pattern: string): Promise<void> {
    const client = getRedis()
    if (!client) return

    try {
        const keys = await client.keys(pattern)
        if (keys.length > 0) {
            await client.del(...keys)
        }
    } catch {
        // Silencioso
    }
}

const CACHE_PREFIX = 'foodie'

export function cacheKey(domain: string, ...parts: string[]): string {
    return [CACHE_PREFIX, domain, ...parts].join(':')
}
