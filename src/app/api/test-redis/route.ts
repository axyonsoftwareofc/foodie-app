// src/app/api/test-redis/route.ts
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const redis = getRedis();

  if (!redis) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Redis nao configurado. Verifique REDIS_URL e REDIS_TOKEN no .env.local e no painel Vercel.',
      },
      { status: 503 }
    );
  }

  try {
    const testKey = `test:redis:${Date.now()}`;
    const testValue = { message: 'Redis funcionando!', timestamp: new Date().toISOString() };

    await redis.set(testKey, JSON.stringify(testValue), { ex: 60 });
    await redis.get(testKey);
    await redis.del(testKey);

    return NextResponse.json({
      success: true,
      message: 'Redis conectado e operacional',
      operations: {
        set: true,
        get: true,
        del: true,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        type: 'Redis operation failed',
      },
      { status: 500 }
    );
  }
}
