// src/app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  checkRateLimit,
  getClientIp,
  RateLimitConfig,
  buildRateLimitResponse,
} from '@/lib/rate-limit';
import { updateOrderStatusByPayment } from '@/lib/payments/webhook-order-update';
import { isDuplicateRequest } from '@/lib/idempotency';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/sentry';

function verifyMpSignature(
  rawBody: string,
  xSignature: string,
  xRequestId: string | null,
  secret: string
): boolean {
  const parts = xSignature.split(',');
  let ts: string | null = null;
  let hash: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key.trim() === 'ts') ts = value.trim();
    if (key.trim() === 'v1') hash = value.trim();
  }

  if (!ts || !hash) return false;

  const manifest = `${xRequestId ?? ''}:${rawBody}`;
  const hmac = createHmac('sha256', secret);
  hmac.update(manifest);
  const expected = hmac.digest('hex');

  if (expected.length !== hash.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `webhook:mp:${ip}`,
    RateLimitConfig.moderate.limit,
    RateLimitConfig.moderate.windowSeconds,
    true
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  if (!WEBHOOK_SECRET || !ACCESS_TOKEN) {
    logger.error('[MP Webhook] Missing configuration');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const xSignature = request.headers.get('x-signature');
  if (!xSignature) {
    return NextResponse.json({ error: 'Missing x-signature header' }, { status: 401 });
  }

  const xRequestId = request.headers.get('x-request-id');
  const rawBody = await request.text();

  if (!verifyMpSignature(rawBody, xSignature, xRequestId, WEBHOOK_SECRET)) {
    logger.warn('[MP Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);

    // Mercado Pago envia `data.id` (paymentId) e `type` (payment, merchant_order, etc)
    const paymentId = body?.data?.id;
    const topic = body?.type || body?.topic;

    if (!paymentId || !topic) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Verificar pagamento via API do MP para confirmar autenticidade
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    if (!mpResponse.ok) {
      logger.error(
        '[MP Webhook] Failed to verify payment with MP API',
        new Error(`HTTP ${mpResponse.status}`),
        { paymentId }
      );
      return NextResponse.json({ error: 'Failed to verify payment' }, { status: 502 });
    }

    if (await isDuplicateRequest(`mp-webhook:${paymentId}`, 86400)) {
      return NextResponse.json({ received: true });
    }

    const payment = (await mpResponse.json()) as {
      id: string;
      status: string;
      status_detail?: string;
      external_reference?: string;
      transaction_amount?: number;
    };

    if (topic === 'payment' || body?.type === 'payment') {
      const orderId = payment.external_reference;

      if (orderId) {
        const mappedStatus = mapMpStatus(payment.status);
        if (mappedStatus) {
          const result = await updateOrderStatusByPayment({
            orderId,
            provider: 'MERCADOPAGO',
            paymentStatus: mappedStatus,
            gatewayPaymentId: String(payment.id),
            paidAmount: payment.transaction_amount,
          });

          if (!result.success) {
            logger.warn('[MP Webhook] Failed to update order', { orderId, error: result.error });
          }
        } else {
          logger.info('[MP Webhook] Unhandled payment status', {
            status: payment.status,
            paymentId: payment.id,
          });
        }
      } else {
        logger.warn('[MP Webhook] Payment without external_reference', { paymentId: payment.id });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('[MP Webhook] Error processing webhook', err);
    captureException(err);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

function mapMpStatus(mpStatus: string): 'succeeded' | 'failed' | 'pending' | 'cancelled' | null {
  const statusMap: Record<string, 'succeeded' | 'failed' | 'pending' | 'cancelled'> = {
    approved: 'succeeded',
    authorized: 'succeeded',
    pending: 'pending',
    in_process: 'pending',
    in_mediation: 'pending',
    rejected: 'failed',
    cancelled: 'cancelled',
    refunded: 'cancelled',
    charged_back: 'cancelled',
  };
  return statusMap[mpStatus] || null;
}
