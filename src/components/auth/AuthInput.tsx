// src/components/auth/AuthInput.tsx
'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface AuthInputProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
}

export function AuthInput({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
}: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

  const isPassword = type === 'password';
  const inputType = isPassword && isPasswordVisible ? 'text' : type;

  const handleTogglePassword = (): void => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-border-focus)]"
          style={{
            backgroundColor: 'var(--color-bg-input)',
            color: 'var(--color-text)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: error ? 'var(--color-error)' : 'var(--color-border)',
          }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
            style={{ color: 'var(--color-text-tertiary)' }}
            aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs"
          style={{ color: 'var(--color-error)' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
