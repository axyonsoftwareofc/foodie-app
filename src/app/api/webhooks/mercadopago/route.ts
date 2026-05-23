// src/app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, RateLimitConfig, buildRateLimitResponse } from '@/lib/rate-limit';

const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`webhook:mp:${ip}`, RateLimitConfig.moderate.limit, RateLimitConfig.moderate.windowSeconds);
    if (!rate.success) return buildRateLimitResponse(rate);

    if (!WEBHOOK_SECRET || !ACCESS_TOKEN) {
        console.error('[MP Webhook] Missing configuration');
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Mercado Pago pode enviar notificações com query params (secret) ou assinatura
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
            console.error('[MP Webhook] Failed to verify payment with MP API');
            return NextResponse.json({ error: 'Failed to verify payment' }, { status: 502 });
        }

        const payment = await mpResponse.json();

        if (topic === 'payment' || body?.type === 'payment') {
            console.log('[MP Webhook] Payment update:', payment.id, payment.status);
            // TODO: atualizar status do pedido usando payment.external_reference (orderId)
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('[MP Webhook] Error processing webhook:', error);
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
}
