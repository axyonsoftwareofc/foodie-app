// src/app/api/payments/pix/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authz';
import { getOrderPaymentContext } from '@/lib/payments/order-payment';
import { checkRateLimit, getClientIp, RateLimitConfig, buildRateLimitResponse } from '@/lib/rate-limit';
import { isDuplicateRequest } from '@/lib/idempotency';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/sentry';

const PIX_KEY = process.env.PIX_KEY || 'foodie@email.com';
const PIX_KEY_TYPE = process.env.PIX_KEY_TYPE || 'email';

// ✅ NÃO INICIALIZAR STRIPE NO TOPO DO ARQUIVO
// Só importar quando realmente necessário

interface PixPayload {
    key: string;
    keyType: string;
    amount: number;
    description?: string;
}

function generatePixCode(payload: PixPayload): string {
    const { amount, description } = payload;

    const formatValue = (id: string, value: string | number): string => {
        const valueStr = String(value);
        const len = valueStr.length;
        const lenStr = len.toString().padStart(2, '0');
        return `${id}${lenStr}${valueStr}`;
    };

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0];

    const merchantAccount = formatValue('00', '01') + formatValue('11', PIX_KEY_TYPE === 'email' ? '02' : '01') + formatValue('12', PIX_KEY);
    const merchantCategory = formatValue('26', '0000');
    const currency = formatValue('44', '986');
    const amountField = formatValue('54', amount.toFixed(2));
    const countryCode = formatValue('58', 'BR');
    const txId = formatValue('62', '***') + formatValue('05', timestamp);

    const descriptionField = description
        ? formatValue('69', description.substring(0, 99))
        : formatValue('69', 'Foodie App Pedido');

    const gui = formatValue('00', 'BR.GOV.BCB.PIX');
    const payloadFormat = formatValue('01', '01');
    const merchantName = formatValue('59', 'Foodie App');
    const merchantCity = formatValue('60', 'SAO PAULO');

    const payloadString =
        gui +
        payloadFormat +
        merchantAccount +
        merchantCategory +
        merchantName +
        merchantCity +
        currency +
        amountField +
        countryCode +
        txId +
        descriptionField;

    const crc16 = (data: string): string => {
        let crc = 0xFFFF;
        for (let i = 0; i < data.length; i++) {
            crc ^= data.charCodeAt(i);
            for (let j = 0; j < 8; j++) {
                crc = (crc >>> 1) ^ (crc & 1 ? 0xA001 : 0);
            }
        }
        return (crc ^ 0x0000).toString(16).toUpperCase().padStart(4, '0');
    };

    return payloadString + '6304' + crc16(payloadString + '6304');
}

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`payments:pix:${ip}`, RateLimitConfig.strict.limit, RateLimitConfig.strict.windowSeconds);
    if (!rate.success) return buildRateLimitResponse(rate);

    const { user, error: authError } = await getCurrentUser();
    if (authError || !user) {
        return NextResponse.json(
            { error: authError || 'Usuario nao autenticado' },
            { status: 401 }
        );
    }

    let body: { orderId?: string; customerEmail?: string } | null = null;

    try {
        const requestBody = await request.json();
        body = requestBody;
        const { orderId } = requestBody;

        const duplicate = await isDuplicateRequest(`pix:${orderId}`, 60);
        if (duplicate) {
            return NextResponse.json(
                { error: 'Pagamento Pix já está sendo processado para este pedido' },
                { status: 409 }
            );
        }

        const paymentContext = await getOrderPaymentContext(user.id, orderId);
        if (paymentContext.error || !paymentContext.data) {
            return NextResponse.json(
                { error: paymentContext.error || 'Pedido invalido' },
                { status: paymentContext.status || 400 }
            );
        }

        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        const pixPayload: PixPayload = {
            key: PIX_KEY,
            keyType: PIX_KEY_TYPE,
            amount: paymentContext.data.amount,
            description: paymentContext.data.description,
        };

        const qrCode = generatePixCode(pixPayload);

        return NextResponse.json({
            qrCode,
            pixKey: PIX_KEY,
            keyType: PIX_KEY_TYPE,
            amount: paymentContext.data.amount,
            transactionId: paymentContext.data.orderId,
            expiresAt: expiresAt.toISOString(),
            instructions: [
                'Abra o app do seu banco',
                'Escolha pagar via Pix',
                'Escaneie o QR Code ou copie a chave',
                'O pagamento será confirmado automaticamente',
            ],
        });
    } catch (error) {
        logger.error('Error generating Pix payment', error instanceof Error ? error : new Error(String(error)), {
            route: '/api/payments/pix',
            orderId: body?.orderId,
        });
        captureException(error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Failed to generate Pix payment' },
            { status: 500 }
        );
    }
}
