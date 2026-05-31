// src/actions/addresses.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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

export async function createAddress(formData: {
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}): Promise<{ data?: AddressData; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Usuario nao autenticado' };

  const addressCount = await prisma.address.count({ where: { user_id: user.id } });
  const isFirstAddress = addressCount === 0;

  if (formData.isDefault) {
    await prisma.address.updateMany({
      where: { user_id: user.id },
      data: { is_default: false },
    });
  }

  const addr = await prisma.address.create({
    data: {
      user_id: user.id,
      label: formData.label,
      street: formData.street,
      number: formData.number,
      complement: formData.complement || null,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zipCode,
      is_default: formData.isDefault || isFirstAddress,
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

export async function updateAddress(
  addressId: string,
  formData: {
    label: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Usuario nao autenticado' };

  await prisma.address.updateMany({
    where: { id: addressId, user_id: user.id },
    data: {
      label: formData.label,
      street: formData.street,
      number: formData.number,
      complement: formData.complement || null,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zipCode,
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
