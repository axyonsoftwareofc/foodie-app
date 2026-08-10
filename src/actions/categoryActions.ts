// src/actions/categoryActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redisDel, cacheKey } from '@/lib/redis';
import { z } from 'zod';
import { getRestaurantAccess, MANAGEMENT_ROLES } from '@/lib/restaurant-access';
import { revalidatePublicMenu } from '@/lib/cache/revalidate-public-menu';

const categorySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export async function getCategories(restaurantId: string) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        restaurant_id: restaurantId,
        is_active: true,
      },
      orderBy: {
        sort_order: 'asc',
      },
    });

    return { categories, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { error: 'Erro ao buscar categorias', categories: [] };
  }
}

export async function getCategory(categoryId: string) {
  try {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        is_active: true,
      },
    });

    if (!category) {
      return { error: 'Categoria não encontrada', category: null };
    }

    return { category, error: null };
  } catch (error) {
    console.error('Error fetching category:', error);
    return { error: 'Erro ao buscar categoria', category: null };
  }
}

export async function createCategory(formData: FormData) {
  try {
    // Autorização por RBAC de membros: OWNER/MANAGER podem gerir o cardápio.
    const access = await getRestaurantAccess(MANAGEMENT_ROLES);
    if (access.error || !access.data) {
      return { error: access.error || 'Não autorizado' };
    }
    // O restaurante vem do acesso do usuário — nunca do formulário (anti-spoofing).
    const restaurantId = access.data.restaurant.id;

    const data = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      icon: (formData.get('icon') as string) || undefined,
      image: (formData.get('image') as string) || undefined,
      sortOrder: formData.get('sortOrder') ? Number(formData.get('sortOrder')) : 0,
    };

    const result = categorySchema.safeParse(data);

    if (!result.success) {
      return { error: result.error.issues[0].message };
    }

    const category = await prisma.category.create({
      data: {
        restaurant_id: restaurantId,
        name: result.data.name,
        description: result.data.description,
        icon: result.data.icon,
        image: result.data.image,
        sort_order: result.data.sortOrder,
      },
    });

    revalidatePath('/dashboard/menu');
    void redisDel(cacheKey('restaurants', 'public-list'));
    void revalidatePublicMenu(restaurantId);
    return { category, success: true };
  } catch (error) {
    console.error('Error creating category:', error);
    return { error: 'Erro ao criar categoria' };
  }
}

export async function updateCategory(categoryId: string, formData: FormData) {
  try {
    const access = await getRestaurantAccess(MANAGEMENT_ROLES);
    if (access.error || !access.data) {
      return { error: access.error || 'Não autorizado' };
    }

    const categoryOwner = await prisma.category.findFirst({
      where: { id: categoryId, restaurant_id: access.data.restaurant.id },
      select: { id: true, restaurant_id: true },
    });
    if (!categoryOwner) {
      return { error: 'Não autorizado ou categoria não encontrada' };
    }

    const data = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      icon: (formData.get('icon') as string) || null,
      image: (formData.get('image') as string) || null,
      sort_order: formData.get('sortOrder') ? Number(formData.get('sortOrder')) : 0,
    };

    const category = await prisma.category.update({
      where: {
        id: categoryId,
      },
      data,
    });

    revalidatePath('/dashboard/menu');
    void redisDel(cacheKey('restaurants', 'public-list'));
    void revalidatePublicMenu(categoryOwner.restaurant_id);
    return { category, success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { error: 'Erro ao atualizar categoria' };
  }
}

export async function reorderCategories(_restaurantId: string, categoryIds: string[]) {
  try {
    const access = await getRestaurantAccess(MANAGEMENT_ROLES);
    if (access.error || !access.data) {
      return { error: access.error || 'Não autorizado' };
    }
    // Escopo pelo restaurante do acesso, ignorando o id recebido (anti-spoofing).
    const restaurantId = access.data.restaurant.id;

    const categoriesCount = await prisma.category.count({
      where: {
        id: { in: categoryIds },
        restaurant_id: restaurantId,
      },
    });

    if (categoriesCount !== categoryIds.length) {
      return { error: 'Lista de categorias inválida para este restaurante' };
    }

    await Promise.all(
      categoryIds.map((id, index) =>
        prisma.category.update({
          where: { id },
          data: { sort_order: index },
        })
      )
    );

    revalidatePath('/dashboard/menu');
    void redisDel(cacheKey('restaurants', 'public-list'));
    void revalidatePublicMenu(restaurantId);
    return { success: true };
  } catch (error) {
    console.error('Error reordering categories:', error);
    return { error: 'Erro ao reordenar categorias' };
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    const access = await getRestaurantAccess(MANAGEMENT_ROLES);
    if (access.error || !access.data) {
      return { error: access.error || 'Não autorizado' };
    }

    const categoryOwner = await prisma.category.findFirst({
      where: { id: categoryId, restaurant_id: access.data.restaurant.id },
      select: { id: true, restaurant_id: true },
    });
    if (!categoryOwner) {
      return { error: 'Não autorizado ou categoria não encontrada' };
    }

    const productsCount = await prisma.product.count({
      where: {
        category_id: categoryId,
        is_active: true,
      },
    });

    if (productsCount > 0) {
      return {
        error: `Não é possível excluir. Existem ${productsCount} produto(s) nesta categoria.`,
      };
    }

    await prisma.category.update({
      where: {
        id: categoryId,
      },
      data: {
        is_active: false,
      },
    });

    revalidatePath('/dashboard/menu');
    void redisDel(cacheKey('restaurants', 'public-list'));
    void revalidatePublicMenu(categoryOwner.restaurant_id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { error: 'Erro ao excluir categoria' };
  }
}
