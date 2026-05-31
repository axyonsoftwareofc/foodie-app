'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Phone, Truck, RefreshCw, Clock } from 'lucide-react';
import { getDeliveryByOrder } from '@/actions/delivery-actions';
import type { Delivery } from '@/types/delivery.types';

interface LiveTrackerProps {
  orderId: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#D97706' },
  ASSIGNED: { bg: '#DBEAFE', text: '#2563EB' },
  PICKED_UP: { bg: '#E0E7FF', text: '#4F46E5' },
  DELIVERING: { bg: '#D1FAE5', text: '#059669' },
  DELIVERED: { bg: '#D1FAE5', text: '#059669' },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando entregador',
  ASSIGNED: 'Entregador a caminho do restaurante',
  PICKED_UP: 'Pedido coletado',
  DELIVERING: 'A caminho da entrega',
  DELIVERED: 'Entregue',
};

export default function LiveTracker({ orderId }: LiveTrackerProps) {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const loadDelivery = useCallback(async () => {
    const result = await getDeliveryByOrder(orderId);
    if (result.data) {
      setDelivery(result.data);
    }
    setLastUpdate(new Date());
    setIsLoading(false);
  }, [orderId]);

  useEffect(() => {
    loadDelivery();
    const interval = setInterval(loadDelivery, 15000);
    return () => clearInterval(interval);
  }, [loadDelivery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="p-6 text-center rounded-2xl bg-white border border-gray-100">
        <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 text-sm">Aguardando atribuicao de entregador</p>
      </div>
    );
  }

  const colors = STATUS_COLORS[delivery.status] || { bg: '#F3F4F6', text: '#6B7280' };

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className="p-4 rounded-2xl" style={{ backgroundColor: colors.bg }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.text }}
          >
            {delivery.status === 'DELIVERED' ? (
              <Navigation className="w-5 h-5 text-white rotate-45" />
            ) : (
              <Truck className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: colors.text }}>
              {STATUS_LABELS[delivery.status]}
            </p>
            {delivery.estimatedDeliveryTime && delivery.status !== 'DELIVERED' && (
              <p
                className="text-xs mt-0.5 flex items-center gap-1"
                style={{ color: colors.text, opacity: 0.8 }}
              >
                <Clock className="w-3 h-3" />
                Previsao:{' '}
                {new Date(delivery.estimatedDeliveryTime).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
          <button onClick={loadDelivery} className="p-2 rounded-full bg-white/50">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Driver Card */}
      {delivery.driver && (
        <div className="p-4 rounded-2xl bg-white border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              {delivery.driver.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{delivery.driver.name}</p>
              <p className="text-sm text-gray-500">
                {delivery.driver.vehicleType === 'MOTO'
                  ? '🛵 Moto'
                  : delivery.driver.vehicleType === 'BIKE'
                    ? '🚲 Bicicleta'
                    : '🚗 Carro'}
                {delivery.driver.vehiclePlate && ` • ${delivery.driver.vehiclePlate}`}
              </p>
            </div>
            {delivery.driver.phone && (
              <a
                href={`tel:${delivery.driver.phone}`}
                className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center hover:bg-emerald-700 transition-colors"
              >
                <Phone className="w-5 h-5 text-white" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-48 rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #10B981 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <MapPin className="w-8 h-8 text-emerald-600 mb-2 relative z-10" />
        <p className="text-sm font-medium text-gray-700 relative z-10">
          {delivery.currentLocation ? 'Localizacao em tempo real' : 'Rastreamento ativo'}
        </p>
        <p className="text-xs text-gray-400 mt-1 relative z-10">
          Atualizado:{' '}
          {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Route */}
      <div className="p-4 rounded-2xl bg-white border border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Rota</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">RETIRADA</p>
              <p className="text-sm text-gray-700">
                {delivery.pickupAddress?.street}, {delivery.pickupAddress?.number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pl-3">
            <div className="w-px h-6 ml-3.5 bg-gray-200" />
            <span className="text-xs text-gray-400">{delivery.distanceKm} km</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">ENTREGA</p>
              <p className="text-sm text-gray-700">
                {delivery.deliveryAddress?.street}, {delivery.deliveryAddress?.number}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {delivery.timeline && delivery.timeline.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Historico</p>
          <div className="space-y-3">
            {delivery.timeline.map((entry, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-700 flex-1">
                  {STATUS_LABELS[entry.status] || entry.status}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(entry.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
