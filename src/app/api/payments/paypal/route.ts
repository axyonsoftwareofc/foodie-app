// src/app/api/payments/paypal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/authz';
import { getOrderPaymentContext } from '@/lib/payments/order-payment';
import {
  checkRateLimit,
  getClientIp,
  RateLimitConfig,
  buildRateLimitResponse,
} from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/sentry';
import { z } from 'zod';

const paypalCreateSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  customerEmail: z.string().email().optional(),
});

const paypalCaptureSchema = z.object({
  orderId: z.string().min(1),
  appOrderId: z.string().min(1).optional(),
});

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

const PAYPAL_BASE_URL =
  PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

interface CreateOrderRequest {
  amount: number;
  orderId: string;
  description: string;
  customerEmail?: string;
}

interface CaptureOrderRequest {
  orderId: string;
  appOrderId?: string;
}

interface PayPalLink {
  rel: string;
  href: string;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `payments:paypal:${ip}`,
    RateLimitConfig.strict.limit,
    RateLimitConfig.strict.windowSeconds,
    true
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  const { user, error: authError } = await getCurrentUser();
  if (authError || !user) {
    return NextResponse.json({ error: authError || 'Usuario nao autenticado' }, { status: 401 });
  }

  try {
    const rawBody = await request.json();
    const parseResult = paypalCreateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }
    const body = parseResult.data;
    const { orderId } = body;

    const paymentContext = await getOrderPaymentContext(user.id, orderId);
    if (paymentContext.error || !paymentContext.data) {
      return NextResponse.json(
        { error: paymentContext.error || 'Pedido invalido' },
        { status: paymentContext.status || 400 }
      );
    }

    const accessToken = await getAccessToken();

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: paymentContext.data.orderId,
          description: paymentContext.data.description,
          amount: {
            currency_code: 'BRL',
            value: paymentContext.data.amount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'Foodie App',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${paymentContext.data.orderId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?cancelled=true`,
      },
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderData),
    });

    const orderResult = (await response.json()) as {
      id?: string;
      status?: string;
      links?: PayPalLink[];
      message?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        { error: orderResult.message || 'Failed to create order' },
        { status: 400 }
      );
    }

    const approveLink = orderResult.links?.find((link) => link.rel === 'approve');

    return NextResponse.json({
      id: orderResult.id,
      status: orderResult.status,
      approveUrl: approveLink?.href,
      links: orderResult.links,
    });
  } catch (error) {
    logger.error(
      'PayPal create order error',
      error instanceof Error ? error : new Error(String(error)),
      {
        route: '/api/payments/paypal',
      }
    );
    captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `payments:paypal:put:${ip}`,
    RateLimitConfig.strict.limit,
    RateLimitConfig.strict.windowSeconds,
    true
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  const { user, error: authError } = await getCurrentUser();
  if (authError || !user) {
    return NextResponse.json({ error: authError || 'Usuario nao autenticado' }, { status: 401 });
  }

  try {
    const rawBody = await request.json();
    const parseResult = paypalCaptureSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }
    const body = parseResult.data;
    const { orderId, appOrderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const paymentContext = await getOrderPaymentContext(user.id, appOrderId || '');
    if (paymentContext.error) {
      return NextResponse.json(
        { error: paymentContext.error },
        { status: paymentContext.status || 400 }
      );
    }

    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const captureResult = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: captureResult.message || 'Failed to capture payment' },
        { status: 400 }
      );
    }

    const purchaseUnit = captureResult.purchase_units?.[0];
    const payments = purchaseUnit?.payments?.captures?.[0];

    return NextResponse.json({
      id: captureResult.id,
      status: captureResult.status,
      transactionId: payments?.id,
      amount: payments?.amount?.value,
      currency: payments?.amount?.currency_code,
      finalCapture: captureResult.final_capture,
      createTime: captureResult.create_time,
      updateTime: captureResult.update_time,
    });
  } catch (error) {
    logger.error(
      'PayPal capture error',
      error instanceof Error ? error : new Error(String(error)),
      {
        route: '/api/payments/paypal',
      }
    );
    captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to capture PayPal payment' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(
    `payments:paypal:get:${ip}`,
    RateLimitConfig.strict.limit,
    RateLimitConfig.strict.windowSeconds,
    true
  );
  if (!rate.success) return buildRateLimitResponse(rate);

  const { user, error: authError } = await getCurrentUser();
  if (authError || !user) {
    return NextResponse.json({ error: authError || 'Usuario nao autenticado' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('orderId');
  const appOrderId = searchParams.get('appOrderId');

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  const paymentContext = await getOrderPaymentContext(user.id, appOrderId || '');
  if (paymentContext.error) {
    return NextResponse.json(
      { error: paymentContext.error },
      { status: paymentContext.status || 400 }
    );
  }

  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const orderResult = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: orderResult.message || 'Failed to get order' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: orderResult.id,
      status: orderResult.status,
      intent: orderResult.intent,
      purchaseUnits: orderResult.purchase_units,
    });
  } catch (error) {
    logger.error(
      'PayPal get order error',
      error instanceof Error ? error : new Error(String(error)),
      {
        route: '/api/payments/paypal',
      }
    );
    captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to get PayPal order' }, { status: 500 });
  }
}
