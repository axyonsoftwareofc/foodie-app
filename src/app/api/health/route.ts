// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRedis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    version: string
    uptime: number
    checks: {
        database: { status: 'up' | 'down'; latencyMs: number }
        cache: { status: 'up' | 'down'; latencyMs: number }
    }
}

export async function GET() {
    const start = Date.now()
    const checks: HealthStatus['checks'] = {
        database: { status: 'down', latencyMs: 0 },
        cache: { status: 'down', latencyMs: 0 },
    }

    // Database check
    try {
        const dbStart = Date.now()
        await prisma.$queryRaw`SELECT 1`
        checks.database = { status: 'up', latencyMs: Date.now() - dbStart }
    } catch {
        checks.database = { status: 'down', latencyMs: Date.now() - start }
    }

    // Redis check
    try {
        const cacheStart = Date.now()
        const redis = getRedis()
        if (redis) {
            await redis.ping()
            checks.cache = { status: 'up', latencyMs: Date.now() - cacheStart }
        } else {
            checks.cache = { status: 'down', latencyMs: 0 }
        }
    } catch {
        checks.cache = { status: 'down', latencyMs: Date.now() - start }
    }

    const overallStatus: HealthStatus['status'] =
        checks.database.status === 'up' && checks.cache.status === 'up'
            ? 'healthy'
            : checks.database.status === 'down'
                ? 'unhealthy'
                : 'degraded'

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(
        {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '0.1.0',
            uptime: process.uptime(),
            checks,
        } satisfies HealthStatus,
        { status: statusCode }
    )
}
