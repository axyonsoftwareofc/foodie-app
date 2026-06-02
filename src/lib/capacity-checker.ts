// src/lib/capacity-checker.ts
import { prisma } from '@/lib/prisma';
import { RestaurantStatus } from '@prisma/client';

const DEFAULT_BUSY_THRESHOLD = 10;
const EXTRA_TIME_PER_ORDER_MINUTES = 5;

export async function recalculateRestaurantCapacity(restaurantId: string): Promise<void> {
  try {
    const activeCount = await prisma.order.count({
      where: {
        restaurant_id: restaurantId,
        status: { in: ['CONFIRMED', 'PREPARING'] },
      },
    });

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { status: true, estimated_delivery_time: true },
    });

    if (!restaurant) return;

    const threshold = DEFAULT_BUSY_THRESHOLD;
    const shouldBeBusy = activeCount >= threshold;
    const baseTime = restaurant.estimated_delivery_time ?? 30;

    if (shouldBeBusy && restaurant.status !== 'BUSY') {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          status: RestaurantStatus.BUSY,
          estimated_delivery_time: baseTime + activeCount * EXTRA_TIME_PER_ORDER_MINUTES,
        },
      });
    } else if (!shouldBeBusy && restaurant.status === 'BUSY') {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          status: RestaurantStatus.OPEN,
          estimated_delivery_time:
            baseTime - Math.max(0, (activeCount - 1) * EXTRA_TIME_PER_ORDER_MINUTES),
        },
      });
    }
  } catch (error) {
    console.error('[Capacity] Failed to recalculate capacity', error);
  }
}
