// src/tests/api/health.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/health/route';
import { prisma } from '@/lib/prisma';
import { getRedis } from '@/lib/redis';
import * as rateLimitModule from '@/lib/rate-limit';

const { checkRateLimit, getClientIp } = rateLimitModule;

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@/lib/redis', () => ({
  getRedis: vi.fn(),
}));

vi.mock('@/lib/rate-limit');

function buildRequest() {
  return new Request('http://localhost/api/health');
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60_000,
    });
    vi.mocked(getClientIp).mockReturnValue('127.0.0.1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns ok when DB is up (unauthenticated, no token set)', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ 1: 1 }]);

    const response = await GET(buildRequest());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  it('returns error when DB is down (unauthenticated, no token set)', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection refused'));

    const response = await GET(buildRequest());
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body.status).toBe('error');
  });
});
