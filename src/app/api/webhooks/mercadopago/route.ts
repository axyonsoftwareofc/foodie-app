// src/app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RateLimitConfig, buildRateLimitResponse } from '@/lib/rate-limit';
import { updateOrderStatusByPayment } from '@/lib/payments/webhook-order-update';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/sentry';

export async function POST(request: NextRequest) {
    const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

    const ip = getClientIp(request);
    const rate = await checkRateLimit(`webhook:mp:${ip}`, RateLimitConfig.moderate.limit, RateLimitConfig.moderate.windowSeconds);
    if (!rate.success) return buildRateLimitResponse(rate);

    if (!WEBHOOK_SECRET || !ACCESS_TOKEN) {
        logger.error('[MP Webhook] Missing configuration');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Mercado Pago pode enviar notificacoes com query params (secret) ou assinatura
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');
    if (querySecret && querySecret !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Mercado Pago envia `data.id` (paymentId) e `type` (payment, merchant_order, etc)
        const paymentId = body?.data?.id;
        const topic = body?.type || body?.topic;

        if (!paymentId || !topic) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Verificar pagamento via API do MP para confirmar autenticidade
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
            },
        });

        if (!mpResponse.ok) {
            logger.error('[MP Webhook] Failed to verify payment with MP API', new Error(`HTTP ${mpResponse.status}`), { paymentId });
            return NextResponse.json({ error: 'Failed to verify payment' }, { status: 502 });
        }

        const payment = await mpResponse.json() as {
            id: string;
            status: string;
            status_detail?: string;
            external_reference?: string;
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
                    });

                    if (!result.success) {
                        logger.warn('[MP Webhook] Failed to update order', { orderId, error: result.error });
                    }
                } else {
                    logger.info('[MP Webhook] Unhandled payment status', { status: payment.status, paymentId: payment.id });
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
