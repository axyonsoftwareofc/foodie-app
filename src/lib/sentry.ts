// src/lib/sentry.ts
/**
 * Sentry wrapper re-exporting the official @sentry/nextjs SDK.
 * Falls back to structured console logging when Sentry is not configured.
 *
 * Keep this file thin: business logic should call captureException/captureMessage
 * directly from @sentry/nextjs when possible.
 */

import {
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
  setUser as sentrySetUser,
} from '@sentry/nextjs';
import { logger } from './logger';

const SENTRY_DSN = process.env.SENTRY_DSN;

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (SENTRY_DSN) {
    sentryCaptureException(error, { extra: context });
  } else {
    logger.error('captureException (Sentry not configured)', error, context);
  }
}

export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'warning',
  context?: Record<string, unknown>
) {
  if (SENTRY_DSN) {
    sentryCaptureMessage(message, level);
  } else {
    logger.warn(`captureMessage (Sentry not configured): ${message}`, { level, ...context });
  }
}

export function setSentryUser(user: { id?: string; email?: string } | null) {
  if (SENTRY_DSN) {
    sentrySetUser(user ? { id: user.id, email: user.email } : null);
  } else {
    logger.info('setSentryUser (Sentry not configured)', { userId: user?.id });
  }
}
