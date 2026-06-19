// src/app/(driver)/driver/page.tsx — APP DO ENTREGADOR
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Phone,
  Navigation,
  Clock,
  Truck,
  Power,
  PowerOff,
  DollarSign,
  Loader2,
  User,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils/format.utils';
import {
  getDriverDeliveriesForApp,
  getDriverByUserId,
  updateDriverLocation,
  updateDeliveryStatus,
  rejectDelivery,
  DriverDeliveryItem,
} from '@/actions/delivery-actions';

type DriverStatus = 'OFFLINE' | 'ONLINE' | 'BUSY';

type DriverDelivery = DriverDeliveryItem;

function DeliveryCard({
  delivery,
  onAction,
}: {
  delivery: DriverDelivery;
  onAction: (action: string) => void;
}) {
  const isAssigned = delivery.status === 'ASSIGNED';
  const isPickedUp = delivery.status === 'PICKED_UP';

  return (
    <div
      className="rounded-2xl border p-4 space-y-3 shadow-sm"
      style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
          #{delivery.orderId.slice(-4)}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isAssigned
              ? 'bg-blue-100 text-blue-700'
              : isPickedUp
                ? 'bg-purple-100 text-purple-700'
                : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isAssigned ? 'Aguardando coleta' : isPickedUp ? 'Coletado' : 'Em entrega'}
        </span>
      </div>

      {/* Route */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Retirada
            </p>
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
              {delivery.restaurantName}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {delivery.pickupAddress}
            </p>
          </div>
        </div>
        <div className="pl-2 border-l-2 border-dashed border-gray-200 ml-2 h-3" />
        <div className="flex items-start gap-2">
          <Navigation className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Entrega
            </p>
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
              {delivery.customerName}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {delivery.deliveryAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div
        className="flex items-center gap-4 text-xs"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {delivery.estimatedTime || '--'}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {delivery.distance || '--'} km
        </span>
        <span className="flex items-center gap-1 text-emerald-600 font-medium">
          <DollarSign className="w-3 h-3" /> {formatPrice(delivery.earnings)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {isAssigned && (
          <>
            <button
              onClick={() => onAction('accept')}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
            >
              ✅ Aceitar Entrega
            </button>
            <button
              onClick={() => onAction('reject')}
              className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium text-sm active:scale-95 transition-transform"
            >
              Recusar
            </button>
          </>
        )}
        {isPickedUp && (
          <>
            <a
              href={`tel:${delivery.customerPhone}`}
              className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl font-medium text-sm"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text)' }}
            >
              <Phone className="w-4 h-4" /> Ligar
            </a>
            <button
              onClick={() => onAction('navigate')}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
            >
              🧭 Navegar
            </button>
            <button
              onClick={() => onAction('complete')}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
            >
              🎉 Entregue
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function DriverPage() {
  const [status, setStatus] = useState<DriverStatus>('OFFLINE');
  const [isToggling, setIsToggling] = useState(false);
  const [deliveries, setDeliveries] = useState<DriverDelivery[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<DriverDelivery | null>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'deliveries' | 'earnings' | 'profile'>('deliveries');
  const [isLoading, setIsLoading] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const gpsWatchRef = useRef<number | null>(null);

  const fetchDeliveries = async () => {
    setIsLoading(true);
    const result = await getDriverDeliveriesForApp();
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setDeliveries(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    return () => {
      if (gpsWatchRef.current != null) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
      }
    };
  }, []);

  const startGpsTracking = () => {
    if (!('geolocation' in navigator)) {
      toast.error('GPS nao disponivel neste dispositivo');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setGpsEnabled(true),
      () => toast.error('Permita o acesso a localizacao para rastreamento'),
      { enableHighAccuracy: true, timeout: 10000 }
    );

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        setGpsEnabled(true);
        const { latitude, longitude } = pos.coords;
        try {
          if (driverId) {
            await updateDriverLocation(driverId, { latitude, longitude });
          }
        } catch {
          // Silencioso — atualizacao de GPS nao deve poluir a UI
        }
      },
      () => setGpsEnabled(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  const stopGpsTracking = () => {
    if (gpsWatchRef.current != null) {
      navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
    }
    setGpsEnabled(false);
  };

  const toggleStatus = async () => {
    setIsToggling(true);
    const newStatus: DriverStatus = status === 'OFFLINE' ? 'ONLINE' : 'OFFLINE';

    if (newStatus === 'ONLINE') {
      const driverResult = await getDriverByUserId('me');
      if (driverResult.data) {
        setDriverId(driverResult.data.id);
      }
      startGpsTracking();
    } else {
      stopGpsTracking();
      setDriverId(null);
    }

    setStatus(newStatus);
    toast.success(
      newStatus === 'ONLINE' ? 'Voce esta online! Aguardando pedidos...' : 'Voce esta offline'
    );
    setIsToggling(false);
  };

  const handleAction = async (delivery: DriverDelivery, action: string) => {
    switch (action) {
      case 'accept': {
        const result = await updateDeliveryStatus(delivery.id, 'PICKED_UP');
        if (result.error) {
          toast.error(result.error);
          return;
        }
        setActiveDelivery({ ...delivery, status: 'PICKED_UP' });
        setStatus('BUSY');
        toast.success('Entrega aceita! Va ate o restaurante.');
        await fetchDeliveries();
        break;
      }
      case 'reject': {
        const result = await rejectDelivery(delivery.id);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success('Entrega recusada.');
        await fetchDeliveries();
        break;
      }
      case 'navigate': {
        const dest = encodeURIComponent(delivery.deliveryAddress);
        window.open(`https://maps.google.com/?daddr=${dest}`, '_blank');
        break;
      }
      case 'complete': {
        const result = await updateDeliveryStatus(delivery.id, 'DELIVERED');
        if (result.error) {
          toast.error(result.error);
          return;
        }
        setActiveDelivery(null);
        setStatus('ONLINE');
        setTodayDeliveries((d) => d + 1);
        setTodayEarnings((e) => e + delivery.earnings);
        toast.success('Entrega concluida! 🎉');
        await fetchDeliveries();
        break;
      }
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      {/* Status Bar */}
      <div
        className={`px-4 py-6 text-white ${status === 'OFFLINE' ? 'bg-gray-800' : status === 'BUSY' ? 'bg-emerald-700' : 'bg-emerald-600'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Entregador</h1>
            <p className="text-sm opacity-80">
              {status === 'OFFLINE'
                ? 'Voce esta offline'
                : status === 'BUSY'
                  ? 'Em entrega...'
                  : 'Online — aguardando'}
            </p>
          </div>
          <button
            onClick={toggleStatus}
            disabled={isToggling || status === 'BUSY'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 ${
              status === 'OFFLINE'
                ? 'bg-emerald-500 text-white'
                : status === 'BUSY'
                  ? 'bg-white/20 text-white cursor-not-allowed'
                  : 'bg-red-500 text-white'
            } disabled:opacity-60`}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : status === 'OFFLINE' ? (
              <Power className="w-4 h-4" />
            ) : status === 'BUSY' ? (
              <Truck className="w-4 h-4" />
            ) : (
              <PowerOff className="w-4 h-4" />
            )}
            {status === 'OFFLINE'
              ? 'Ficar Online'
              : status === 'BUSY'
                ? 'Em Entrega'
                : 'Ficar Offline'}
          </button>
        </div>

        {/* Earnings */}
        <div className="flex gap-4">
          <div className="bg-white/10 rounded-xl px-4 py-2">
            <p className="text-xs opacity-70">Ganhos Hoje</p>
            <p className="text-lg font-bold">{formatPrice(todayEarnings)}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2">
            <p className="text-xs opacity-70">Entregas</p>
            <p className="text-lg font-bold">{todayDeliveries}</p>
          </div>
        </div>
      </div>

      {/* Active Delivery */}
      {activeDelivery && (
        <div className="px-4 -mt-3 mb-4">
          <div
            className="rounded-2xl border-2 border-emerald-300 shadow-lg shadow-emerald-100 p-4 space-y-3"
            style={{ backgroundColor: 'var(--color-bg-card)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 uppercase">Em Andamento</span>
            </div>
            <DeliveryCard
              delivery={activeDelivery}
              onAction={(action) => handleAction(activeDelivery, action)}
            />
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'deliveries' && (
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>
              {status === 'ONLINE' ? 'Entregas Disponiveis' : 'Historico de Entregas'}
            </h2>
            <button
              onClick={fetchDeliveries}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoading && deliveries.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2
                className="w-8 h-8 animate-spin"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
            </div>
          ) : deliveries.length === 0 ? (
            <div
              className="text-center py-12 rounded-2xl border"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
              }}
            >
              <Truck
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
              {status === 'ONLINE' ? (
                <>
                  <p className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Aguardando pedidos
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                    Novos pedidos aparecerao aqui
                  </p>
                </>
              ) : (
                <p style={{ color: 'var(--color-text-tertiary)' }}>
                  Fique online para receber pedidos
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((d) => (
                <DeliveryCard
                  key={d.id}
                  delivery={d}
                  onAction={(action) => handleAction(d, action)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="px-4 py-4 space-y-4">
          <div
            className="rounded-2xl border p-6 text-center"
            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Ganhos Hoje
            </p>
            <p className="text-3xl font-bold text-emerald-600">{formatPrice(todayEarnings)}</p>
          </div>
          <div
            className="rounded-2xl border p-6 text-center"
            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Entregas Realizadas
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
              {todayDeliveries}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="px-4 py-4">
          <div
            className="rounded-2xl border p-6 space-y-4"
            style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <User className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  Entregador
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Online
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>Status do GPS</span>
                <span
                  className={gpsEnabled ? 'text-emerald-600 font-medium' : ''}
                  style={!gpsEnabled ? { color: 'var(--color-text-tertiary)' } : undefined}
                >
                  {gpsEnabled ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>Entregas hoje</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {todayDeliveries}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>Ganhos hoje</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {formatPrice(todayEarnings)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t px-4 py-3"
        style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'deliveries' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <Truck className="w-5 h-5" />
            <span className="text-[10px] font-medium">Entregas</span>
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'earnings' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px] font-medium">Ganhos</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Perfil</span>
          </button>
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}
