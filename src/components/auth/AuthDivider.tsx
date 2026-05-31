// src/components/auth/AuthDivider.tsx
import { AUTH_MESSAGES } from '@/lib/constants/auth.constants';

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
      <span
        className="text-xs font-medium uppercase"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {AUTH_MESSAGES.OR_DIVIDER}
      </span>
      <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
    </div>
  );
}
