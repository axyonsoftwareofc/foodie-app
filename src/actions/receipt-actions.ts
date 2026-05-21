// src/actions/receipt-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { ReceiptData, ReceiptItem, ReceiptAddress } from '@/types/payment.types'
import type { PaymentMethod } from '@/types/payment.types'

type ReceiptOrderItem = {
    menuItemName: string
    menuItemPrice: number
    quantity: number
    observation?: string
}

export async function generateReceipt(orderId: string): Promise<{ data?: ReceiptData; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { error: 'Usuario nao autenticado' }
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { restaurant: { select: { name: true, cnpj: true, user_id: true } } },
        })

        if (!order) {
            return { error: 'Pedido nao encontrado' }
        }

        const isCustomer = order.customer_id === user.id
        const isRestaurantOwner = order.restaurant?.user_id === user.id
        if (!isCustomer && !isRestaurantOwner) {
            return { error: 'Nao autorizado' }
        }

        let userName = 'Cliente'
        let userEmail = ''

        const profile = await prisma.profile.findUnique({
            where: { id: user.id },
            select: { full_name: true, email: true },
        })

        if (profile) {
            userName = profile.full_name || 'Cliente'
            userEmail = profile.email || ''
        }

        const orderItems = Array.isArray(order.items) ? order.items as ReceiptOrderItem[] : []
        const items: ReceiptItem[] = orderItems.map((item) => ({
            name: item.menuItemName,
            quantity: item.quantity,
            unitPrice: item.menuItemPrice,
            totalPrice: item.menuItemPrice * item.quantity,
            observation: item.observation,
        }))

        const deliveryAddr = order.delivery_address
        let parsedAddr: Record<string, string> = {}
        if (typeof deliveryAddr === 'string') {
            try { parsedAddr = JSON.parse(deliveryAddr) } catch { /* ignore */ }
        } else if (deliveryAddr && typeof deliveryAddr === 'object') {
            parsedAddr = deliveryAddr as Record<string, string>
        }

        const address: ReceiptAddress = {
            street: parsedAddr.street || '',
            number: parsedAddr.number || '',
            complement: parsedAddr.complement,
            neighborhood: parsedAddr.neighborhood || '',
            city: parsedAddr.city || '',
            state: parsedAddr.state || '',
            zipCode: parsedAddr.zipCode || '',
        }

        const receipt: ReceiptData = {
            id: `RCP-${orderId.substring(0, 8).toUpperCase()}`,
            orderId: order.id,
            customerName: userName,
            customerEmail: userEmail,
            items,
            subtotal: order.subtotal ?? 0,
            deliveryFee: order.delivery_fee ?? 0,
            discount: order.discount ?? 0,
            total: order.total,
            paymentMethod: (order.payment_method as PaymentMethod) || 'CASH' as PaymentMethod,
            paymentGateway: undefined,
            transactionId: undefined,
            address,
            restaurantName: order.restaurant?.name || 'Restaurante',
            restaurantCNPJ: order.restaurant?.cnpj || undefined,
            issuedAt: new Date().toISOString(),
            status: order.status === 'DELIVERED' ? 'PAID' : 'PENDING',
        }

        return { data: receipt }
    } catch (error) {
        console.error('Error generating receipt:', error)
        return { error: 'Erro ao gerar recibo' }
    }
}

export async function getReceiptByOrder(orderId: string): Promise<{ data?: ReceiptData; error?: string }> {
    return generateReceipt(orderId)
}

export async function sendReceiptByEmail(
    receiptId: string,
    email: string,
    orderId: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        const receipt = await generateReceipt(orderId)
        if (receipt.error || !receipt.data) {
            return { error: receipt.error || 'Recibo nao encontrado' }
        }

        if (receipt.data.id !== receiptId) {
            return { error: 'Recibo nao pertence ao pedido informado' }
        }

        return { success: true }
    } catch (error) {
        console.error('Error sending receipt:', error)
        return { error: 'Erro ao enviar recibo por e-mail' }
    }
}
