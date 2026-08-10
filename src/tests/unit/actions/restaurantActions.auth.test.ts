// src/tests/unit/actions/restaurantActions.auth.test.ts
// Contrato de autorização (achado #1): config do restaurante via RBAC de membros.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateRestaurantProfile,
  updateOperatingHours,
  updateBankInfo,
  toggleRestaurantStatus,
  updateTableStatus,
} from '@/actions/restaurantActions';
import { prisma } from '@/lib/prisma';
import { getRestaurantAccess } from '@/lib/restaurant-access';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/restaurant-access', () => ({
  getRestaurantAccess: vi.fn(),
  MANAGEMENT_ROLES: ['OWNER', 'MANAGER'],
  WAITER_ROLES: ['OWNER', 'MANAGER', 'WAITER'],
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    restaurant: { findFirst: vi.fn(), update: vi.fn() },
    restaurantTable: { findFirst: vi.fn() },
  },
}));

// Cadeia de query encadeável E "awaitable" (from().update().eq() etc.).
// A cadeia é thenable; o CLIENTE não é (senão o await de createClient a desembrulharia).
const queryChain: Record<string, unknown> = {};
const supabaseClient = { from: vi.fn(() => queryChain) };

function resetSupabaseStub() {
  ['update', 'eq', 'select', 'insert', 'delete', 'order', 'limit'].forEach((m) => {
    queryChain[m] = vi.fn(() => queryChain);
  });
  queryChain.single = vi.fn(() => Promise.resolve({ data: { id: 'x' }, error: null }));
  queryChain.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: null });
  supabaseClient.from = vi.fn(() => queryChain);
}
resetSupabaseStub();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => supabaseClient),
}));

vi.mock('@/lib/redis', () => ({ redisDel: vi.fn(), cacheKey: (...p: string[]) => p.join(':') }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const MANAGEMENT_ROLES = ['OWNER', 'MANAGER'];
const WAITER_ROLES = ['OWNER', 'MANAGER', 'WAITER'];

function access(role: string, isOwner: boolean) {
  return {
    data: {
      user: { id: 'user-1', email: 'x@x.com' },
      restaurant: { id: 'rest-1', name: 'R', slug: 'r', user_id: 'owner-1' },
      member: { id: 'm1' },
      role,
      isOwner,
    },
  };
}

describe('restaurantActions — autorização RBAC (config)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetSupabaseStub(); // resetAllMocks zera implementações — reconstrói a cadeia
    vi.mocked(createClient).mockResolvedValue(supabaseClient as never);
  });

  describe('updateBankInfo — somente OWNER', () => {
    it('exige papel OWNER', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(access('OWNER', true) as never);
      vi.mocked(prisma.restaurant.update).mockResolvedValue({ id: 'rest-1' } as never);

      const result = await updateBankInfo({ bank: 'Itau' } as never);

      expect(getRestaurantAccess).toHaveBeenCalledWith(['OWNER']);
      expect(prisma.restaurant.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rest-1' } })
      );
      expect(result.success).toBe(true);
    });

    it('nega quando não é OWNER (getRestaurantAccess retorna erro)', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue({ error: 'Acesso negado' } as never);

      const result = await updateBankInfo({ bank: 'Itau' } as never);

      expect(result.error).toBeTruthy();
      expect(prisma.restaurant.update).not.toHaveBeenCalled();
    });
  });

  describe('updateRestaurantProfile — gestão (OWNER/MANAGER)', () => {
    it('autoriza via MANAGEMENT_ROLES e escreve no restaurante do acesso', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(access('MANAGER', false) as never);
      vi.mocked(prisma.restaurant.update).mockResolvedValue({ id: 'rest-1' } as never);

      const result = await updateRestaurantProfile({ name: 'Novo' } as never);

      expect(getRestaurantAccess).toHaveBeenCalledWith(MANAGEMENT_ROLES);
      expect(prisma.restaurant.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rest-1' } })
      );
      expect(result.success).toBe(true);
    });

    it('NÃO grava bank_info quando o autor não é OWNER (bancário é OWNER-only)', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(access('MANAGER', false) as never);
      vi.mocked(prisma.restaurant.update).mockResolvedValue({ id: 'rest-1' } as never);

      await updateRestaurantProfile({ bankInfo: { bank: 'Fraude' } } as never);

      const call = vi.mocked(prisma.restaurant.update).mock.calls[0]?.[0] as
        | { data?: Record<string, unknown> }
        | undefined;
      expect(call?.data).not.toHaveProperty('bank_info');
    });

    it('grava bank_info quando o autor é OWNER', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(access('OWNER', true) as never);
      vi.mocked(prisma.restaurant.update).mockResolvedValue({ id: 'rest-1' } as never);

      await updateRestaurantProfile({ bankInfo: { bank: 'Itau' } } as never);

      const call = vi.mocked(prisma.restaurant.update).mock.calls[0]?.[0] as
        | { data?: Record<string, unknown> }
        | undefined;
      expect(call?.data).toHaveProperty('bank_info');
    });
  });

  describe('updateOperatingHours — gestão', () => {
    it('autoriza via MANAGEMENT_ROLES e escopa ao restaurante do acesso', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(access('MANAGER', false) as never);
      vi.mocked(prisma.restaurant.update).mockResolvedValue({ id: 'rest-1' } as never);

      const result = await updateOperatingHours([] as never);

      expect(getRestaurantAccess).toHaveBeenCalledWith(MANAGEMENT_ROLES);
      expect(prisma.restaurant.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rest-1' } })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('toggleRestaurantStatus — gestão', () => {
    it('autoriza via MANAGEMENT_ROLES', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(access('MANAGER', false) as never);
      vi.mocked(prisma.restaurant.update).mockResolvedValue({ id: 'rest-1' } as never);

      const result = await toggleRestaurantStatus('rest-IGNORADO', false);

      expect(getRestaurantAccess).toHaveBeenCalledWith(MANAGEMENT_ROLES);
      expect(prisma.restaurant.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rest-1' } })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('updateTableStatus — inclui WAITER', () => {
    it('autoriza via WAITER_ROLES e escopa a mesa ao restaurante do acesso', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(access('WAITER', false) as never);
      vi.mocked(prisma.restaurantTable.findFirst).mockResolvedValue({
        id: 'table-1',
        restaurant_id: 'rest-1',
      } as never);

      const result = await updateTableStatus('table-1', 'OCCUPIED' as never);

      expect(getRestaurantAccess).toHaveBeenCalledWith(WAITER_ROLES);
      expect(prisma.restaurantTable.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'table-1', restaurant_id: 'rest-1' }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('nega quando a mesa pertence a outro restaurante', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(access('WAITER', false) as never);
      vi.mocked(prisma.restaurantTable.findFirst).mockResolvedValue(null);

      const result = await updateTableStatus('table-outra', 'OCCUPIED' as never);

      expect(result.error).toBeTruthy();
    });
  });
});
