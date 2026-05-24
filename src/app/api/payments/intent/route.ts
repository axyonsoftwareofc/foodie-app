// src/app/api/payments/intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authz';
import { getOrderPaymentContext } from '@/lib/payments/order-payment';
import { checkRateLimit, getClientIp, RateLimitConfig, buildRateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/sentry';

const FEATURE_ENABLED = process.env.ENABLE_STRIPE_PAYMENTS === 'true';

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`payments:intent:${ip}`, RateLimitConfig.strict.limit, RateLimitConfig.strict.windowSeconds);
    if (!rate.success) return buildRateLimitResponse(rate);

    if (!FEATURE_ENABLED) {
        return NextResponse.json(
            {
                error: 'Stripe payments are not enabled yet',
                message: 'This feature will be available in v5.0'
            },
            { status: 503 }
        );
    }

    const { user, error: authError } = await getCurrentUser();
    if (authError || !user) {
        return NextResponse.json(
            { error: authError || 'Usuario nao autenticado' },
            { status: 401 }
        );
    }

    // ✅ SÓ IMPORTAR STRIPE SE HABILITADO
    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json(
            { error: 'Stripe not configured' },
            { status: 500 }
        );
    }

    let body: { orderId?: string; email?: string; currency?: string; metadata?: Record<string, string> } | null = null;

    try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            apiVersion: (process.env.STRIPE_API_VERSION as any) || '2024-12-18.acacia',
        });

        const requestBody = await request.json();
        body = requestBody;
        const { orderId, email, currency = 'brl', metadata = {} } = requestBody;

        const paymentContext = await getOrderPaymentContext(user.id, orderId);
        if (paymentContext.error || !paymentContext.data) {
            return NextResponse.json(
                { error: paymentContext.error || 'Pedido invalido' },
                { status: paymentContext.status || 400 }
            );
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(paymentContext.data.amount * 100),
            currency,
            receipt_email: email || user.email,
            metadata: {
                ...metadata,
                orderId: paymentContext.data.orderId,
                restaurantId: paymentContext.data.restaurantId,
                platform: 'foodie-app',
            },
            payment_method_options: {
                card: {
                    request_three_d_secure: 'automatic',
                },
            },
        }, {
            idempotencyKey: `stripe-intent-${orderId}`,
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            gateway: 'STRIPE',
        });
    } catch (error) {
        logger.error('Error creating payment intent', error instanceof Error ? error : new Error(String(error)), {
            route: '/api/payments/intent',
            userId: user.id,
            orderId: body?.orderId,
        });
        captureException(error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        );
    }
}
