import { z } from 'zod'

export const tenantStep1Schema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(60, 'Nome muito longo'),
    category: z.string().min(1, 'Selecione uma categoria'),
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ invalido').optional().or(z.literal('')),
    phone: z.string().min(10, 'Telefone invalido').max(15, 'Telefone invalido'),
    email: z.string().email('Email invalido').optional().or(z.literal('')),
    description: z.string().max(200, 'Descricao muito longa').optional().or(z.literal('')),
})

export const tenantStep2Schema = z.object({
    subdomain: z.string()
        .min(3, 'Minimo 3 caracteres')
        .max(30, 'Maximo 30 caracteres')
        .regex(/^[a-z0-9-]+$/, 'Apenas letras minusculas, numeros e hifens'),
    cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP invalido'),
    street: z.string().min(2, 'Rua obrigatoria'),
    number: z.string().min(1, 'Numero obrigatorio'),
    complement: z.string().optional().or(z.literal('')),
    neighborhood: z.string().min(2, 'Bairro obrigatorio'),
    city: z.string().min(2, 'Cidade obrigatoria'),
    state: z.string().length(2, 'Use a sigla (ex: SP)').transform((v) => v.toUpperCase()),
    deliveryRadius: z.number().min(1, 'Minimo 1 km').max(50, 'Maximo 50 km').default(10),
})

export const tenantStep3Schema = z.object({
    logo: z.string().optional().or(z.literal('')),
    coverImage: z.string().optional().or(z.literal('')),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor invalida').default('#00A082'),
})

export type TenantStep1Data = z.infer<typeof tenantStep1Schema>
export type TenantStep2Data = z.infer<typeof tenantStep2Schema>
export type TenantStep3Data = z.infer<typeof tenantStep3Schema>

export const CATEGORY_OPTIONS = [
    { value: 'Pizza', label: 'Pizza' },
    { value: 'Burger', label: 'Hamburgueria' },
    { value: 'Japonesa', label: 'Japonesa' },
    { value: 'Italiana', label: 'Italiana' },
    { value: 'Brasileira', label: 'Brasileira' },
    { value: 'Saudavel', label: 'Saudavel' },
    { value: 'Acai', label: 'Acai' },
    { value: 'Sobremesas', label: 'Sobremesas' },
    { value: 'Cafeteria', label: 'Cafeteria' },
    { value: 'Outros', label: 'Outros' },
]

export const RESERVED_SUBDOMAINS = ['www', 'app', 'admin', 'api', 'mail', 'foodie', 'test']
