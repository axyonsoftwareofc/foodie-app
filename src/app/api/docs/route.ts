// src/app/api/docs/route.ts
import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/openapi';
import {
  checkRateLimit,
  getClientIp,
  RateLimitConfig,
  buildRateLimitResponse,
} from '@/lib/rate-limit';

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `docs:get:${ip}`,
    RateLimitConfig.relaxed.limit,
    RateLimitConfig.relaxed.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  return NextResponse.json(openApiSpec);
}
