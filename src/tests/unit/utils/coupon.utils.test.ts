// src/tests/unit/utils/coupon.utils.test.ts
import { describe, it, expect } from 'vitest';
import { validateCoupon } from '@/lib/utils/coupon.utils';

describe('coupon.utils', () => {
  describe('validateCoupon', () => {
    it('should validate PRIMEIRA coupon', () => {
      const result = validateCoupon('PRIMEIRA', 100);

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(25); // 50% max R$ 25
    });

    it('should apply percentage with max discount', () => {
      const result = validateCoupon('PRIMEIRA', 40);

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(20); // 50% of 40 = 20 (under max)
    });

    it('should validate DESCONTO10 with minimum order', () => {
      const resultValid = validateCoupon('DESCONTO10', 50);
      expect(resultValid.valid).toBe(true);
      expect(resultValid.discount).toBe(10);

      const resultInvalid = validateCoupon('DESCONTO10', 20);
      expect(resultInvalid.valid).toBe(false);
      expect(resultInvalid.error).toContain('mínimo');
    });

    it('should reject invalid coupon', () => {
      const result = validateCoupon('INVALIDO', 100);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('inválido');
    });

    it('should be case insensitive', () => {
      const result = validateCoupon('primeira', 100);
      expect(result.valid).toBe(true);
    });

    it('should trim whitespace', () => {
      const result = validateCoupon('  PRIMEIRA  ', 100);
      expect(result.valid).toBe(true);
    });
  });
});
