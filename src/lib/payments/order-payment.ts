import { prisma } from '@/lib/prisma'

type PaymentOrderItem = {
    menuItemName?: string
    menuItemPrice?: number
    quantity?: number
}

export type OrderPaymentContext = {
    orderId: string
    restaurantId: string
    restaurantName: string
    amount: number
    description: string
    items: {
        name: string
        quantity: number
        price: number
    }[]
}

function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100
}

function parseItems(items: unknown): PaymentOrderItem[] {
    if (Array.isArray(items)) return items as PaymentOrderItem[]
    if (typeof items === 'string') {
        try {
            const parsed = JSON.parse(items)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }
    return []
}

export async function getOrderPaymentContext(
    userId: string,
    orderId: string
): Promise<{ data?: OrderPaymentContext; error?: string; status?: number }> {
    if (!orderId || orderId === 'pending-order') {
        return { error: 'Pedido valido e obrigatorio para pagamento', status: 400 }
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    is_active: true,
                },
            },
        },
    })

    if (!order) {
        return { error: 'Pedido nao encontrado', status: 404 }
    }

    if (order.customer_id !== userId) {
        return { error: 'Nao autorizado', status: 403 }
    }

    if (!order.restaurant?.is_active) {
        return { error: 'Restaurante inativo', status: 400 }
    }

    if (order.status === 'CANCELLED') {
        return { error: 'Pedido cancelado nao pode ser pago', status: 400 }
    }

    const amount = roundMoney(order.total)
    if (!Number.isFinite(amount) || amount <= 0) {
        return { error: 'Valor do pedido invalido', status: 400 }
    }

    const items = parseItems(order.items).map((item) => ({
        name: item.menuItemName || 'Item',
        quantity: Number(item.quantity || 0),
        price: roundMoney(Number(item.menuItemPrice || 0)),
    })).filter((item) => item.quantity > 0 && item.price >= 0)

    return {
        data: {
            orderId: order.id,
            restaurantId: order.restaurant.id,
            restaurantName: order.restaurant.name,
            amount,
            description: `Pedido Foodie #${order.id}`,
            items,
        },
    }
}
