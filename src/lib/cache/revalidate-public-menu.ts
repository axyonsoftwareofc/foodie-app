// src/lib/cache/revalidate-public-menu.ts
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { invalidateMenuCache } from '@/lib/cache/menu-cache';
import { logger } from '@/lib/logger';

/**
 * Revalida a pagina publica do cardapio (/r/[slug]) e invalida o cache Redis do menu.
 * Deve ser chamado em toda Server Action que modifica produtos ou categorias.
 *
 * Se `subdomain` for fornecido, evita uma query extra no banco.
 */
export async function revalidatePublicMenu(
  restaurantId: string,
  subdomain?: string
): Promise<void> {
  const slug = subdomain ?? (await resolveSubdomain(restaurantId));

  if (!slug) {
    logger.warn('Cannot revalidate public menu: restaurant has no subdomain', { restaurantId });
    return;
  }

  revalidatePath(`/r/${slug}`);
  void invalidateMenuCache(slug);

  logger.info('Public menu revalidated', { restaurantId, slug });
}

async function resolveSubdomain(restaurantId: string): Promise<string | null> {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { subdomain: true },
  });
  return restaurant?.subdomain ?? null;
}
