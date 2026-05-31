// src/tests/unit/validations/checkout.validations.test.ts
import { describe, it, expect } from 'vitest';
import { addressSchema, paymentSchema } from '@/lib/validations/checkout.validations';

describe('checkout.validations', () => {
  describe('addressSchema', () => {
    const validAddress = {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 1',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
    };

    it('should validate correct address', () => {
      const result = addressSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it('should require street with min 3 chars', () => {
      const result = addressSchema.safeParse({ ...validAddress, street: 'AB' });
      expect(result.success).toBe(false);
    });

    it('should require number', () => {
      const result = addressSchema.safeParse({ ...validAddress, number: '' });
      expect(result.success).toBe(false);
    });

    it('should allow optional complement', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { complement: _ignoredComplement, ...addressWithoutComplement } = validAddress;
      const result = addressSchema.safeParse(addressWithoutComplement);
      expect(result.success).toBe(true);
    });

    it('should validate state length', () => {
      const result = addressSchema.safeParse({ ...validAddress, state: 'São Paulo' });
      expect(result.success).toBe(false);
    });

    it('should validate CEP format', () => {
      expect(addressSchema.safeParse({ ...validAddress, zipCode: '12345-678' }).success).toBe(true);
      expect(addressSchema.safeParse({ ...validAddress, zipCode: '12345678' }).success).toBe(true);
      expect(addressSchema.safeParse({ ...validAddress, zipCode: '1234-567' }).success).toBe(false);
      expect(addressSchema.safeParse({ ...validAddress, zipCode: 'abcde-fgh' }).success).toBe(
        false
      );
    });
  });

  describe('paymentSchema', () => {
    it('should validate payment methods', () => {
      expect(paymentSchema.safeParse({ method: 'PIX' }).success).toBe(true);
      expect(paymentSchema.safeParse({ method: 'CREDIT_CARD' }).success).toBe(true);
      expect(paymentSchema.safeParse({ method: 'DEBIT_CARD' }).success).toBe(true);
      expect(paymentSchema.safeParse({ method: 'CASH' }).success).toBe(true);
    });

    it('should reject invalid methods', () => {
      expect(paymentSchema.safeParse({ method: 'BITCOIN' }).success).toBe(false);
    });

    it('should allow optional changeFor', () => {
      expect(paymentSchema.safeParse({ method: 'CASH', changeFor: 100 }).success).toBe(true);
      expect(paymentSchema.safeParse({ method: 'CASH' }).success).toBe(true);
    });

    it('should require positive changeFor', () => {
      expect(paymentSchema.safeParse({ method: 'CASH', changeFor: -10 }).success).toBe(false);
    });
  });
});
