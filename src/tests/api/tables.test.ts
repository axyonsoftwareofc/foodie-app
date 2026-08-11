// src/tests/api/tables.test.ts
// Contrato de autorização da rota de mesas (auditoria, achado #12):
// deve usar o RBAC de membros e escopar tudo ao restaurante do acesso.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from '@/app/api/tables/route';
import { getRestaurantAccess } from '@/lib/restaurant-access';
import { createClient } from '@/lib/supabase/server';
import * as rateLimitModule from '@/lib/rate-limit';

const { checkRateLimit, getClientIp } = rateLimitModule;

vi.mock('@/lib/rate-limit');

vi.mock('@/lib/restaurant-access', () => ({
  getRestaurantAccess: vi.fn(),
  MANAGEMENT_ROLES: ['OWNER', 'MANAGER'],
}));

// Cadeia de query encadeável e "awaitable"; o cliente em si não é thenable.
const queryChain: Record<string, unknown> = {};
const supabaseClient = { from: vi.fn(() => queryChain) };

function resetSupabaseStub() {
  ['select', 'insert', 'delete', 'eq', 'order'].forEach((m) => {
    queryChain[m] = vi.fn(() => queryChain);
  });
  queryChain.single = vi.fn(() => Promise.resolve({ data: { id: 'table-1' }, error: null }));
  queryChain.then = (resolve: (v: unknown) => void) =>
    resolve({ data: [{ id: 'table-1' }], error: null });
  supabaseClient.from = vi.fn(() => queryChain);
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
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

describe('/api/tables — autorização RBAC', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetSupabaseStub();
    vi.mocked(createClient).mockResolvedValue(supabaseClient as never);
    vi.mocked(checkRateLimit).mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60_000,
    });
    vi.mocked(getClientIp).mockReturnValue('127.0.0.1');
  });

  describe('GET', () => {
    it('autoriza via RBAC e escopa a listagem ao restaurante do acesso', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);

      const res = await GET(new Request('http://localhost/api/tables') as never);

      expect(getRestaurantAccess).toHaveBeenCalledWith(MANAGEMENT_ROLES);
      expect(queryChain.eq).toHaveBeenCalledWith('restaurant_id', 'rest-1');
      expect(res.status).toBe(200);
    });

    it('nega quando o papel não tem permissão de gestão', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue({ error: 'Acesso negado' } as never);

      const res = await GET(new Request('http://localhost/api/tables') as never);

      expect(res.status).toBe(403);
    });
  });

  describe('POST', () => {
    function postRequest(body: unknown) {
      return new Request('http://localhost/api/tables', {
        method: 'POST',
        body: JSON.stringify(body),
      }) as never;
    }

    it('cria a mesa no restaurante do acesso', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);

      const res = await POST(postRequest({ number: '12', capacity: 4 }));

      expect(getRestaurantAccess).toHaveBeenCalledWith(MANAGEMENT_ROLES);
      expect(queryChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ restaurant_id: 'rest-1', number: '12' })
      );
      expect(res.status).toBe(201);
    });

    it('nega quando o papel não tem permissão de gestão', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue({ error: 'Acesso negado' } as never);

      const res = await POST(postRequest({ number: '12' }));

      expect(res.status).toBe(403);
      expect(queryChain.insert).not.toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    function deleteRequest(id?: string) {
      const url = id ? `http://localhost/api/tables?id=${id}` : 'http://localhost/api/tables';
      return { nextUrl: new URL(url), headers: new Headers() } as never;
    }

    it('exclui escopando ao restaurante do acesso', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue(managerAccess() as never);

      const res = await DELETE(deleteRequest('table-1'));

      expect(getRestaurantAccess).toHaveBeenCalledWith(MANAGEMENT_ROLES);
      expect(queryChain.eq).toHaveBeenCalledWith('restaurant_id', 'rest-1');
      expect(res.status).toBe(200);
    });

    it('nega quando o papel não tem permissão de gestão', async () => {
      vi.mocked(getRestaurantAccess).mockResolvedValue({ error: 'Acesso negado' } as never);

      const res = await DELETE(deleteRequest('table-1'));

      expect(res.status).toBe(403);
      expect(queryChain.delete).not.toHaveBeenCalled();
    });
  });
});
