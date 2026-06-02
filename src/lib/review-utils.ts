// src/lib/review-utils.ts
import { prisma } from '@/lib/prisma';

export async function recalculateRestaurantRating(restaurantId: string): Promise<void> {
  try {
    const result = await prisma.review.aggregate({
      where: { restaurant_id: restaurantId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        avg_rating: result._avg.rating ?? 0,
        review_count: result._count.rating,
      },
    });
  } catch (error) {
    console.error('[ReviewUtils] Failed to recalculate rating', error);
  }
}
