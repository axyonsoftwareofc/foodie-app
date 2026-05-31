// src/lib/validations/address.validations.ts
import { z } from 'zod';

export const addressSchema = z.object({
  label: z.string().min(1, { message: 'Selecione um rótulo' }),
  street: z.string().min(3, { message: 'Digite o nome da rua' }),
  number: z.string().min(1, { message: 'Digite o número' }),
  complement: z.string().optional().default(''),
  neighborhood: z.string().min(2, { message: 'Digite o bairro' }),
  city: z.string().min(2, { message: 'Digite a cidade' }),
  state: z.string().length(2, { message: 'Selecione o estado' }),
  zipCode: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(z.string().length(8, { message: 'CEP deve ter 8 dígitos' })),
});

export type AddressFormData = z.infer<typeof addressSchema>;
