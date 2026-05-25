// src/lib/payments/webhook-order-update.ts
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import { logger } from '@/lib/logger'
import { captureException } from '@/lib/sentry'

export type PaymentProvider = 'STRIPE' | 'MERCADOPAGO' | 'PIX' | 'PAYPAL' | 'UNKNOWN'

interface UpdateOrderByPaymentInput {
    orderId: string
    provider: PaymentProvider
    paymentStatus: 'succeeded' | 'failed' | 'pending' | 'cancelled'
    paymentIntentId?: string
    gatewayPaymentId?: string
}

const STATUS_MAP: Record<string, OrderStatus> = {
    succeeded: OrderStatus.CONFIRMED,
    failed: OrderStatus.CANCELLED,
    pending: OrderStatus.PENDING,
    cancelled: OrderStatus.CANCELLED,
}

export async function updateOrderStatusByPayment({
    orderId,
    provider,
    paymentStatus,
    paymentIntentId,
    gatewayPaymentId,
}: UpdateOrderByPaymentInput): Promise<{ success: boolean; error?: string }> {
    if (!orderId) {
        return { success: false, error: 'orderId is required' }
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, status: true, restaurant_id: true },
        })

        if (!order) {
            logger.warn('Webhook tried to update non-existent order', { orderId, provider })
            return { success: false, error: 'Order not found' }
        }

        const finalStatus = STATUS_MAP[paymentStatus]
        if (!finalStatus) {
            return { success: false, error: `Unknown payment status: ${paymentStatus}` }
        }

        const isTerminal = ['DELIVERED', 'CANCELLED'].includes(order.status)
        if (isTerminal) {
            logger.info('Webhook ignored: order already in terminal status', {
                orderId,
                currentStatus: order.status,
                attemptedStatus: finalStatus,
            })
            return { success: true }
        }

        const updateData: Parameters<typeof prisma.order.update>[0]['data'] = {
            status: finalStatus,
            payment_provider: provider,
            payment_status: paymentStatus,
            updated_at: new Date(),
        }

        if (paymentIntentId) {
            updateData.payment_intent_id = paymentIntentId
        }

        if (finalStatus === OrderStatus.CONFIRMED) {
            updateData.confirmed_at = new Date()
        } else if (finalStatus === OrderStatus.CANCELLED) {
            updateData.cancelled_at = new Date()
            updateData.cancel_reason = `Pagamento ${paymentStatus} via ${provider}`
        }

        await prisma.order.update({
            where: { id: orderId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
            data: updateData,
        })

        logger.info('Order updated by webhook', {
            orderId,
            provider,
            fromStatus: order.status,
            toStatus: finalStatus,
            gatewayPaymentId,
        })

        return { success: true }
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Failed to update order by webhook', err, { orderId, provider })
        captureException(err)
        return { success: false, error: err.message }
    }
}
