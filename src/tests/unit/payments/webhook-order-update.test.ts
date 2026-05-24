// src/tests/unit/payments/webhook-order-update.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateOrderStatusByPayment } from '@/lib/payments/webhook-order-update'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

vi.mock('@/lib/prisma', () => ({
    prisma: {
        order: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}))

vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}))

vi.mock('@/lib/sentry', () => ({
    captureException: vi.fn(),
}))

describe('updateOrderStatusByPayment', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('retorna erro quando orderId esta ausente', async () => {
        const result = await updateOrderStatusByPayment({
            orderId: '',
            provider: 'STRIPE',
            paymentStatus: 'succeeded',
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('orderId is required')
        expect(prisma.order.findUnique).not.toHaveBeenCalled()
    })

    it('retorna erro quando pedido nao existe', async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValueOnce(null)

        const result = await updateOrderStatusByPayment({
            orderId: 'order-123',
            provider: 'STRIPE',
            paymentStatus: 'succeeded',
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Order not found')
    })

    it('retorna erro para status de pagamento desconhecido', async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
            id: 'order-123',
            status: OrderStatus.PENDING,
            restaurant_id: 'rest-1',
        })

        const result = await updateOrderStatusByPayment({
            orderId: 'order-123',
            provider: 'STRIPE',
            paymentStatus: 'unknown_status' as 'succeeded',
        })

        expect(result.success).toBe(false)
        expect(result.error).toContain('Unknown payment status')
    })

    it('ignora atualizacao quando pedido ja esta DELIVERED (status terminal)', async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
            id: 'order-123',
            status: OrderStatus.DELIVERED,
            restaurant_id: 'rest-1',
        })

        const result = await updateOrderStatusByPayment({
            orderId: 'order-123',
            provider: 'STRIPE',
            paymentStatus: 'cancelled',
        })

        expect(result.success).toBe(true)
        expect(prisma.order.update).not.toHaveBeenCalled()
    })

    it('ignora atualizacao quando pedido ja esta CANCELLED (status terminal)', async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
            id: 'order-123',
            status: OrderStatus.CANCELLED,
            restaurant_id: 'rest-1',
        })

        const result = await updateOrderStatusByPayment({
            orderId: 'order-123',
            provider: 'MERCADOPAGO',
            paymentStatus: 'succeeded',
        })

        expect(result.success).toBe(true)
        expect(prisma.order.update).not.toHaveBeenCalled()
    })

    it('atualiza para CONFIRMED quando pagamento succeeded', async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
            id: 'order-123',
            status: OrderStatus.PENDING,
            restaurant_id: 'rest-1',
        })
        vi.mocked(prisma.order.update).mockResolvedValueOnce({
            id: 'order-123',
            status: OrderStatus.CONFIRMED,
        } as never)

        const result = await updateOrderStatusByPayment({
            orderId: 'order-123',
            provider: 'STRIPE',
            paymentStatus: 'succeeded',
            paymentIntentId: 'pi_abc',
            gatewayPaymentId: 'pay_123',
        })

        expect(result.success).toBe(true)
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-123' },
            data: expect.objectContaining({
                status: OrderStatus.CONFIRMED,
                payment_provider: 'STRIPE',
                payment_status: 'succeeded',
                payment_intent_id: 'pi_abc',
                confirmed_at: expect.any(Date),
            }),
        })
    })

    it('atualiza para CANCELLED quando pagamento failed', async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
            id: 'order-123',
            status: OrderStatus.PENDING,
            restaurant_id: 'rest-1',
        })
        vi.mocked(prisma.order.update).mockResolvedValueOnce({
            id: 'order-123',
            status: OrderStatus.CANCELLED,
        } as never)

        const result = await updateOrderStatusByPayment({
            orderId: 'order-123',
            provider: 'PIX',
            paymentStatus: 'failed',
        })

        expect(result.success).toBe(true)
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-123' },
            data: expect.objectContaining({
                status: OrderStatus.CANCELLED,
                payment_provider: 'PIX',
                payment_status: 'failed',
                cancelled_at: expect.any(Date),
                cancel_reason: 'Pagamento failed via PIX',
            }),
        })
    })

    it('atualiza para CANCELLED quando pagamento cancelled', async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
            id: 'order-123',
            status: OrderStatus.PENDING,
            restaurant_id: 'rest-1',
        })
        vi.mocked(prisma.order.update).mockResolvedValueOnce({
            id: 'order-123',
            status: OrderStatus.CANCELLED,
        } as never)

        const result = await updateOrderStatusByPayment({
            orderId: 'order-123',
            provider: 'MERCADOPAGO',
            paymentStatus: 'cancelled',
        })

        expect(result.success).toBe(true)
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-123' },
            data: expect.objectContaining({
                status: OrderStatus.CANCELLED,
                cancel_reason: 'Pagamento cancelled via MERCADOPAGO',
            }),
        })
    })

    it('atualiza para PENDING quando pagamento pending', async () => {
        vi.mocked(prisma.order.findUnique).mockResolvedValueOnce({
            id: 'order-123',
            status: OrderStatus.PENDING,
            restaurant_id: 'rest-1',
        })
        vi.mocked(prisma.order.update).mockResolvedValueOnce({
            id: 'order-123',
            status: OrderStatus.PENDING,
        } as never)

        const result = await updateOrderStatusByPayment({
            orderId: 'order-123',
            provider: 'PAYPAL',
            paymentStatus: 'pending',
        })

        expect(result.success).toBe(true)
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-123' },
            data: expect.objectContaining({
                status: OrderStatus.PENDING,
                payment_provider: 'PAYPAL',
                payment_status: 'pending',
            }),
        })
    })

    it('lida com erro do banco de dados sem crashar', async () => {
        vi.mocked(prisma.order.findUnique).mockRejectedValueOnce(
            new Error('Connection lost')
        )

        const result = await updateOrderStatusByPayment({
            orderId: 'order-123',
            provider: 'STRIPE',
            paymentStatus: 'succeeded',
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Connection lost')
    })
})
