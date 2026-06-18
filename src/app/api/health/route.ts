// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRedis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import {
  checkRateLimit,
  getClientIp,
  RateLimitConfig,
  buildRateLimitResponse,
} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: { status: 'up' | 'down'; latencyMs: number };
    cache: { status: 'up' | 'down'; latencyMs: number };
  };
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `health:get:${ip}`,
    RateLimitConfig.relaxed.limit,
    RateLimitConfig.relaxed.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  const HEALTH_TOKEN = process.env.HEALTH_API_TOKEN;
  let isAuthorized = false;
  if (HEALTH_TOKEN) {
    try {
      const { headers } = await import('next/headers');
      const h = await headers();
      const auth = h.get('authorization');
      if (auth && auth === `Bearer ${HEALTH_TOKEN}`) {
        isAuthorized = true;
      }
    } catch {
      // ignore
    }
  }

  // Sem token configurado OU token invalido: retornar status coarse sem detalhes
  if (!isAuthorized) {
    if (!HEALTH_TOKEN) {
      // Nenhum token configurado — verificar apenas o DB coarse e retornar minimo
      try {
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({ status: 'ok' });
      } catch {
        return NextResponse.json({ status: 'error' }, { status: 503 });
      }
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const checks: HealthStatus['checks'] = {
    database: { status: 'down', latencyMs: 0 },
    cache: { status: 'down', latencyMs: 0 },
  };

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'up', latencyMs: Date.now() - dbStart };
  } catch (error) {
    checks.database = { status: 'down', latencyMs: Date.now() - start };
    logger.error(
      'Health check database failed',
      error instanceof Error ? error : new Error(String(error))
    );
  }

  try {
    const cacheStart = Date.now();
    const redis = getRedis();
    if (redis) {
      await redis.ping();
      checks.cache = { status: 'up', latencyMs: Date.now() - cacheStart };
    } else {
      checks.cache = { status: 'down', latencyMs: 0 };
      logger.warn('Health check Redis unavailable');
    }
  } catch (error) {
    checks.cache = { status: 'down', latencyMs: Date.now() - start };
    logger.error(
      'Health check Redis failed',
      error instanceof Error ? error : new Error(String(error))
    );
  }

  const overallStatus: HealthStatus['status'] =
    checks.database.status === 'up' && checks.cache.status === 'up'
      ? 'healthy'
      : checks.database.status === 'down'
        ? 'unhealthy'
        : 'degraded';

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    } satisfies HealthStatus,
    { status: statusCode }
  );
}
