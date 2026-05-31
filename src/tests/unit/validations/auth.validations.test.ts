// src/tests/unit/validations/auth.validations.test.ts
import { describe, it, expect } from 'vitest'
import { signInSchema, signUpSchema } from '@/lib/validations/auth.validations'

describe('signInSchema', () => {
    it('should validate correct sign in data', () => {
        const validData = {
            email: 'test@example.com',
            password: 'validPass123!',
        }

        const result = signInSchema.safeParse(validData)
        expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
        const invalidData = {
            email: 'invalid-email',
            password: 'validPass123!',
        }

        const result = signInSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('email')
        }
    })

    it('should reject empty password', () => {
        const invalidData = {
            email: 'test@example.com',
            password: '',
        }

        const result = signInSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('password')
        }
    })

    it('should reject empty email', () => {
        const invalidData = {
            email: '',
            password: 'password123',
        }

        const result = signInSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
        const invalidData = {
            email: 'test@example.com',
            password: '',
        }

        const result = signInSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })
})

describe('signUpSchema', () => {
    it('should validate correct sign up data', () => {
        const validData = {
            fullName: 'John Doe',
            email: 'test@example.com',
            password: 'ValidPass123!',
            confirmPassword: 'ValidPass123!',
        }

        const result = signUpSchema.safeParse(validData)
        expect(result.success).toBe(true)
    })

    it('should reject short fullName', () => {
        const invalidData = {
            fullName: 'J',
            email: 'test@example.com',
            password: 'ValidPass123!',
            confirmPassword: 'ValidPass123!',
        }

        const result = signUpSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('fullName')
        }
    })

    it('should reject invalid email', () => {
        const invalidData = {
            fullName: 'John Doe',
            email: 'invalid-email',
            password: 'ValidPass123!',
            confirmPassword: 'ValidPass123!',
        }

        const result = signUpSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
        const invalidData = {
            fullName: 'John Doe',
            email: 'test@example.com',
            password: 'Short1!',
            confirmPassword: 'Short1!',
        }

        const result = signUpSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })

    it('should reject mismatching passwords', () => {
        const invalidData = {
            fullName: 'John Doe',
            email: 'test@example.com',
            password: 'ValidPass123!',
            confirmPassword: 'DifferentPass123!',
        }

        const result = signUpSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('confirmPassword')
        }
    })

    it('should reject empty confirmPassword', () => {
        const invalidData = {
            fullName: 'John Doe',
            email: 'test@example.com',
            password: 'ValidPass123!',
            confirmPassword: '',
        }

        const result = signUpSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
    })

    it('should strip role field from sign up data (prevents privilege escalation)', () => {
        const dataWithRole = {
            fullName: 'John Doe',
            email: 'test@example.com',
            password: 'ValidPass123!',
            confirmPassword: 'ValidPass123!',
            role: 'ADMIN',
        }

        const result = signUpSchema.safeParse(dataWithRole)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data).not.toHaveProperty('role')
        }
    })

    it('should strip unknown fields from sign up data', () => {
        const dataWithExtra = {
            fullName: 'John Doe',
            email: 'test@example.com',
            password: 'ValidPass123!',
            confirmPassword: 'ValidPass123!',
            role: 'GERENCIADOR',
            isAdmin: true,
            __proto__: { role: 'ADMIN' },
        }

        const result = signUpSchema.safeParse(dataWithExtra)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data).not.toHaveProperty('role')
            expect(result.data).not.toHaveProperty('isAdmin')
        }
    })
})
