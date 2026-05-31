// src/lib/idempotency.ts
import { redisSetNX, redisDel } from './redis';

const DEFAULT_TTL_SECONDS = 300; // 5 minutos

/**
 * Gera uma chave de idempotência determinística baseada em um identificador único.
 * Útil para Stripe, Mercado Pago e Pix manual.
 */
export function generateIdempotencyKey(prefix: string, uniqueId: string): string {
  return `${prefix}:${uniqueId}`;
}

/**
 * Verifica se uma chave de idempotência já foi processada.
 * Se sim, retorna true (indicando duplicata).
 * Se não, registra a chave com TTL e retorna false.
 */
export async function isDuplicateRequest(
  key: string,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<boolean> {
  const wasSet = await redisSetNX(`idempotency:${key}`, '1', ttlSeconds);
  return !wasSet;
}

/**
 * Limpa uma chave de idempotência (ex: após falha para permitir retry).
 */
export async function clearIdempotencyKey(key: string): Promise<void> {
  await redisDel(`idempotency:${key}`);
}
