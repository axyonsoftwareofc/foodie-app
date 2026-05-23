// src/lib/logger.ts
/**
 * Lightweight structured logger.
 * In production, outputs JSON lines for ingestion by log aggregators.
 * In development, outputs human-readable console logs.
 *
 * Replace with Pino/Winston when log volume justifies a dedicated dependency.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
    [key: string]: unknown
}

function isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
}

function formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
): string {
    const timestamp = new Date().toISOString()
    const requestId = (globalThis as Record<string, unknown>).__requestId as string | undefined

    const payload: Record<string, unknown> = {
        timestamp,
        level: level.toUpperCase(),
        message,
        env: process.env.NODE_ENV || 'unknown',
    }

    if (requestId) payload.requestId = requestId
    if (context && Object.keys(context).length > 0) payload.context = context
    if (error) {
        payload.error = {
            name: error.name,
            message: error.message,
            stack: error.stack,
        }
    }

    if (isProduction()) {
        return JSON.stringify(payload)
    }

    // Human-readable for development
    let line = `[${timestamp}] ${level.toUpperCase()}: ${message}`
    if (requestId) line += ` (req=${requestId})`
    if (context && Object.keys(context).length > 0) line += ` | ${JSON.stringify(context)}`
    if (error) line += ` | ERROR: ${error.name}: ${error.message}`
    return line
}

function log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const formatted = formatMessage(level, message, context, error)

    switch (level) {
        case 'debug':
            if (!isProduction()) console.debug(formatted)
            break
        case 'info':
            console.info(formatted)
            break
        case 'warn':
            console.warn(formatted)
            break
        case 'error':
            console.error(formatted)
            break
    }
}

export const logger = {
    debug: (message: string, context?: LogContext) => log('debug', message, context),
    info: (message: string, context?: LogContext) => log('info', message, context),
    warn: (message: string, context?: LogContext) => log('warn', message, context),
    error: (message: string, error?: Error, context?: LogContext) =>
        log('error', message, context, error),
}
