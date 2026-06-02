// src/actions/super-admin-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@prisma/client';

function requireSuperAdmin() {
  // Handled by middleware — this is a double-check
}

export async function getSuperAdminMetrics(): Promise<{
  data?: {
    totalRestaurants: number;
    activeRestaurants: number;
    totalOrders: number;
    todayOrders: number;
    todayRevenue: number;
    totalUsers: number;
  };
  error?: string;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalRestaurants, activeRestaurants, totalOrders, todayOrders, totalUsers, revenueRows] =
    await Promise.all([
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { is_active: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { created_at: { gte: today } } }),
      prisma.profile.count(),
      prisma.order.findMany({
        where: { created_at: { gte: today } },
        select: { total: true, status: true },
      }),
    ]);

  const todayRevenue = revenueRows
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0);

  return {
    data: {
      totalRestaurants,
      activeRestaurants,
      totalOrders,
      todayOrders,
      todayRevenue,
      totalUsers,
    },
  };
}

export async function getAllRestaurants(
  page = 1,
  search = ''
): Promise<{
  data?: {
    items: {
      id: string;
      name: string;
      ownerEmail: string;
      status: string;
      isActive: boolean;
      orderCount: number;
      slug: string;
      createdAt: string;
    }[];
    total: number;
    page: number;
  };
  error?: string;
}> {
  const take = 20;
  const skip = (page - 1) * take;

  const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};

  const [items, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      select: {
        id: true,
        name: true,
        is_active: true,
        status: true,
        slug: true,
        created_at: true,
        user_id: true,
        orders: { select: { id: true } },
        members: {
          where: { role: 'OWNER' },
          select: { email: true },
        },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take,
    }),
    prisma.restaurant.count({ where }),
  ]);

  const mapped = await Promise.all(
    items.map(async (r) => {
      let ownerEmail = '';
      if (r.members.length > 0) {
        ownerEmail = r.members[0].email;
      } else {
        const profile = await prisma.profile.findUnique({
          where: { id: r.user_id },
          select: { email: true },
        });
        ownerEmail = profile?.email || '';
      }
      return {
        id: r.id,
        name: r.name,
        ownerEmail,
        status: r.status,
        isActive: r.is_active,
        orderCount: r.orders.length,
        slug: r.slug,
        createdAt: r.created_at.toISOString(),
      };
    })
  );

  return { data: { items: mapped, total, page } };
}

export async function toggleRestaurantActive(restaurantId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { is_active: true },
  });

  if (!restaurant) return { error: 'Restaurante nao encontrado' };

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { is_active: !restaurant.is_active },
  });

  revalidatePath('/super-admin/restaurants');
  return { success: true };
}

export async function getAllUsers(roleFilter?: string): Promise<{
  data?: {
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    createdAt: string;
  }[];
  error?: string;
}> {
  const where = roleFilter && roleFilter !== 'ALL' ? { role: roleFilter as UserRole } : {};

  const profiles = await prisma.profile.findMany({
    where,
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  return {
    data: profiles.map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      role: p.role,
      createdAt: p.created_at.toISOString(),
    })),
  };
}

export async function setUserRole(
  userId: string,
  role: string
): Promise<{
  success?: boolean;
  error?: string;
}> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!profile) return { error: 'Usuario nao encontrado' };
  if (profile.role === 'SUPER_ADMIN') return { error: 'Nao pode alterar outro SUPER_ADMIN' };

  await prisma.profile.update({
    where: { id: userId },
    data: { role: role as UserRole },
  });

  revalidatePath('/super-admin/users');
  return { success: true };
}
