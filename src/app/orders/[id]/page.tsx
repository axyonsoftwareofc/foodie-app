// src/app/orders/[id]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById } from '@/actions/orders';
import type { OrderData } from '@/actions/orders';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils/format.utils';
import { ORDER_STATUS_CONFIG } from '@/lib/constants/order.constants';
import { ArrowLeft, Clock, MapPin, Phone, Receipt, Store, User, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import LiveTracker from '@/components/delivery/LiveTracker';
import PixQRCode from '@/components/checkout/PixQRCode';
import { CancelOrderModal } from '@/components/orders/CancelOrderModal';
import { createPixPayment } from '@/actions/payments';
import type { PixPaymentDetails } from '@/types/payment.types';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, clearCart, items: cartItems, restaurantId: cartRestaurantId } = useCart();
  const [pixDetails, setPixDetails] = useState<PixPaymentDetails | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reorderModalOpen, setReorderModalOpen] = useState(false);

  const orderId = params.id as string;

  const loadOrder = useCallback(async () => {
    try {
      const result = await getOrderById(orderId);
      if (result.error || !result.data) {
        toast.error(result.error || 'Pedido não encontrado');
        router.push('/orders');
        return;
      }
      setOrder(result.data);
    } catch {
      toast.error('Erro ao carregar pedido');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (order && order.paymentMethod === 'PIX' && order.status === 'PENDING') {
      setIsGeneratingPix(true);
      createPixPayment(order.id).then((result) => {
        if (result.data) setPixDetails(result.data);
        if (result.error) toast.error(result.error);
        setIsGeneratingPix(false);
      });
    }
  }, [order]);

  const handleGeneratePix = () => {
    if (!order) return;
    setIsGeneratingPix(true);
    createPixPayment(order.id).then((result) => {
      if (result.data) setPixDetails(result.data);
      if (result.error) toast.error(result.error);
      setIsGeneratingPix(false);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#00A082] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const handleReorder = () => {
    if (!order) return;

    if (cartRestaurantId && cartRestaurantId !== order.restaurantId && cartItems.length > 0) {
      setReorderModalOpen(true);
      return;
    }

    doReorder();
  };

  const doReorder = () => {
    if (!order) return;
    clearCart();
    order.items.forEach((item) => {
      addItem(
        {
          id: item.menuItemId,
          name: item.menuItemName,
          description: '',
          price: item.menuItemPrice,
          image: item.menuItemImage,
          category: '',
          restaurantId: order.restaurantId,
        },
        item.quantity,
        item.observation
      );
    });

    toast.success('Itens adicionados ao carrinho!');
    router.push('/checkout');
  };

  const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
    label: order.status,
    color: '#999',
    bgColor: '#f3f3f3',
    icon: '📋',
  };

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      {/* Header */}
      <div
        className="border-b sticky top-0 z-10"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full transition-colors"
              style={{ backgroundColor: 'var(--color-bg-hover)' }}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                Pedido #{String(order.id).slice(-4).toUpperCase()}
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {formattedDate}
              </p>
            </div>
            <div
              className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.color,
              }}
            >
              {statusConfig.icon} {statusConfig.label}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Status Timeline */}
        <div
          className="rounded-xl p-6 shadow-sm"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} />
            Status do Pedido
          </h2>

          <div className="relative">
            {/* Timeline */}
            <div className="space-y-4">
              <TimelineItem
                label="Pedido Realizado"
                time={order.createdAt}
                active={true}
                icon="🛒"
              />

              <TimelineItem
                label="Confirmado"
                time={order.preparationStartedAt}
                active={order.status !== 'PENDING'}
                icon="✅"
              />

              <TimelineItem
                label="Em Preparo"
                time={order.preparationStartedAt}
                active={
                  order.status === 'PREPARING' ||
                  order.status === 'READY' ||
                  order.status === 'DELIVERED'
                }
                icon="👨‍🍳"
              />

              <TimelineItem
                label="Pronto"
                time={order.readyAt}
                active={order.status === 'READY' || order.status === 'DELIVERED'}
                icon="📦"
              />

              {order.orderType === 'DELIVERY' && (
                <TimelineItem
                  label="Saiu para Entrega"
                  time={order.deliveredAt}
                  active={order.status === 'DELIVERING'}
                  icon="🛵"
                />
              )}

              <TimelineItem
                label={order.orderType === 'DELIVERY' ? 'Entregue' : 'Finalizado'}
                time={order.deliveredAt}
                active={order.status === 'DELIVERED'}
                icon="🎉"
              />
            </div>
          </div>

          {order.estimatedPreparationTime && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                ⏱️ Tempo estimado: {order.estimatedPreparationTime} minutos
              </p>
            </div>
          )}
        </div>

        {/* Restaurant Info */}
        <div
          className="rounded-xl p-6 shadow-sm"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <h2
            className="font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--color-text)' }}
          >
            <Store size={18} />
            Restaurante
          </h2>
          <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
            {order.restaurantName}
          </p>
        </div>

        {/* Delivery Address */}
        {order.orderType === 'DELIVERY' && order.address && (
          <div
            className="rounded-xl p-6 shadow-sm"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
          >
            <h2
              className="font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--color-text)' }}
            >
              <MapPin size={18} />
              Endereço de Entrega
            </h2>
            <div className="space-y-1">
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                {order.customerName}
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {order.address.street}, {order.address.number}
                {order.address.complement && ` - ${order.address.complement}`}
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {order.address.neighborhood} - {order.address.city}/{order.address.state}
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }}>CEP: {order.address.zipCode}</p>
            </div>
          </div>
        )}

        {/* Pickup/Dine-in Info */}
        {order.orderType === 'PICKUP' && (
          <div
            className="rounded-xl p-6 shadow-sm"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
          >
            <h2
              className="font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--color-text)' }}
            >
              <Store size={18} />
              Retirada no Local
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Dirija-se ao restaurante para retirar seu pedido
            </p>
          </div>
        )}

        {order.orderType === 'DINE_IN' && order.tableNumber && (
          <div
            className="rounded-xl p-6 shadow-sm"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
          >
            <h2
              className="font-semibold mb-4 flex items-center gap-2"
              style={{ color: 'var(--color-text)' }}
            >
              <User size={18} />
              Consumo no Local
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Mesa:{' '}
              <span className="font-bold" style={{ color: 'var(--color-text)' }}>
                {order.tableNumber}
              </span>
            </p>
          </div>
        )}

        {/* Live Tracker - Apenas para Delivery em andamento ou entregando */}
        {order.orderType === 'DELIVERY' && ['READY', 'DELIVERING'].includes(order.status) && (
          <LiveTracker orderId={order.id} />
        )}

        {/* Customer Info */}
        <div
          className="rounded-xl p-6 shadow-sm"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <h2
            className="font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--color-text)' }}
          >
            <Phone size={18} />
            Informações de Contato
          </h2>
          <div className="space-y-2">
            <p>
              <span style={{ color: 'var(--color-text-secondary)' }}>Nome:</span>{' '}
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                {order.customerName}
              </span>
            </p>
            {order.customerPhone && (
              <p>
                <span style={{ color: 'var(--color-text-secondary)' }}>Telefone:</span>{' '}
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {order.customerPhone}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Items */}
        <div
          className="rounded-xl p-6 shadow-sm"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <h2
            className="font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--color-text)' }}
          >
            <Receipt size={18} />
            Itens do Pedido
          </h2>

          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-start py-2 border-b last:border-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <span
                      className="font-medium min-w-[2rem]"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {item.quantity}x
                    </span>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {item.menuItemName}
                      </p>
                      {item.observation && (
                        <p
                          className="text-sm mt-0.5"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          Obs: {item.observation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {formatPrice(item.menuItemPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div
          className="rounded-xl p-6 shadow-sm"
          style={{ backgroundColor: 'var(--color-bg-card)' }}
        >
          <h2
            className="font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--color-text)' }}
          >
            <CreditCard size={18} />
            Pagamento
          </h2>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
              <span style={{ color: 'var(--color-text)' }}>{formatPrice(order.subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-secondary)' }}>Taxa de Entrega</span>
              <span style={{ color: 'var(--color-text)' }}>{formatPrice(order.deliveryFee)}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto {order.couponCode && `(${order.couponCode})`}</span>
                <span>- {formatPrice(order.discount)}</span>
              </div>
            )}

            <div
              className="flex justify-between font-bold text-lg pt-2 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span style={{ color: 'var(--color-text)' }}>Total</span>
              <span style={{ color: 'var(--color-text)' }}>{formatPrice(order.total)}</span>
            </div>

            <div className="pt-2">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Método:{' '}
                <span className="font-medium capitalize" style={{ color: 'var(--color-text)' }}>
                  {order.paymentMethod === 'pix_manual'
                    ? 'PIX'
                    : order.paymentMethod === 'cash'
                      ? 'Dinheiro'
                      : order.paymentMethod}
                </span>
              </p>
              {order.changeFor && (
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Troco para: {formatPrice(order.changeFor)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pix QR Code - para pedidos PIX pendentes */}
        {order.paymentMethod === 'PIX' && order.status === 'PENDING' && (
          <div
            className="rounded-xl p-6 shadow-sm"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
          >
            <h2 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              Pagamento Pix
            </h2>
            <PixQRCode
              pixDetails={pixDetails}
              amount={order.total}
              onGenerateNew={handleGeneratePix}
              isGenerating={isGeneratingPix}
            />
            {pixDetails && (
              <p className="text-xs text-gray-400 text-center mt-3">
                Apos o pagamento, seu pedido sera confirmado automaticamente
              </p>
            )}
          </div>
        )}

        {/* Cancel Button */}
        {['PENDING', 'CONFIRMED'].includes(order.status) && (
          <>
            <button
              onClick={() => setCancelOpen(true)}
              className="w-full py-3 text-red-600 font-medium border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              Cancelar Pedido
            </button>
            <CancelOrderModal
              orderId={order.id}
              isOpen={cancelOpen}
              onClose={() => setCancelOpen(false)}
              onCancelled={loadOrder}
            />
          </>
        )}

        {/* Pedir Novamente */}
        {['DELIVERED', 'CANCELLED'].includes(order.status) && (
          <button
            onClick={handleReorder}
            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            🛒 Pedir Novamente
          </button>
        )}

        {/* Reorder Confirmation Modal */}
        {reorderModalOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setReorderModalOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto rounded-2xl p-6 shadow-xl"
              style={{ backgroundColor: 'var(--color-bg-card)' }}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                Limpar carrinho?
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Seu carrinho tem itens de outro restaurante. Deseja limpar e pedir novamente?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setReorderModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text)',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setReorderModalOpen(false);
                    doReorder();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  time,
  active,
  icon,
}: {
  label: string;
  time: string | null;
  active: boolean;
  icon: string;
}) {
  const formattedTime = time
    ? new Date(time).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-lg
                ${active ? 'bg-[#00A082] text-white' : 'bg-gray-200 text-gray-400'}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
        {active && formattedTime && <p className="text-sm text-gray-500">{formattedTime}</p>}
      </div>
    </div>
  );
}
