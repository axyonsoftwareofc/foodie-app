// src/app/api/payments/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authz';
import { getOrderPaymentContext } from '@/lib/payments/order-payment';
import { checkRateLimit, getClientIp, RateLimitConfig, buildRateLimitResponse } from '@/lib/rate-limit';

const FEATURE_ENABLED = process.env.ENABLE_MERCADOPAGO_PAYMENTS === 'true'; // ✅ FEATURE FLAG

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
const MERCADOPAGO_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.mercadopago.com'
    : 'https://api.mercadopago.com';

interface PaymentRequest {
    amount: number;
    email: string;
    name: string;
    document?: string;
    orderId: string;
    items: { name: string; quantity: number; price: number }[];
    paymentMethod: 'pix' | 'credit_card' | 'debit_card' | 'bolbradesco';
    cardToken?: string;
    installments?: number;
}

interface MercadoPagoPaymentPayload {
    transaction_amount: number;
    description: string;
    payment_method_id: PaymentRequest['paymentMethod'];
    payer: {
        email: string;
        first_name: string;
        last_name: string;
    };
    external_reference: string;
    date_of_expiration?: string;
    token?: string;
    installments?: number;
    issuer_id?: string;
}

interface MercadoPagoPaymentResult {
    id?: string;
    status?: string;
    status_detail?: string;
    transaction_amount?: number;
    payment_method_id?: string;
    date_approved?: string;
    external_reference?: string;
    message?: string;
    point_of_interaction?: {
        transaction_data?: {
            qr_code?: string;
            qr_code_base64?: string;
        };
    };
    barcode?: string;
    digitable_line?: string;
    transaction_details?: {
        external_resource_url?: string;
    };
}

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`payments:mp:${ip}`, RateLimitConfig.strict.limit, RateLimitConfig.strict.windowSeconds);
    if (!rate.success) return buildRateLimitResponse(rate);

    // ✅ DESABILITADO NO MVP
    if (!FEATURE_ENABLED) {
        return NextResponse.json(
            {
                error: 'Mercado Pago payments are not enabled yet',
                message: 'This feature will be available in v5.0. Use manual PIX for now.'
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

    try {
        const body: PaymentRequest = await request.json();
        const { email, name, orderId, paymentMethod, cardToken, installments } = body;

        const paymentContext = await getOrderPaymentContext(user.id, orderId);
        if (paymentContext.error || !paymentContext.data) {
            return NextResponse.json(
                { error: paymentContext.error || 'Pedido invalido' },
                { status: paymentContext.status || 400 }
            );
        }

        const payerEmail = email || user.email;
        if (!payerEmail) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const payerFirstName = name?.split(' ')[0] || 'Cliente';
        const payerLastName = name?.split(' ').slice(1).join(' ') || '';

        const paymentData: MercadoPagoPaymentPayload = {
            transaction_amount: paymentContext.data.amount,
            description: paymentContext.data.description,
            payment_method_id: paymentMethod,
            payer: {
                email: payerEmail,
                first_name: payerFirstName,
                last_name: payerLastName,
            },
            external_reference: paymentContext.data.orderId,
        };

        if (paymentMethod === 'pix') {
            paymentData.payment_method_id = 'pix';
            paymentData.date_of_expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        }

        if ((paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && cardToken) {
            paymentData.token = cardToken;
            paymentData.installments = installments || 1;
            paymentData.issuer_id = undefined; // ✅ CORRIGIDO (era paymentDataissuer_id)
        }

        const response = await fetch(`${MERCADOPAGO_BASE_URL}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
                'X-Idempotency-Key': `mp-payment-${orderId}-${Date.now()}`,
            },
            body: JSON.stringify(paymentData),
        });

        const paymentResult = await response.json() as MercadoPagoPaymentResult;

        if (!response.ok) {
            return NextResponse.json(
                {
                    error: paymentResult.message || 'Payment failed',
                    details: paymentResult
                },
                { status: 400 }
            );
        }

        let pixData = null;
        if (paymentMethod === 'pix' && paymentResult.point_of_interaction?.transaction_data) {
            pixData = {
                qrCode: paymentResult.point_of_interaction.transaction_data.qr_code,
                qrCodeBase64: paymentResult.point_of_interaction.transaction_data.qr_code_base64,
            };
        }

        let boletoData = null;
        if (paymentMethod === 'bolbradesco' && paymentResult.barcode) {
            boletoData = {
                barcode: paymentResult.barcode,
                digitableLine: paymentResult.digitable_line,
                url: paymentResult.transaction_details?.external_resource_url,
            };
        }

        return NextResponse.json({
            id: paymentResult.id,
            status: paymentResult.status,
            statusDetail: paymentResult.status_detail,
            transactionAmount: paymentResult.transaction_amount,
            paymentMethodId: paymentResult.payment_method_id,
            dateApproved: paymentResult.date_approved,
            externalReference: paymentResult.external_reference,
            pix: pixData,
            boleto: boletoData,
        });
    } catch (error) {
        console.error('Mercado Pago error:', error);
        return NextResponse.json(
            { error: 'Failed to process payment' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    const ip = getClientIp(request);
    const rate = await checkRateLimit(`payments:mp:get:${ip}`, RateLimitConfig.strict.limit, RateLimitConfig.strict.windowSeconds);
    if (!rate.success) return buildRateLimitResponse(rate);

    if (!FEATURE_ENABLED) {
        return NextResponse.json(
            { error: 'Mercado Pago is not enabled' },
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

    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get('id');
    const appOrderId = searchParams.get('orderId');

    if (!paymentId) {
        return NextResponse.json(
            { error: 'Payment ID is required' },
            { status: 400 }
        );
    }

    const paymentContext = await getOrderPaymentContext(user.id, appOrderId || '');
    if (paymentContext.error) {
        return NextResponse.json(
            { error: paymentContext.error },
            { status: paymentContext.status || 400 }
        );
    }

    try {
        const response = await fetch(`${MERCADOPAGO_BASE_URL}/v1/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
            },
        });

        const paymentResult = await response.json() as MercadoPagoPaymentResult;

        if (!response.ok) {
            return NextResponse.json(
                { error: paymentResult.message || 'Failed to get payment' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            id: paymentResult.id,
            status: paymentResult.status,
            statusDetail: paymentResult.status_detail,
            transactionAmount: paymentResult.transaction_amount,
            dateApproved: paymentResult.date_approved,
        });
    } catch (error) {
        console.error('Mercado Pago error:', error);
        return NextResponse.json(
            { error: 'Failed to get payment status' },
            { status: 500 }
        );
    }
}
