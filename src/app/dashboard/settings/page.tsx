'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  getRestaurantProfile,
  updateRestaurantProfile,
  updateOperatingHours,
} from '@/actions/restaurantActions';
import type {
  RestaurantProfile,
  OperatingHours as MgmtOperatingHours,
} from '@/types/restaurant-management.types';

const DAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terca',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sabado',
};

interface HourEntry {
  dayOfWeek: number;
  isClosed: boolean;
  open: string;
  close: string;
}

const DEFAULT_HOURS: HourEntry[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isClosed: false,
  open: '08:00',
  close: '22:00',
}));

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [minimumOrder, setMinimumOrder] = useState('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('');
  const [hours, setHours] = useState<HourEntry[]>(DEFAULT_HOURS);

  useEffect(() => {
    getRestaurantProfile().then((result) => {
      if (result.data) {
        const r = result.data;
        setRestaurant(r);
        setName(r.name || '');
        setDescription(r.description || '');
        setPhone(r.contact?.phone || '');
        setEmail(r.contact?.email || '');
        setCategory(r.category || '');
        setDeliveryFee(String(r.deliveryFee || ''));
        setMinimumOrder(String(r.minimumOrder || ''));
        setEstimatedDeliveryTime(String(r.estimatedDeliveryTime || ''));

        if (r.operatingHours && r.operatingHours.length > 0) {
          setHours(
            DEFAULT_HOURS.map((def) => {
              const existing = r.operatingHours.find((h) => h.dayOfWeek === def.dayOfWeek);
              return existing
                ? {
                    dayOfWeek: existing.dayOfWeek,
                    isClosed: existing.isClosed,
                    open: existing.open || '08:00',
                    close: existing.close || '22:00',
                  }
                : def;
            })
          );
        }
      }
      setIsLoading(false);
    });
  }, []);

  const handleHourToggle = (index: number) => {
    setHours((prev) => prev.map((h, i) => (i === index ? { ...h, isClosed: !h.isClosed } : h)));
  };

  const handleHourChange = (index: number, field: 'open' | 'close', value: string) => {
    setHours((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  const handleSave = async () => {
    if (!restaurant) return;
    setIsSaving(true);

    try {
      const profileResult = await updateRestaurantProfile({
        id: restaurant.id,
        name,
        description,
        category,
        contact: {
          phone,
          email,
        },
        deliveryFee: parseFloat(deliveryFee) || 0,
        minimumOrder: parseFloat(minimumOrder) || 0,
        estimatedDeliveryTime: parseInt(estimatedDeliveryTime) || 30,
      } as Partial<RestaurantProfile>);

      if (profileResult.error) {
        toast.error(profileResult.error);
        setIsSaving(false);
        return;
      }

      const hoursData: MgmtOperatingHours[] = hours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        isClosed: h.isClosed,
        open: h.open,
        close: h.close,
      }));
      const hoursResult = await updateOperatingHours(hoursData);

      if (hoursResult.error) {
        toast.error(hoursResult.error);
      } else {
        toast.success('Configuracoes salvas!');
      }
    } catch {
      toast.error('Erro ao salvar');
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Configuracoes</h1>

      <div className="space-y-8">
        {/* Secao: Informacoes do Restaurante */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacoes do Restaurante</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Pizzaria, Japonesa, Hamburgueria"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Secao: Configuracoes de Entrega */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuracoes de Entrega</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taxa (R$)</label>
              <input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pedido Minimo (R$)
              </label>
              <input
                type="number"
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Estimado (min)
              </label>
              <input
                type="number"
                value={estimatedDeliveryTime}
                onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
              />
            </div>
          </div>
        </section>

        {/* Secao: Horarios de Funcionamento */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Horarios de Funcionamento</h2>
          <div className="space-y-3">
            {hours.map((h, index) => (
              <div
                key={h.dayOfWeek}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                  !h.isClosed ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <button
                  onClick={() => handleHourToggle(index)}
                  className="text-gray-500 hover:text-emerald-600 transition-colors"
                  title={!h.isClosed ? 'Fechar este dia' : 'Abrir este dia'}
                >
                  {!h.isClosed ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>

                <span className="w-24 text-sm font-medium text-gray-700">
                  {DAY_LABELS[h.dayOfWeek]}
                </span>

                {!h.isClosed ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => handleHourChange(index, 'open', e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                    <span className="text-gray-400">ate</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => handleHourChange(index, 'close', e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
                    />
                  </div>
                ) : (
                  <span className="ml-auto text-sm text-gray-400">Fechado</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Botao Salvar */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Salvar Configuracoes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
