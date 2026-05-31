// src/tests/api/health.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/health/route';
import { prisma } from '@/lib/prisma';
import { getRedis } from '@/lib/redis';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@/lib/redis', () => ({
  getRedis: vi.fn(),
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns healthy when DB and Redis are up', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ 1: 1 }]);
    vi.mocked(getRedis).mockReturnValueOnce({
      ping: vi.fn().mockResolvedValueOnce('PONG'),
    } as unknown as NonNullable<ReturnType<typeof getRedis>>);

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.checks.database.status).toBe('up');
    expect(body.checks.cache.status).toBe('up');
  });

  it('returns degraded when Redis is down but DB is up', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ 1: 1 }]);
    vi.mocked(getRedis).mockReturnValueOnce(null);

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('degraded');
    expect(body.checks.database.status).toBe('up');
    expect(body.checks.cache.status).toBe('down');
  });

  it('returns unhealthy when DB is down', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection refused'));
    vi.mocked(getRedis).mockReturnValueOnce(null);

    const response = await GET();
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.status).toBe('unhealthy');
    expect(body.checks.database.status).toBe('down');
  });
});
