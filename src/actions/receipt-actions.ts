// src/actions/receipt-actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ReceiptData, ReceiptItem, ReceiptAddress } from '@/types/payment.types';

type ReceiptOrderItem = {
    menuItemName: string;
    menuItemPrice: number;
    quantity: number;
    observation?: string;
};

export async function generateReceipt(orderId: string): Promise<{ data?: ReceiptData; error?: string }> {
    try {
        const supabase = await createClient();

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return { error: 'Pedido não encontrado' };
        }

        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('name, cnpj, address, user_id')
            .eq('id', order.restaurant_id)
            .single();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { error: 'Usuário não autenticado' };
        }

        const isCustomer = order.customer_id === user.id;
        const isRestaurantOwner = restaurant?.user_id === user.id;
        if (!isCustomer && !isRestaurantOwner) {
            return { error: 'Não autorizado' };
        }

        let userName = 'Cliente';
        let userEmail = '';

        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', user.id)
                .single();

            if (profile) {
                userName = profile.full_name || 'Cliente';
                userEmail = profile.email || '';
            }
        }

        const orderItems = Array.isArray(order.items) ? order.items as ReceiptOrderItem[] : [];
        const items: ReceiptItem[] = orderItems.map((item) => ({
            name: item.menuItemName,
            quantity: item.quantity,
            unitPrice: item.menuItemPrice,
            totalPrice: item.menuItemPrice * item.quantity,
            observation: item.observation,
        }));

        const address: ReceiptAddress = {
            street: order.address?.street || '',
            number: order.address?.number || '',
            complement: order.address?.complement,
            neighborhood: order.address?.neighborhood || '',
            city: order.address?.city || '',
            state: order.address?.state || '',
            zipCode: order.address?.zipCode || '',
        };

        let cnpj = restaurant?.cnpj || undefined

        if (!cnpj && order.restaurant_id) {
            const prismaRestaurant = await prisma.restaurant.findUnique({
                where: { id: order.restaurant_id },
                select: { cnpj: true },
            })
            cnpj = prismaRestaurant?.cnpj || undefined
        }

        const receipt: ReceiptData = {
            id: `RCP-${orderId.substring(0, 8).toUpperCase()}`,
            orderId: order.id,
            customerName: userName,
            customerEmail: userEmail,
            items,
            subtotal: order.subtotal,
            deliveryFee: order.delivery_fee,
            discount: order.discount || 0,
            total: order.total,
            paymentMethod: order.payment_method,
            paymentGateway: order.payment_gateway,
            transactionId: order.transaction_id,
            address,
            restaurantName: restaurant?.name || 'Restaurante',
            restaurantCNPJ: cnpj,
            issuedAt: new Date().toISOString(),
            status: order.status === 'DELIVERED' ? 'PAID' : 'PENDING',
        };

        return { data: receipt };
    } catch (error) {
        console.error('Error generating receipt:', error);
        return { error: 'Erro ao gerar recibo' };
    }
}

export async function getReceiptByOrder(orderId: string): Promise<{ data?: ReceiptData; error?: string }> {
    return generateReceipt(orderId);
}

export async function sendReceiptByEmail(
    receiptId: string,
    email: string,
    orderId: string
): Promise<{ success?: boolean; error?: string }> {
    try {
        const receipt = await generateReceipt(orderId);
        if (receipt.error || !receipt.data) {
            return { error: receipt.error || 'Recibo nao encontrado' };
        }

        if (receipt.data.id !== receiptId) {
            return { error: 'Recibo nao pertence ao pedido informado' };
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('receipts')
            .insert({
                receipt_id: receiptId,
                email_sent_to: email,
                sent_at: new Date().toISOString(),
            });

        if (error) {
            return { error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Error sending receipt:', error);
        return { error: 'Erro ao enviar recibo por e-mail' };
    }
}
