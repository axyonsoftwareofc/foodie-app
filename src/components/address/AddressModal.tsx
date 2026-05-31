// src/components/address/AddressModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Search } from 'lucide-react';
import { addressSchema } from '@/lib/validations/address.validations';
import { ADDRESS_MESSAGES, ADDRESS_LABELS } from '@/lib/constants/address.constants';
import { BRAZILIAN_STATES } from '@/lib/constants/checkout.constants';
import { formatZipCodeInput, fetchAddressByCep } from '@/lib/utils/address.utils';
import { type AddressData } from '@/actions/addresses';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    label: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }) => Promise<void>;
  editingAddress?: AddressData | null;
}

export function AddressModal({ isOpen, onClose, onSave, editingAddress }: AddressModalProps) {
  const [label, setLabel] = useState<string>('Casa');
  const [street, setStreet] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [complement, setComplement] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isFetchingCep, setIsFetchingCep] = useState<boolean>(false);
  const [cepMessage, setCepMessage] = useState<string>('');

  const isEditing = !!editingAddress;

  // Populate form when editing
  useEffect(() => {
    if (editingAddress) {
      setLabel(editingAddress.label);
      setStreet(editingAddress.street);
      setNumber(editingAddress.number);
      setComplement(editingAddress.complement);
      setNeighborhood(editingAddress.neighborhood);
      setCity(editingAddress.city);
      setState(editingAddress.state);
      setZipCode(formatZipCodeInput(editingAddress.zipCode));
      setCepMessage('');
    } else {
      resetForm();
    }
  }, [editingAddress, isOpen]);

  // Auto-fetch address when CEP has 8 digits
  useEffect(() => {
    const digits = zipCode.replace(/\D/g, '');

    if (digits.length === 8 && !isEditing) {
      handleCepLookup(digits);
    } else if (digits.length === 8 && isEditing) {
      // Only auto-fetch if CEP changed from original
      const originalCep = editingAddress?.zipCode || '';
      if (digits !== originalCep) {
        handleCepLookup(digits);
      }
    }

    if (digits.length < 8) {
      setCepMessage('');
    }
  }, [zipCode, isEditing, editingAddress]);

  const handleCepLookup = async (digits: string): Promise<void> => {
    setIsFetchingCep(true);
    setCepMessage('');

    const result = await fetchAddressByCep(digits);

    if (result.data) {
      setStreet(result.data.logradouro || '');
      setNeighborhood(result.data.bairro || '');
      setCity(result.data.localidade || '');
      setState(result.data.uf || '');
      setCepMessage('✅ Endereço encontrado!');

      // Clear related errors
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.street;
        delete updated.neighborhood;
        delete updated.city;
        delete updated.state;
        delete updated.zipCode;
        return updated;
      });

      // Focus on number field after auto-fill
      setTimeout(() => {
        document.getElementById('number')?.focus();
      }, 100);
    } else {
      setCepMessage(result.error || 'CEP não encontrado');
    }

    setIsFetchingCep(false);
  };

  const resetForm = (): void => {
    setLabel('Casa');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setState('');
    setZipCode('');
    setErrors({});
    setCepMessage('');
  };

  const handleZipCodeChange = (value: string): void => {
    setZipCode(formatZipCodeInput(value));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrors({});

    const result = addressSchema.safeParse({
      label,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        label,
        street,
        number,
        complement: complement || undefined,
        neighborhood,
        city,
        state,
        zipCode: zipCode.replace(/\D/g, ''),
      });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const getInputStyle = (hasError: boolean) => ({
    backgroundColor: 'var(--color-bg-input)',
    color: 'var(--color-text)',
    borderWidth: '1px' as const,
    borderStyle: 'solid' as const,
    borderColor: hasError ? 'var(--color-error)' : 'var(--color-border)',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'var(--color-bg-modal-overlay)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[5%] z-50 mx-auto max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl md:inset-x-auto"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl px-6 py-4"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                borderBottomWidth: '1px',
                borderBottomStyle: 'solid',
                borderBottomColor: 'var(--color-border)',
              }}
            >
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {isEditing ? ADDRESS_MESSAGES.MODAL_EDIT_TITLE : ADDRESS_MESSAGES.MODAL_ADD_TITLE}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
              {/* Label Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  Tipo
                </label>
                <div className="flex gap-2">
                  {ADDRESS_LABELS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setLabel(option.value)}
                      className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor:
                          label === option.value
                            ? 'var(--color-primary-light)'
                            : 'var(--color-bg-secondary)',
                        color: label === option.value ? '#00A082' : 'var(--color-text)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: label === option.value ? '#00A082' : 'var(--color-border)',
                      }}
                    >
                      <span>{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CEP with auto-lookup */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="zipCode"
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text)' }}
                >
                  CEP
                </label>
                <div className="relative">
                  <input
                    id="zipCode"
                    type="text"
                    value={zipCode}
                    onChange={(e) => handleZipCodeChange(e.target.value)}
                    placeholder="01234-567"
                    className="w-full rounded-xl px-4 py-3 pr-10 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#00A082]"
                    style={getInputStyle(!!errors.zipCode)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isFetchingCep ? (
                      <Loader2 size={18} className="animate-spin" style={{ color: '#00A082' }} />
                    ) : (
                      <Search size={18} style={{ color: 'var(--color-text-tertiary)' }} />
                    )}
                  </div>
                </div>
                {errors.zipCode && (
                  <p className="text-xs" style={{ color: 'var(--color-error)' }}>
                    {errors.zipCode}
                  </p>
                )}
                {cepMessage && !errors.zipCode && (
                  <p
                    className="text-xs"
                    style={{
                      color: cepMessage.startsWith('✅') ? '#00A082' : 'var(--color-error)',
                    }}
                  >
                    {cepMessage}
                  </p>
                )}
              </div>

              {/* Street */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="street"
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text)' }}
                >
                  Rua
                </label>
                <input
                  id="street"
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Nome da rua"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#00A082]"
                  style={getInputStyle(!!errors.street)}
                />
                {errors.street && (
                  <p className="text-xs" style={{ color: 'var(--color-error)' }}>
                    {errors.street}
                  </p>
                )}
              </div>

              {/* Number + Complement */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="number"
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Número
                  </label>
                  <input
                    id="number"
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#00A082]"
                    style={getInputStyle(!!errors.number)}
                  />
                  {errors.number && (
                    <p className="text-xs" style={{ color: 'var(--color-error)' }}>
                      {errors.number}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="complement"
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Complemento
                  </label>
                  <input
                    id="complement"
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto 42"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#00A082]"
                    style={getInputStyle(false)}
                  />
                </div>
              </div>

              {/* Neighborhood */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="neighborhood"
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-text)' }}
                >
                  Bairro
                </label>
                <input
                  id="neighborhood"
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Nome do bairro"
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#00A082]"
                  style={getInputStyle(!!errors.neighborhood)}
                />
                {errors.neighborhood && (
                  <p className="text-xs" style={{ color: 'var(--color-error)' }}>
                    {errors.neighborhood}
                  </p>
                )}
              </div>

              {/* City + State */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <label
                    htmlFor="city"
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Cidade
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Sua cidade"
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#00A082]"
                    style={getInputStyle(!!errors.city)}
                  />
                  {errors.city && (
                    <p className="text-xs" style={{ color: 'var(--color-error)' }}>
                      {errors.city}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="state"
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text)' }}
                  >
                    Estado
                  </label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-xl px-3 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#00A082]"
                    style={getInputStyle(!!errors.state)}
                  >
                    <option value="">UF</option>
                    {BRAZILIAN_STATES.map((uf) => (
                      <option key={uf.value} value={uf.value}>
                        {uf.label}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-xs" style={{ color: 'var(--color-error)' }}>
                      {errors.state}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSaving}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00A082] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#008F74] disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {isEditing ? ADDRESS_MESSAGES.UPDATING_BUTTON : ADDRESS_MESSAGES.SAVING_BUTTON}
                  </>
                ) : isEditing ? (
                  ADDRESS_MESSAGES.UPDATE_BUTTON
                ) : (
                  ADDRESS_MESSAGES.SAVE_BUTTON
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
