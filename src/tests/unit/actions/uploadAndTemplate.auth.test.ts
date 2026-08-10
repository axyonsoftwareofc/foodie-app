// src/tests/unit/actions/uploadAndTemplate.auth.test.ts
// Achado #1: upload de imagem e template de cardápio via RBAC de gestão.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadRestaurantImage } from '@/actions/upload-actions';
import { populateRestaurantTemplate } from '@/actions/restaurant-template-actions';
import { prisma } from '@/lib/prisma';
import { getRestaurantAccess } from '@/lib/restaurant-access';
import { getTemplate } from '@/lib/menu-templates';

vi.mock('@/lib/restaurant-access', () => ({
  getRestaurantAccess: vi.fn(),
  MANAGEMENT_ROLES: ['OWNER', 'MANAGER'],
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: { create: vi.fn() },
    product: { create: vi.fn() },
  },
}));

vi.mock('@/lib/menu-templates', () => ({ getTemplate: vi.fn() }));
vi.mock('cloudinary', () => ({
  v2: { config: vi.fn(), uploader: { upload: vi.fn() } },
}));

const MANAGEMENT_ROLES = ['OWNER', 'MANAGER'];

function managerAccess() {
  return {
    data: {
      user: { id: 'user-1', email: 'm@x.com' },
      restaurant: { id: 'rest-1', name: 'R', slug: 'r', user_id: 'owner-1' },
      member: { id: 'm1' },
      role: 'MANAGER',
      isOwner: false,
    },
  };
}

describe('uploadRestaurantImage — RBAC de gestão', () => {
  beforeEach(() => vi.resetAllMocks());

  it('nega quando o papel não tem permissão de gestão', async () => {
    vi.mocked(getRestaurantAccess).mockResolvedValue({ error: 'Acesso negado' } as never);

    const result = await uploadRestaurantImage(new FormData());

    expect(getRestaurantAccess).toHaveBeenCalledWith(MANAGEMENT_ROLES);
    expect(result.error).toBeTruthy();
  });
});

describe('populateRestaurantTemplate — RBAC de gestão', () => {
  beforeEach(() => vi.resetAllMocks());

  it('nega quando o papel não tem permissão de gestão', async () => {
    vi.mocked(getRestaurantAccess).mockResolvedValue({ error: 'Acesso negado' } as never);

    const result = await populateRestaurantTemplate('rest-1', 'tpl-1');

    expect(getRestaurantAccess).toHaveBeenCalledWith(MANAGEMENT_ROLES);
    expect(result.error).toBeTruthy();
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it('nega quando o restaurantId não é o do acesso', async () => {
    vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);

    const result = await populateRestaurantTemplate('rest-OUTRO', 'tpl-1');

    expect(result.error).toBeTruthy();
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it('popula o cardápio no restaurante do acesso', async () => {
    vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);
    vi.mocked(getTemplate).mockReturnValue({
      categories: [{ name: 'Bebidas', items: [{ name: 'Suco', description: '', price: 5 }] }],
    } as never);
    vi.mocked(prisma.category.create).mockResolvedValue({ id: 'cat-1' } as never);
    vi.mocked(prisma.product.create).mockResolvedValue({ id: 'prod-1' } as never);

    const result = await populateRestaurantTemplate('rest-1', 'tpl-1');

    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ restaurant_id: 'rest-1' }) })
    );
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ restaurant_id: 'rest-1' }) })
    );
    expect(result.success).toBe(true);
  });
});
