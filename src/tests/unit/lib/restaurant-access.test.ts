// src/tests/unit/lib/restaurant-access.test.ts
// Achado #2: autorização deve ser LEITURA PURA — o provisionamento
// (criar membro OWNER, promover profile) é explícito e mora em outro lugar.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRestaurantAccess, MANAGEMENT_ROLES } from '@/lib/restaurant-access';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({ getServerSession: vi.fn() }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    restaurant: { findFirst: vi.fn() },
    restaurantMember: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    profile: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

const OWNER_USER = { id: 'user-1', email: 'dono@x.com', user_metadata: {} };
const MEMBER_USER = { id: 'user-2', email: 'gerente@x.com', user_metadata: {} };

const RESTAURANT = { id: 'rest-1', name: 'R', slug: 'r', user_id: 'user-1' };

function expectNoWrites() {
  expect(prisma.restaurantMember.create).not.toHaveBeenCalled();
  expect(prisma.restaurantMember.update).not.toHaveBeenCalled();
  expect(prisma.profile.create).not.toHaveBeenCalled();
  expect(prisma.profile.update).not.toHaveBeenCalled();
}

describe('getRestaurantAccess — leitura pura', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('autoriza o dono e não escreve no banco', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: OWNER_USER } as never);
    vi.mocked(prisma.restaurant.findFirst).mockResolvedValue(RESTAURANT as never);
    vi.mocked(prisma.restaurantMember.findFirst).mockResolvedValue({
      id: 'member-1',
      role: 'OWNER',
      status: 'ACTIVE',
    } as never);

    const result = await getRestaurantAccess(MANAGEMENT_ROLES);

    expect(result.data?.isOwner).toBe(true);
    expect(result.data?.role).toBe('OWNER');
    expect(result.data?.restaurant.id).toBe('rest-1');
    expectNoWrites();
  });

  it('autoriza o dono mesmo sem linha de membro, sem provisionar', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: OWNER_USER } as never);
    vi.mocked(prisma.restaurant.findFirst).mockResolvedValue(RESTAURANT as never);
    // Dono antigo: nenhuma linha em restaurant_members
    vi.mocked(prisma.restaurantMember.findFirst).mockResolvedValue(null);

    const result = await getRestaurantAccess(MANAGEMENT_ROLES);

    // A autorização do dono vem de restaurant.user_id — não do membro.
    expect(result.error).toBeUndefined();
    expect(result.data?.isOwner).toBe(true);
    expect(result.data?.member).toBeNull();
    expectNoWrites();
  });

  it('autoriza membro ativo sem promover o profile', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: MEMBER_USER } as never);
    vi.mocked(prisma.restaurant.findFirst).mockResolvedValue(null); // não é dono
    vi.mocked(prisma.restaurantMember.findFirst).mockResolvedValue({
      id: 'member-9',
      role: 'MANAGER',
      status: 'ACTIVE',
      restaurant: RESTAURANT,
    } as never);

    const result = await getRestaurantAccess(MANAGEMENT_ROLES);

    expect(result.data?.role).toBe('MANAGER');
    expect(result.data?.isOwner).toBe(false);
    // ensureMinimumAppRole saiu do caminho de acesso: nem sequer consulta o profile.
    expect(prisma.profile.findUnique).not.toHaveBeenCalled();
    expectNoWrites();
  });

  it('nega quando o papel do membro não está na lista permitida', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: MEMBER_USER } as never);
    vi.mocked(prisma.restaurant.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.restaurantMember.findFirst).mockResolvedValue({
      id: 'member-9',
      role: 'WAITER',
      status: 'ACTIVE',
      restaurant: RESTAURANT,
    } as never);

    const result = await getRestaurantAccess(MANAGEMENT_ROLES);

    expect(result.data).toBeUndefined();
    expect(result.error).toBeTruthy();
    expectNoWrites();
  });

  it('nega quando não há sessão', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const result = await getRestaurantAccess();

    expect(result.error).toBeTruthy();
    expect(prisma.restaurant.findFirst).not.toHaveBeenCalled();
  });
});
