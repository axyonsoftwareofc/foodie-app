// src/components/checkout/AddressForm.tsx (atualizado)
'use client';

import { useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { AddressFormData } from '@/lib/validations/checkout.validations';
import { BRAZILIAN_STATES, CHECKOUT_MESSAGES } from '@/lib/constants/checkout.constants';
import { formatZipCode } from '@/lib/utils/checkout.utils';
import { useViaCep } from '@/hooks/useViaCep';
import { toast } from 'sonner';

interface AddressFormProps {
  data: AddressFormData;
  errors: Partial<Record<keyof AddressFormData, string>>;
  onChange: (field: keyof AddressFormData, value: string) => void;
  onCepFound?: (address: Partial<AddressFormData>) => void;
}

export default function AddressForm({ data, errors, onChange, onCepFound }: AddressFormProps) {
  const { fetchAddress, loading: loadingCep } = useViaCep();
  const [cepTouched, setCepTouched] = useState(false);

  const handleZipCodeChange = (value: string): void => {
    onChange('zipCode', formatZipCode(value));
    setCepTouched(true);
  };

  const handleSearchCep = async (): Promise<void> => {
    const cleanCep = data.zipCode.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      toast.error('Digite um CEP válido com 8 dígitos');
      return;
    }

    const result = await fetchAddress(cleanCep);

    if (result) {
      const addressData = {
        street: result.logradouro || '',
        neighborhood: result.bairro || '',
        city: result.localidade || '',
        state: result.uf || '',
        complement: result.complemento || data.complement || '',
      };

      // Preencher campos
      onChange('street', addressData.street);
      onChange('neighborhood', addressData.neighborhood);
      onChange('city', addressData.city);
      onChange('state', addressData.state);

      if (addressData.complement) {
        onChange('complement', addressData.complement);
      }

      // Limpar erros dos campos preenchidos
      if (onCepFound) {
        onCepFound(addressData);
      }

      toast.success('Endereço encontrado!');
    } else {
      toast.error('CEP não encontrado');
    }
  };

  const inputBaseStyles =
    'w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A082] transition-colors';

  const getInputStyle = (hasError: boolean) => ({
    backgroundColor: 'var(--color-bg-input)',
    color: 'var(--color-text)',
    borderColor: hasError ? 'var(--color-error)' : 'var(--color-border)',
  });

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 border-b transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="w-10 h-10 bg-[#00A082] rounded-full flex items-center justify-center">
          <MapPin size={20} className="text-white" />
        </div>
        <h2 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
          {CHECKOUT_MESSAGES.addressTitle}
        </h2>
      </div>

      {/* Formulário */}
      <div className="p-4 space-y-4">
        {/* CEP com busca */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            CEP *
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={data.zipCode}
                onChange={(e) => handleZipCodeChange(e.target.value)}
                onBlur={() => {
                  if (cepTouched && data.zipCode.replace(/\D/g, '').length === 8) {
                    handleSearchCep();
                  }
                }}
                placeholder="00000-000"
                maxLength={9}
                className={inputBaseStyles}
                style={getInputStyle(!!errors.zipCode)}
              />
            </div>
            <button
              type="button"
              onClick={handleSearchCep}
              disabled={loadingCep || data.zipCode.replace(/\D/g, '').length !== 8}
              className="px-4 py-3 bg-[#00A082] text-white rounded-xl hover:bg-[#008c6f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loadingCep ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
          {errors.zipCode && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>
              {errors.zipCode}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Digite o CEP para preencher automaticamente
          </p>
        </div>

        {/* Rua e Número */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Rua *
            </label>
            <input
              type="text"
              value={data.street}
              onChange={(e) => onChange('street', e.target.value)}
              placeholder="Nome da rua"
              className={inputBaseStyles}
              style={getInputStyle(!!errors.street)}
              disabled={loadingCep}
            />
            {errors.street && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>
                {errors.street}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Número *
            </label>
            <input
              type="text"
              value={data.number}
              onChange={(e) => onChange('number', e.target.value)}
              placeholder="123"
              className={inputBaseStyles}
              style={getInputStyle(!!errors.number)}
            />
            {errors.number && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>
                {errors.number}
              </p>
            )}
          </div>
        </div>

        {/* Complemento */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Complemento
            <span className="font-normal ml-1" style={{ color: 'var(--color-text-tertiary)' }}>
              (opcional)
            </span>
          </label>
          <input
            type="text"
            value={data.complement || ''}
            onChange={(e) => onChange('complement', e.target.value)}
            placeholder="Apto, bloco, referência..."
            className={inputBaseStyles}
            style={getInputStyle(false)}
            disabled={loadingCep}
          />
        </div>

        {/* Bairro */}
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Bairro *
          </label>
          <input
            type="text"
            value={data.neighborhood}
            onChange={(e) => onChange('neighborhood', e.target.value)}
            placeholder="Nome do bairro"
            className={inputBaseStyles}
            style={getInputStyle(!!errors.neighborhood)}
            disabled={loadingCep}
          />
          {errors.neighborhood && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>
              {errors.neighborhood}
            </p>
          )}
        </div>

        {/* Cidade, Estado */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cidade *
            </label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => onChange('city', e.target.value)}
              placeholder="Sua cidade"
              className={inputBaseStyles}
              style={getInputStyle(!!errors.city)}
              disabled={loadingCep}
            />
            {errors.city && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>
                {errors.city}
              </p>
            )}
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              UF *
            </label>
            <select
              value={data.state}
              onChange={(e) => onChange('state', e.target.value)}
              className="w-full px-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A082] transition-colors"
              style={getInputStyle(!!errors.state)}
              disabled={loadingCep}
            >
              <option value="">-</option>
              {BRAZILIAN_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.value}
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-error)' }}>
                {errors.state}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
