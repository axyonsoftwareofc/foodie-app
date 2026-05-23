// src/lib/sentry.ts
/**
 * Sentry wrapper for server-side error tracking.
 * Falls back to console logging when Sentry is not configured.
 *
 * Install @sentry/nextjs if you want client-side + source maps:
 *   npm install @sentry/nextjs
 *
 * Then replace this wrapper with the official SDK.
 */

import { logger } from './logger'

const SENTRY_DSN = process.env.SENTRY_DSN
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'

interface SentryScope {
    setTag: (key: string, value: string) => void
    setContext: (name: string, data: Record<string, unknown>) => void
    setUser: (user: { id?: string; email?: string } | null) => void
}

class SentryFallback {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static captureException(error: Error, _scope?: (scope: SentryScope) => void) {
        logger.error('Sentry captureException (fallback)', error, {
            sentryAvailable: false,
            environment: SENTRY_ENVIRONMENT,
        })
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static captureMessage(message: string, _level?: string, _scope?: (scope: SentryScope) => void) {
        logger.warn(`Sentry captureMessage (fallback): ${message}`, {
            sentryAvailable: false,
            environment: SENTRY_ENVIRONMENT,
        })
    }
}

export function captureException(error: Error, scope?: (scope: SentryScope) => void) {
    if (SENTRY_DSN) {
        // If @sentry/nextjs is installed, call Sentry.captureException here.
        // For now, log structured error.
        logger.error('Exception captured', error, { sentryDsnConfigured: true })
    } else {
        SentryFallback.captureException(error, scope)
    }
}

export function captureMessage(message: string, level: string = 'warning', scope?: (scope: SentryScope) => void) {
    if (SENTRY_DSN) {
        logger.warn(`Message captured: ${message}`, { level, sentryDsnConfigured: true })
    } else {
        SentryFallback.captureMessage(message, level, scope)
    }
}

export function setSentryUser(user: { id?: string; email?: string } | null) {
    if (SENTRY_DSN) {
        logger.info('Sentry user set', { userId: user?.id, sentryDsnConfigured: true })
    }
}
