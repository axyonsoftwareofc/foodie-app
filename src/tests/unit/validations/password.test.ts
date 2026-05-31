// src/tests/unit/validations/password.test.ts
import { describe, it, expect } from 'vitest';
import { signUpSchema } from '@/lib/validations/auth.validations';

describe('Password complexity (signUpSchema)', () => {
  const base = {
    fullName: 'John Doe',
    email: 'test@example.com',
  };

  it('accepts a strong password (8+, upper, lower, number, symbol)', () => {
    const data = { ...base, password: 'Str0ng!Pass', confirmPassword: 'Str0ng!Pass' };
    const result = signUpSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects a password shorter than 8 characters', () => {
    const data = { ...base, password: 'Short1!', confirmPassword: 'Short1!' };
    const result = signUpSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('password'))).toBe(true);
    }
  });

  it('rejects a password without uppercase', () => {
    const data = { ...base, password: 'weakpass123!', confirmPassword: 'weakpass123!' };
    const result = signUpSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('maiúscula'))).toBe(true);
    }
  });

  it('rejects a password without lowercase', () => {
    const data = { ...base, password: 'WEAKPASS123!', confirmPassword: 'WEAKPASS123!' };
    const result = signUpSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('minúscula'))).toBe(true);
    }
  });

  it('rejects a password without a number', () => {
    const data = { ...base, password: 'WeakPass!!!', confirmPassword: 'WeakPass!!!' };
    const result = signUpSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('número'))).toBe(true);
    }
  });

  it('rejects a password without a symbol', () => {
    const data = { ...base, password: 'WeakPass123', confirmPassword: 'WeakPass123' };
    const result = signUpSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('símbolo'))).toBe(true);
    }
  });

  it('accepts a password with common special characters', () => {
    const symbols = ['@', '#', '$', '%', '&', '*', '?', '!'];
    for (const symbol of symbols) {
      const pwd = `Str0ng${symbol}Pass`;
      const data = { ...base, password: pwd, confirmPassword: pwd };
      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(true);
    }
  });
});
