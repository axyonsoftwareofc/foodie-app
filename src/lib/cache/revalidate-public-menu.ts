// src/lib/cache/revalidate-public-menu.ts
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { redisDel, cacheKey } from '@/lib/redis';
import { logger } from '@/lib/logger';

/**
 * Revalida a pagina publica do cardapio (/r/[slug]) e invalida o cache Redis do menu.
 * Deve ser chamado em toda Server Action que modifica produtos ou categorias.
 */
export async function revalidatePublicMenu(restaurantId: string): Promise<void> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { subdomain: true },
  });

  if (!restaurant?.subdomain) {
    logger.warn('Cannot revalidate public menu: restaurant has no subdomain', { restaurantId });
    return;
  }

  const slug = restaurant.subdomain;

  // Revalida ISR da pagina publica do cardapio
  revalidatePath(`/r/${slug}`);

  // Invalida cache Redis do menu (tanto por slug quanto por restaurantId)
  void redisDel(cacheKey('menu', 'slug', slug));
  void redisDel(cacheKey('menu', 'restaurant', restaurantId));

  logger.info('Public menu revalidated', { restaurantId, slug });
}
