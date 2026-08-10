// src/tests/unit/actions/productActions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createProduct,
  updateProduct,
  toggleProductAvailability,
  deleteProduct,
} from '@/actions/productActions';
import { prisma } from '@/lib/prisma';
import { getRestaurantAccess } from '@/lib/restaurant-access';

vi.mock('@/lib/restaurant-access', () => ({
  getRestaurantAccess: vi.fn(),
  MANAGEMENT_ROLES: ['OWNER', 'MANAGER'],
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: { findFirst: vi.fn() },
    product: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/redis', () => ({ redisDel: vi.fn(), cacheKey: (...p: string[]) => p.join(':') }));
vi.mock('@/lib/cache/revalidate-public-menu', () => ({ revalidatePublicMenu: vi.fn() }));

const MANAGEMENT_ROLES = ['OWNER', 'MANAGER'];

function managerAccess() {
  return {
    data: {
      user: { id: 'user-1', email: 'manager@x.com' },
      restaurant: { id: 'rest-1', name: 'Restaurante', slug: 'r', user_id: 'owner-1' },
      member: { id: 'member-1' },
      role: 'MANAGER',
      isOwner: false,
    },
  };
}

function productForm(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set('categoryId', 'cat-1');
  fd.set('name', 'Pizza');
  fd.set('price', '30,00');
  Object.entries(overrides).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

describe('productActions — autorização RBAC de gestão', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('createProduct', () => {
    it('autoriza via RBAC e cria o produto no restaurante do acesso', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.category.findFirst).mockResolvedValue({
        id: 'cat-1',
        restaurant_id: 'rest-1',
      } as never);
      vi.mocked(prisma.product.create).mockResolvedValue({ id: 'prod-1' } as never);

      const result = await createProduct(productForm());

      expect(getRestaurantAccess).toHaveBeenCalledWith(MANAGEMENT_ROLES);
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ restaurant_id: 'rest-1', category_id: 'cat-1' }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('nega quando a categoria não pertence ao restaurante do acesso', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null); // escopo não encontra

      const result = await createProduct(productForm());

      expect(result.error).toBeTruthy();
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('nega quando o papel não tem permissão de gestão', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue({
        error: 'Acesso negado para esta função',
      } as never);

      const result = await createProduct(productForm());

      expect(result.error).toBeTruthy();
      expect(prisma.product.create).not.toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('escopa o produto ao restaurante do acesso e atualiza', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.product.findFirst).mockResolvedValue({
        id: 'prod-1',
        restaurant_id: 'rest-1',
        category_id: 'cat-1',
      } as never);
      // A categoria enviada no form é revalidada contra o restaurante do acesso.
      vi.mocked(prisma.category.findFirst).mockResolvedValue({
        id: 'cat-1',
        restaurant_id: 'rest-1',
      } as never);
      vi.mocked(prisma.product.update).mockResolvedValue({ id: 'prod-1' } as never);

      const result = await updateProduct('prod-1', productForm());

      expect(prisma.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'prod-1', restaurant_id: 'rest-1' }),
        })
      );
      expect(prisma.product.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('nega quando o produto pertence a outro restaurante', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      const result = await updateProduct('prod-de-outro', productForm());

      expect(result.error).toBeTruthy();
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('toggleProductAvailability', () => {
    it('escopa o produto ao restaurante do acesso', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.product.findFirst).mockResolvedValue({
        id: 'prod-1',
        restaurant_id: 'rest-1',
        category_id: 'cat-1',
      } as never);
      vi.mocked(prisma.product.update).mockResolvedValue({ id: 'prod-1' } as never);

      const result = await toggleProductAvailability('prod-1', false);

      expect(prisma.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'prod-1', restaurant_id: 'rest-1' }),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('deleteProduct', () => {
    it('escopa o produto ao restaurante do acesso antes de excluir', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.product.findFirst).mockResolvedValue({
        id: 'prod-1',
        restaurant_id: 'rest-1',
        category_id: 'cat-1',
      } as never);
      vi.mocked(prisma.product.update).mockResolvedValue({ id: 'prod-1' } as never);

      const result = await deleteProduct('prod-1');

      expect(prisma.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'prod-1', restaurant_id: 'rest-1' }),
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
