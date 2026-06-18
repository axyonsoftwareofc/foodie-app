// src/actions/payments.ts
'use server';

import { PixPaymentDetails, PaymentIntentResponse } from '@/types/payment.types';
import { checkRateLimit, getClientIdentifierFromHeaders, RateLimitConfig } from '@/lib/rate-limit';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function createPaymentIntent(
  orderId: string,
  email?: string
): Promise<{ data?: PaymentIntentResponse; error?: string }> {
  try {
    const clientId = await getClientIdentifierFromHeaders();
    const rate = await checkRateLimit(
      `sa:payments:intent:${clientId}`,
      RateLimitConfig.strict.limit,
      RateLimitConfig.strict.windowSeconds,
      true
    );
    if (!rate.success) {
      return { error: 'Muitas requisições. Aguarde um momento.' };
    }
    const response = await fetch(`${APP_URL}/api/payments/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        email,
        currency: 'brl',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to create payment intent' };
    }

    return { data };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return { error: 'Erro ao processar pagamento. Tente novamente.' };
  }
}

export async function createPixPayment(
  orderId: string,
  customerEmail?: string
): Promise<{ data?: PixPaymentDetails; error?: string }> {
  try {
    const clientId = await getClientIdentifierFromHeaders();
    const rate = await checkRateLimit(
      `sa:payments:pix:${clientId}`,
      RateLimitConfig.strict.limit,
      RateLimitConfig.strict.windowSeconds,
      true
    );
    if (!rate.success) {
      return { error: 'Muitas requisições. Aguarde um momento.' };
    }
    const response = await fetch(`${APP_URL}/api/payments/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        customerEmail,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to generate Pix payment' };
    }

    return { data };
  } catch (error) {
    console.error('Error generating Pix payment:', error);
    return { error: 'Erro ao gerar pagamento Pix. Tente novamente.' };
  }
}
