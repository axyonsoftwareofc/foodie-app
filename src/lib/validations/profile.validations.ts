// src/lib/validations/profile.validations.ts
import { z } from 'zod';

export const profileSchema = z.object({
  fullName: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres' }),
  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(
      z.string().refine((val) => val === '' || (val.length >= 10 && val.length <= 11), {
        message: 'Telefone inválido. Use DDD + número',
      })
    ),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
