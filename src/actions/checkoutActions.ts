'use server';

import { prisma } from '@/lib/prisma';
import type { Restaurant } from '@/types';

export async function getCheckoutRestaurant(
  restaurantId: string
): Promise<{ data?: Restaurant; error?: string }> {
  if (!restaurantId) {
    return { error: 'Restaurante invalido' };
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurantId,
      is_active: true,
    },
    select: {
      id: true,
      name: true,
      cover_image: true,
      logo: true,
      category: true,
      cuisine: true,
      delivery_fee: true,
      minimum_order: true,
      estimated_delivery_time: true,
      delivery_radius: true,
      latitude: true,
      longitude: true,
      street: true,
      number: true,
      status: true,
      description: true,
    },
  });

  if (!restaurant) {
    return { error: 'Restaurante nao encontrado' };
  }

  const estimatedTime = restaurant.estimated_delivery_time ?? 40;

  return {
    data: {
      id: restaurant.id,
      name: restaurant.name,
      image: restaurant.cover_image || restaurant.logo || '/placeholder.png',
      rating: 0,
      deliveryTime: `${estimatedTime} min`,
      deliveryFee: restaurant.delivery_fee ?? 0,
      category: restaurant.category || restaurant.cuisine || 'Restaurante',
      isOpen: restaurant.status === 'OPEN',
      description: restaurant.description || undefined,
      deliveryRadius: restaurant.delivery_radius || undefined,
      minimumOrder: restaurant.minimum_order || undefined,
      deliveryTimeMin: estimatedTime,
      deliveryTimeMax: estimatedTime,
      addressLat: restaurant.latitude || undefined,
      addressLng: restaurant.longitude || undefined,
      addressStreet: restaurant.street || undefined,
      addressNumber: restaurant.number || undefined,
    },
  };
}
