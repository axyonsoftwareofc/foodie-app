// src/lib/validations/auth.validations.ts
import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 8;

const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#[\]^()_+\-={}|\\:;"'<>,./~`])[A-Za-z\d@$!%*?&#[\]^()_+\-={}|\\:;"'<>,./~`]+$/;

export const signInSchema = z.object({
    email: z
        .email({ message: 'Digite um email válido' }),
    password: z
        .string()
        .min(1, { message: 'Digite sua senha' }),
});

export const signUpSchema = z
    .object({
        fullName: z
            .string()
            .min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
        email: z
            .email({ message: 'Digite um email válido' }),
        password: z
            .string()
            .min(PASSWORD_MIN_LENGTH, { message: `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres` })
            .regex(
                passwordComplexityRegex,
                { message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um símbolo especial' }
            ),
        confirmPassword: z
            .string()
            .min(1, { message: 'Confirme sua senha' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'As senhas não coincidem',
        path: ['confirmPassword'],
    });

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;