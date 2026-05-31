// src/lib/utils/format.utils.ts
import { CURRENCY } from '@/lib/constants/app.constants';

/**
 * Formata valor para moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
  }).format(value);
}

/**
 * Formata valor de forma curta (R$ 5,99)
 */
export function formatPrice(value: number): string {
  if (value === 0) return 'Grátis';
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/**
 * Formata tempo de entrega
 */
export function formatDeliveryTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

/**
 * Formata avaliação com uma casa decimal
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Formata telefone para exibição: (11) 99999-9999
 */
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Formata data para português brasileiro: 19 de junho de 2025
 */
export function formatDateBR(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
