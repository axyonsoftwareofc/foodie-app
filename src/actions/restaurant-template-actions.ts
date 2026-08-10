// src/actions/restaurant-template-actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { getTemplate } from '@/lib/menu-templates';
import { getRestaurantAccess, MANAGEMENT_ROLES } from '@/lib/restaurant-access';

export async function populateRestaurantTemplate(
  restaurantId: string,
  templateId: string
): Promise<{ success?: boolean; error?: string }> {
  const access = await getRestaurantAccess(MANAGEMENT_ROLES);
  if (access.error || !access.data) return { error: access.error || 'Não autorizado' };
  if (access.data.restaurant.id !== restaurantId) {
    return { error: 'Acesso negado a este restaurante' };
  }

  const template = getTemplate(templateId);
  if (!template) return { error: 'Template nao encontrado' };

  try {
    for (const category of template.categories) {
      const createdCategory = await prisma.category.create({
        data: {
          restaurant_id: restaurantId,
          name: category.name,
          sort_order: template.categories.indexOf(category),
        },
      });

      for (const item of category.items) {
        await prisma.product.create({
          data: {
            restaurant_id: restaurantId,
            category_id: createdCategory.id,
            name: item.name,
            description: item.description,
            price: item.price,
            image: item.image || null,
            is_active: true,
            is_available: true,
          },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[Template] Failed to populate restaurant template', error);
    return { error: 'Erro ao popular o cardapio' };
  }
}
