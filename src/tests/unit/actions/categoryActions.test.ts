// src/tests/unit/actions/categoryActions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from '@/actions/categoryActions';
import { prisma } from '@/lib/prisma';
import { getRestaurantAccess } from '@/lib/restaurant-access';

// Autorização por RBAC de membros — o cardápio deve ser gerido por OWNER/MANAGER.
vi.mock('@/lib/restaurant-access', () => ({
  getRestaurantAccess: vi.fn(),
  MANAGEMENT_ROLES: ['OWNER', 'MANAGER'],
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    product: {
      count: vi.fn(),
    },
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

describe('categoryActions — autorização RBAC de gestão', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('createCategory', () => {
    it('autoriza via getRestaurantAccess(MANAGEMENT_ROLES) e cria no restaurante do usuário', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.category.create).mockResolvedValue({ id: 'cat-1' } as never);

      const fd = new FormData();
      fd.set('name', 'Bebidas');

      const result = await createCategory(fd);

      expect(getRestaurantAccess).toHaveBeenCalledWith(MANAGEMENT_ROLES);
      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ restaurant_id: 'rest-1', name: 'Bebidas' }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('ignora restaurantId do formulário e usa o restaurante do acesso (anti-spoofing)', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.category.create).mockResolvedValue({ id: 'cat-1' } as never);

      const fd = new FormData();
      fd.set('name', 'Sobremesas');
      fd.set('restaurantId', 'rest-OUTRO');

      await createCategory(fd);

      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ restaurant_id: 'rest-1' }),
        })
      );
    });

    it('nega quando o papel não tem permissão de gestão', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue({
        error: 'Acesso negado para esta função',
      } as never);

      const fd = new FormData();
      fd.set('name', 'Bebidas');

      const result = await createCategory(fd);

      expect(result.error).toBeTruthy();
      expect(prisma.category.create).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('escopa a categoria ao restaurante do acesso e atualiza', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.category.findFirst).mockResolvedValue({
        id: 'cat-1',
        restaurant_id: 'rest-1',
      } as never);
      vi.mocked(prisma.category.update).mockResolvedValue({ id: 'cat-1' } as never);

      const fd = new FormData();
      fd.set('name', 'Novo nome');

      const result = await updateCategory('cat-1', fd);

      expect(prisma.category.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'cat-1', restaurant_id: 'rest-1' }),
        })
      );
      expect(prisma.category.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('nega quando a categoria pertence a outro restaurante', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null); // query escopada não encontra

      const result = await updateCategory('cat-de-outro', new FormData());

      expect(result.error).toBeTruthy();
      expect(prisma.category.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('escopa a categoria ao restaurante do acesso antes de excluir', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.category.findFirst).mockResolvedValue({
        id: 'cat-1',
        restaurant_id: 'rest-1',
      } as never);
      vi.mocked(prisma.product.count).mockResolvedValue(0 as never);
      vi.mocked(prisma.category.update).mockResolvedValue({ id: 'cat-1' } as never);

      const result = await deleteCategory('cat-1');

      expect(prisma.category.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'cat-1', restaurant_id: 'rest-1' }),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('reorderCategories', () => {
    it('escopa a contagem ao restaurante do acesso, não ao restaurantId recebido', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
      vi.mocked(prisma.category.count).mockResolvedValue(2 as never);
      vi.mocked(prisma.category.update).mockResolvedValue({ id: 'x' } as never);

      const result = await reorderCategories('rest-IGNORADO', ['a', 'b']);

      expect(prisma.category.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ restaurant_id: 'rest-1' }),
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
