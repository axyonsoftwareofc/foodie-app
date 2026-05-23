// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RateLimitConfig, buildRateLimitResponse } from '@/lib/rate-limit';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`webhook:stripe:${ip}`, RateLimitConfig.moderate.limit, RateLimitConfig.moderate.windowSeconds);
    if (!rate.success) return buildRateLimitResponse(rate);

    if (!WEBHOOK_SECRET) {
        console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
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

        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as { id: string; metadata?: Record<string, string> };
                console.log('[Stripe Webhook] PaymentIntent succeeded:', paymentIntent.id);
                // TODO: atualizar status do pedido no banco usando paymentIntent.metadata?.orderId
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as { id: string; metadata?: Record<string, string> };
                console.log('[Stripe Webhook] PaymentIntent failed:', paymentIntent.id);
                // TODO: notificar cliente / atualizar pedido
                break;
            }
            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[Stripe Webhook] Error verifying signature:', error);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
}
