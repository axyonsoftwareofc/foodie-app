// src/components/address/AddressCard.tsx
'use client';

import { MapPin, Edit2, Trash2, Star } from 'lucide-react';
import { ADDRESS_MESSAGES } from '@/lib/constants/address.constants';
import { formatFullAddress } from '@/lib/utils/address.utils';
import { type AddressData } from '@/actions/addresses';

interface AddressCardProps {
  address: AddressData;
  onEdit: (address: AddressData) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const labelIcons: Record<string, string> = {
    Casa: '🏠',
    Trabalho: '🏢',
    Outro: '📍',
  };

  const handleDelete = (): void => {
    if (window.confirm(ADDRESS_MESSAGES.DELETE_CONFIRM)) {
      onDelete(address.id);
    }
  };

  return (
    <div
      className="rounded-2xl p-5 transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderWidth: address.isDefault ? '2px' : '1px',
        borderStyle: 'solid',
        borderColor: address.isDefault ? '#00A082' : 'var(--color-border)',
      }}
    >
      {/* Top row */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{labelIcons[address.label] || '📍'}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {address.label}
          </span>
          {address.isDefault && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: 'var(--color-primary-light)',
                color: '#00A082',
              }}
            >
              <Star size={10} className="fill-current" />
              {ADDRESS_MESSAGES.LABEL_DEFAULT}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(address)}
            className="rounded-full p-2 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Editar endereço"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-full p-2 transition-colors"
            style={{ color: 'var(--color-error)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Excluir endereço"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2">
        <MapPin
          size={16}
          className="mt-0.5 shrink-0"
          style={{ color: 'var(--color-text-tertiary)' }}
        />
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {formatFullAddress(address)}
        </p>
      </div>

      {/* Set as default */}
      {!address.isDefault && (
        <button
          onClick={() => onSetDefault(address.id)}
          className="mt-3 text-xs font-medium transition-colors hover:underline"
          style={{ color: '#00A082' }}
        >
          {ADDRESS_MESSAGES.SET_DEFAULT}
        </button>
      )}
    </div>
  );
}
