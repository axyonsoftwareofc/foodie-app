// src/app/dashboard/entregadores/page.tsx — GESTÃO DE ENTREGADORES
'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Truck, Loader2, Phone, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createDriverWithAuth, getDrivers } from '@/actions/delivery-actions';
import type { DeliveryDriver } from '@/types/delivery.types';

export default function EntregadoresPage() {
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState<string>('MOTO');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [createdDriver, setCreatedDriver] = useState<{
    driver: DeliveryDriver;
    tempPassword: string;
  } | null>(null);

  async function loadDrivers() {
    const result = await getDrivers();
    if (result.data) setDrivers(result.data);
    else if (result.error) toast.error(result.error);
    setIsLoading(false);
  }

  useEffect(() => {
    loadDrivers();
  }, []);

  async function handleAdd() {
    if (!name || !phone || !email) {
      toast.error('Nome, email e telefone são obrigatórios');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    setIsSaving(true);
    const result = await createDriverWithAuth({
      email,
      password: `Drv${Date.now()}!`,
      name,
      phone,
      vehicleType: vehicleType as DeliveryDriver['vehicleType'],
      vehiclePlate: vehiclePlate || undefined,
    });

    if (result.data) {
      setCreatedDriver(result.data);
      toast.success('Entregador criado com sucesso!');
      setName('');
      setEmail('');
      setPhone('');
      setVehiclePlate('');
      loadDrivers();
    } else {
      toast.error(result.error || 'Erro ao criar entregador');
    }
    setIsSaving(false);
  }

  function copyCredentials() {
    if (createdDriver) {
      const text = `Email: ${email}\nSenha: ${createdDriver.tempPassword}`;
      navigator.clipboard.writeText(text);
      toast.success('Credenciais copiadas!');
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Entregadores</h1>
        <p className="text-gray-500 mt-1">Gerencie sua equipe de entregadores</p>
      </div>

      {/* Add Driver */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Adicionar Entregador
          </h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              + Novo
            </button>
          )}
        </div>

        {isAdding && (
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João Motoboy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Telefone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Veículo</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="MOTO">🛵 Moto</option>
                  <option value="CARRO">🚗 Carro</option>
                  <option value="BIKE">🚲 Bicicleta</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Placa (opcional)</label>
              <input
                type="text"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                maxLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none uppercase"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setCreatedDriver(null);
                }}
                className="px-4 py-2 text-gray-600 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={isSaving}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Criar Conta
              </button>
            </div>
          </div>
        )}

        {createdDriver && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-emerald-800">Entregador criado!</p>
                <p className="text-sm text-emerald-700 mt-1">Credenciais para o entregador:</p>
                <div className="mt-2 bg-white rounded p-3 font-mono text-sm">
                  <p>
                    <strong>Email:</strong> {email}
                  </p>
                  <p>
                    <strong>Senha:</strong> {createdDriver.tempPassword}
                  </p>
                </div>
                <button
                  onClick={copyCredentials}
                  className="mt-2 flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800"
                >
                  <Copy className="w-4 h-4" /> Copiar credenciais
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drivers List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Seus Entregadores ({drivers.length})</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">Nenhum entregador cadastrado</p>
            <p className="text-sm text-gray-400 mt-1">Adicione entregadores para começar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    {driver.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{driver.name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {driver.phone}
                      </span>
                      <span>
                        {driver.vehicleType === 'MOTO'
                          ? '🛵 Moto'
                          : driver.vehicleType === 'BIKE'
                            ? '🚲 Bike'
                            : '🚗 Carro'}
                      </span>
                      {driver.vehiclePlate && (
                        <span className="font-mono">{driver.vehiclePlate}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${driver.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    title={driver.isAvailable ? 'Disponível' : 'Indisponível'}
                  />
                  <span className="text-xs text-gray-400">{driver.totalDeliveries} entregas</span>
                  <span className="text-xs text-yellow-500">⭐ {driver.rating}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-medium text-amber-800 mb-1">Como funciona?</h3>
        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
          <li>Cadastre o entregador com email e dados do veículo</li>
          <li>Copie as credenciais e entregue ao entregador</li>
          <li>
            Quando um pedido ficar pronto, vá no <strong>Pass / Balcão</strong>
          </li>
          <li>Atribua o pedido a um entregador disponível</li>
          <li>
            O entregador acessa <code className="bg-amber-100 px-1 rounded text-xs">/driver</code>{' '}
            no celular
          </li>
          <li>Ele vê a entrega, navega até o cliente e confirma</li>
        </ol>
      </div>
    </div>
  );
}
