import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIp,
  RateLimitConfig,
  buildRateLimitResponse,
} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = 'SentryExampleAPIError';
  }
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `sentry-example:${ip}`,
    RateLimitConfig.strict.limit,
    RateLimitConfig.strict.windowSeconds
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  Sentry.logger.info('Sentry example API called');
  throw new SentryExampleAPIError(
    'This error is raised on the backend called by the example page.'
  );
}
