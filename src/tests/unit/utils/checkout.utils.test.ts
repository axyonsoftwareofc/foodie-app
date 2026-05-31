// src/tests/unit/utils/checkout.utils.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  generateOrderId,
  formatAddress,
  formatZipCode,
  calculateEstimatedDelivery,
} from '@/lib/utils/checkout.utils';

describe('checkout.utils', () => {
  describe('generateOrderId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateOrderId();
      const id2 = generateOrderId();

      expect(id1).not.toBe(id2);
    });

    it('should be uppercase', () => {
      const id = generateOrderId();
      expect(id).toBe(id.toUpperCase());
    });
  });

  describe('formatAddress', () => {
    it('should format address correctly', () => {
      const address = {
        id: '1',
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
      };

      const result = formatAddress(address);

      expect(result).toContain('Rua das Flores');
      expect(result).toContain('123');
      expect(result).toContain('Apto 45');
      expect(result).toContain('Centro');
      expect(result).toContain('São Paulo');
      expect(result).toContain('SP');
    });

    it('should handle missing complement', () => {
      const address = {
        id: '1',
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
      };

      const result = formatAddress(address);
      expect(result).not.toContain('undefined');
    });
  });

  describe('formatZipCode', () => {
    it('should format CEP with dash', () => {
      expect(formatZipCode('12345678')).toBe('12345-678');
      expect(formatZipCode('12345')).toBe('12345');
    });

    it('should remove non-numeric characters', () => {
      expect(formatZipCode('123.456.78')).toBe('12345-678');
    });
  });

  describe('calculateEstimatedDelivery', () => {
    it('should calculate based on delivery time', () => {
      vi.useFakeTimers();
      const now = new Date('2025-06-15T12:00:00');
      vi.setSystemTime(now);

      const result = calculateEstimatedDelivery('30-45 min');
      const estimated = new Date(result);

      // Should be 45 min from now (max time)
      expect(estimated.getTime()).toBe(now.getTime() + 45 * 60 * 1000);

      vi.useRealTimers();
    });
  });
});
