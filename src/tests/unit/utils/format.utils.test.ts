// src/tests/unit/utils/format.utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatPrice, formatCurrency } from '@/lib/utils/format.utils';

describe('format.utils', () => {
  describe('formatPrice', () => {
    it('should format price correctly', () => {
      expect(formatPrice(29.9)).toBe('R$ 29,90');
    });

    it('should return "Grátis" for zero', () => {
      expect(formatPrice(0)).toBe('Grátis');
    });

    it('should handle decimal places', () => {
      expect(formatPrice(10)).toBe('R$ 10,00');
      expect(formatPrice(10.5)).toBe('R$ 10,50');
      expect(formatPrice(10.99)).toBe('R$ 10,99');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency in BRL', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1.234,56');
    });
  });
});
