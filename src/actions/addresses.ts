// src/actions/addresses.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export interface AddressData {
  id: string;
  label: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  createdAt: string;
}

export async function getAddresses(): Promise<{ data?: AddressData[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Usuario nao autenticado' };

  const addresses = await prisma.address.findMany({
    where: { user_id: user.id },
    orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
  });

  return {
    data: addresses.map((addr) => ({
      id: addr.id,
      label: addr.label,
      street: addr.street,
      number: addr.number,
      complement: addr.complement || '',
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zip_code,
      isDefault: addr.is_default,
      createdAt: addr.created_at.toISOString(),
    })),
  };
}

const createAddressSchema = z.object({
  label: z.string().min(1),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export async function createAddress(
  formData: z.infer<typeof createAddressSchema>
): Promise<{ data?: AddressData; error?: string }> {
  const validation = createAddressSchema.safeParse(formData);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }
  const data = validation.data;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Usuario nao autenticado' };

  const addressCount = await prisma.address.count({ where: { user_id: user.id } });
  const isFirstAddress = addressCount === 0;

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { user_id: user.id },
      data: { is_default: false },
    });
  }

  const addr = await prisma.address.create({
    data: {
      user_id: user.id,
      label: data.label,
      street: data.street,
      number: data.number,
      complement: data.complement || null,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
      is_default: data.isDefault || isFirstAddress,
    },
  });

  return {
    data: {
      id: addr.id,
      label: addr.label,
      street: addr.street,
      number: addr.number,
      complement: addr.complement || '',
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zip_code,
      isDefault: addr.is_default,
      createdAt: addr.created_at.toISOString(),
    },
  };
}

const updateAddressSchema = z.object({
  label: z.string().min(1),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
});

export async function updateAddress(
  addressId: string,
  formData: z.infer<typeof updateAddressSchema>
): Promise<{ success?: boolean; error?: string }> {
  const validation = updateAddressSchema.safeParse(formData);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }
  const data = validation.data;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Usuario nao autenticado' };

  await prisma.address.updateMany({
    where: { id: addressId, user_id: user.id },
    data: {
      label: data.label,
      street: data.street,
      number: data.number,
      complement: data.complement || null,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      zip_code: data.zipCode,
    },
  });

  return { success: true };
}

export async function deleteAddress(
  addressId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Usuario nao autenticado' };

  await prisma.address.deleteMany({
    where: { id: addressId, user_id: user.id },
  });

  return { success: true };
}

export async function setDefaultAddress(
  addressId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Usuario nao autenticado' };

  await prisma.address.updateMany({
    where: { user_id: user.id },
    data: { is_default: false },
  });

  await prisma.address.updateMany({
    where: { id: addressId, user_id: user.id },
    data: { is_default: true },
  });

  return { success: true };
}
