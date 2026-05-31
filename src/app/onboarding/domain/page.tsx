'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  tenantStep2Schema,
  RESERVED_SUBDOMAINS,
  type TenantStep2Data,
} from '@/lib/validations/tenant.validations';
import { cn } from '@/lib/utils/cn';

function getStep2Data(): TenantStep2Data {
  try {
    const raw = sessionStorage.getItem('onboarding_step2');
    return raw
      ? JSON.parse(raw)
      : {
          subdomain: '',
          cep: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          deliveryRadius: 10,
        };
  } catch {
    return {
      subdomain: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      deliveryRadius: 10,
    };
  }
}

export default function OnboardingStep2() {
  const router = useRouter();
  const [form, setForm] = useState<TenantStep2Data>(getStep2Data);
  const [errors, setErrors] = useState<Partial<Record<keyof TenantStep2Data, string>>>({});
  const [domainStatus, setDomainStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable'
  >('idle');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const checkDomain = async (subdomain: string) => {
    if (subdomain.length < 3 || RESERVED_SUBDOMAINS.includes(subdomain)) {
      setDomainStatus('unavailable');
      return;
    }
    setDomainStatus('checking');

    try {
      const { checkSubdomainAvailability } = await import('@/actions/tenant-actions');
      const result = await checkSubdomainAvailability(subdomain);
      setDomainStatus(result.available ? 'available' : 'unavailable');
    } catch {
      setDomainStatus('idle');
    }
  };

  useEffect(() => {
    if (form.subdomain.length >= 3) {
      const timeout = setTimeout(() => checkDomain(form.subdomain), 500);
      return () => clearTimeout(timeout);
    }
    setDomainStatus('idle');
  }, [form.subdomain]);

  const searchCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
        toast.success('CEP encontrado!');
      } else {
        toast.error('CEP nao encontrado');
      }
    } catch {
      toast.error('Erro ao buscar CEP');
    }
    setIsLoadingCep(false);
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) return digits.slice(0, 5) + '-' + digits.slice(5);
    return digits;
  };

  const updateField = (field: keyof TenantStep2Data, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const canProceed = domainStatus === 'available' || domainStatus === 'idle';

  const handleNext = () => {
    const result = tenantStep2Schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof TenantStep2Data, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof TenantStep2Data;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      if (domainStatus !== 'available') {
        toast.error('Escolha um subdominio disponivel');
      }
      return;
    }

    if (domainStatus !== 'available') {
      toast.error('Verifique a disponibilidade do subdominio');
      return;
    }

    sessionStorage.setItem('onboarding_step2', JSON.stringify(result.data));
    router.push('/onboarding/theme');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Endereco do restaurante</h1>
        <p className="text-gray-500 mt-1">Escolha o endereco virtual e fisico</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subdominio <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={form.subdomain}
              onChange={(e) =>
                updateField('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
              }
              placeholder="pizzariadoze"
              maxLength={30}
              className={cn(
                'flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900',
                errors.subdomain ? 'border-red-300' : 'border-gray-300'
              )}
            />
            <span className="text-gray-400 text-sm">.foodie.app</span>
          </div>
          <div className="mt-2">
            {domainStatus === 'checking' && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Verificando...
              </span>
            )}
            {domainStatus === 'available' && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Disponivel!
              </span>
            )}
            {domainStatus === 'unavailable' && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Indisponivel
              </span>
            )}
          </div>
          {errors.subdomain && <p className="text-red-500 text-xs mt-1">{errors.subdomain}</p>}
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            Endereco fisico
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.cep}
                  onChange={(e) => updateField('cep', formatCep(e.target.value))}
                  onBlur={(e) => searchCep(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className={cn(
                    'flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900',
                    errors.cep ? 'border-red-300' : 'border-gray-300'
                  )}
                />
                <button
                  type="button"
                  onClick={() => searchCep(form.cep)}
                  disabled={isLoadingCep}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {isLoadingCep ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => updateField('number', e.target.value)}
                placeholder="123"
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900',
                  errors.number ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rua <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => updateField('street', e.target.value)}
              className={cn(
                'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900',
                errors.street ? 'border-red-300' : 'border-gray-300'
              )}
            />
            {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
            <input
              type="text"
              value={form.complement || ''}
              onChange={(e) => updateField('complement', e.target.value)}
              placeholder="Apto, bloco, sala..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bairro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.neighborhood}
                onChange={(e) => updateField('neighborhood', e.target.value)}
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900',
                  errors.neighborhood ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.neighborhood && (
                <p className="text-red-500 text-xs mt-1">{errors.neighborhood}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => updateField('state', e.target.value.toUpperCase())}
                placeholder="SP"
                maxLength={2}
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900',
                  errors.state ? 'border-red-300' : 'border-gray-300'
                )}
              />
              {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              className={cn(
                'w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900',
                errors.city ? 'border-red-300' : 'border-gray-300'
              )}
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Raio de entrega (km) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.deliveryRadius}
            onChange={(e) => updateField('deliveryRadius', Number(e.target.value))}
            min={1}
            max={50}
            className={cn(
              'w-32 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900',
              errors.deliveryRadius ? 'border-red-300' : 'border-gray-300'
            )}
          />
          {errors.deliveryRadius && (
            <p className="text-red-500 text-xs mt-1">{errors.deliveryRadius}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Voltar
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Proximo
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
