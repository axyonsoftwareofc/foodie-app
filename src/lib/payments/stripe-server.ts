// src/lib/payments/stripe-server.ts
//
// Fonte única do cliente Stripe do lado do servidor.
// O SDK é importado dinamicamente de propósito: só é carregado quando um
// pagamento Stripe é realmente processado (ver feature flags ENABLE_*).

import type Stripe from 'stripe';

/** Versão usada quando STRIPE_API_VERSION não está definida. */
const DEFAULT_API_VERSION = '2024-12-18.acacia';

let cachedClient: Stripe | null = null;

/**
 * Retorna o cliente Stripe configurado.
 * Lança se `STRIPE_SECRET_KEY` não estiver definida — quem chama deve tratar.
 */
export async function getStripeClient(): Promise<Stripe> {
  if (cachedClient) return cachedClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY nao configurada');
  }

  const { default: StripeSdk } = await import('stripe');

  cachedClient = new StripeSdk(secretKey, {
    apiVersion: (process.env.STRIPE_API_VERSION ||
      DEFAULT_API_VERSION) as Stripe.StripeConfig['apiVersion'],
  });

  return cachedClient;
}
