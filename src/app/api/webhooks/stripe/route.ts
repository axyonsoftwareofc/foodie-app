// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RateLimitConfig, buildRateLimitResponse } from '@/lib/rate-limit';
import { updateOrderStatusByPayment } from '@/lib/payments/webhook-order-update';
import { isDuplicateRequest } from '@/lib/idempotency';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/sentry';

export async function POST(request: NextRequest) {
    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

    const ip = getClientIp(request);
    const rate = await checkRateLimit(`webhook:stripe:${ip}`, RateLimitConfig.moderate.limit, RateLimitConfig.moderate.windowSeconds);
    if (!rate.success) return buildRateLimitResponse(rate);

    if (!WEBHOOK_SECRET) {
        logger.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const signature = request.headers.get('stripe-signature');
    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const payload = await request.text();

    try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            apiVersion: (process.env.STRIPE_API_VERSION as any) || '2024-12-18.acacia',
        });

        const event = stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);

        if (await isDuplicateRequest(`stripe-event:${event.id}`, 86400)) {
            return NextResponse.json({ received: true });
        }

        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as { id: string; metadata?: Record<string, string> };
                const orderId = paymentIntent.metadata?.orderId;

                if (orderId) {
                    const result = await updateOrderStatusByPayment({
                        orderId,
                        provider: 'STRIPE',
                        paymentStatus: 'succeeded',
                        paymentIntentId: paymentIntent.id,
                        gatewayPaymentId: paymentIntent.id,
                    });

                    if (!result.success) {
                        logger.warn('[Stripe Webhook] Failed to update order', { orderId, error: result.error });
                    }
                } else {
                    logger.warn('[Stripe Webhook] PaymentIntent succeeded without orderId metadata', { paymentIntentId: paymentIntent.id });
                }
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as { id: string; metadata?: Record<string, string> };
                const orderId = paymentIntent.metadata?.orderId;

                if (orderId) {
                    const result = await updateOrderStatusByPayment({
                        orderId,
                        provider: 'STRIPE',
                        paymentStatus: 'failed',
                        paymentIntentId: paymentIntent.id,
                        gatewayPaymentId: paymentIntent.id,
                    });

                    if (!result.success) {
                        logger.warn('[Stripe Webhook] Failed to update order on payment failure', { orderId, error: result.error });
                    }
                }
                break;
            }
            default:
                logger.info(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('[Stripe Webhook] Error verifying signature', err);
        captureException(err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
}
