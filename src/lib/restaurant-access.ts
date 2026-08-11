import { cache } from 'react';
import { headers } from 'next/headers';
import type { RestaurantMember, RestaurantMemberRole, Prisma } from '@prisma/client';
import { UserRole } from '@prisma/client';
import type { User } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

type AccessRestaurant = {
  id: string;
  name: string;
  slug: string;
  user_id: string;
};

export type RestaurantAccess = {
  user: User;
  restaurant: AccessRestaurant;
  /**
   * Linha de `restaurant_members` do usuário. Pode ser `null` para um dono cujo
   * restaurante ainda não tem membro OWNER materializado (dados antigos) — a
   * autorização do dono vem de `restaurant.user_id`, não daqui.
   * Para provisionar, use `ensureOwnerMembership` ou o script de backfill.
   */
  member: RestaurantMember | null;
  role: RestaurantMemberRole;
  isOwner: boolean;
};

type AccessResult = { data: RestaurantAccess; error?: never } | { data?: never; error: string };

export const MANAGEMENT_ROLES: RestaurantMemberRole[] = ['OWNER', 'MANAGER'];
export const WAITER_ROLES: RestaurantMemberRole[] = ['OWNER', 'MANAGER', 'WAITER'];
export const DRIVER_ROLES: RestaurantMemberRole[] = ['OWNER', 'MANAGER', 'DRIVER'];
export const KITCHEN_ROLES: RestaurantMemberRole[] = ['OWNER', 'MANAGER', 'KITCHEN'];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hasAllowedRole(
  role: RestaurantMemberRole,
  allowedRoles?: RestaurantMemberRole[]
): boolean {
  return !allowedRoles || allowedRoles.includes(role);
}

async function getAuthenticatedUser(): Promise<{ user?: User; error?: string }> {
  // getServerSession usa cache() do React: uma única validação de sessão
  // (round-trip ao Auth do Supabase) por request, mesmo com vários call sites.
  const session = await getServerSession();

  if (!session?.user?.email) {
    return { error: 'Usuário não autenticado' };
  }

  return { user: session.user };
}

/**
 * Provisiona (cria ou corrige) o membro OWNER de um restaurante.
 *
 * É uma ESCRITA explícita — não chame em caminho de leitura/autorização.
 * Use na criação do restaurante e no script de backfill.
 */
export async function ensureOwnerMembership(
  user: Pick<User, 'id' | 'email'> & { user_metadata?: Record<string, unknown> },
  restaurantId: string
): Promise<RestaurantMember> {
  const email = normalizeEmail(user.email!);

  const existing = await prisma.restaurantMember.findFirst({
    where: {
      restaurant_id: restaurantId,
      OR: [{ user_id: user.id }, { email }],
    },
  });

  if (existing) {
    if (
      existing.user_id === user.id &&
      existing.email === email &&
      existing.role === 'OWNER' &&
      existing.status === 'ACTIVE'
    ) {
      return existing;
    }

    return prisma.restaurantMember.update({
      where: { id: existing.id },
      data: {
        user_id: user.id,
        email,
        full_name: existing.full_name ?? (user.user_metadata?.full_name as string | null) ?? null,
        role: 'OWNER',
        status: 'ACTIVE',
        joined_at: existing.joined_at ?? new Date(),
        disabled_at: null,
      },
    });
  }

  return prisma.restaurantMember.create({
    data: {
      restaurant_id: restaurantId,
      user_id: user.id,
      email,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      role: 'OWNER',
      status: 'ACTIVE',
      joined_at: new Date(),
    },
  });
}

/**
 * Garante que um membro ativo tenha ao menos a role global EQUIPE.
 *
 * ESCRITA explícita. O aceite de convite (`acceptRestaurantInvitation`) já faz
 * isso; esta função existe para a criação de restaurante e para o backfill.
 */
export async function ensureMinimumAppRole(
  userId: string,
  email: string,
  fullName: string | null
): Promise<void> {
  const normalized = normalizeEmail(email);
  const profile = await prisma.profile.findUnique({
    where: { email: normalized },
    select: { role: true },
  });

  if (!profile) {
    await prisma.profile.create({
      data: { id: userId, email: normalized, full_name: fullName, role: UserRole.EQUIPE },
    });
    return;
  }

  if (profile.role === UserRole.CLIENTE) {
    await prisma.profile.update({
      where: { email: normalized },
      data: { role: UserRole.EQUIPE },
    });
  }
}

/**
 * Resolve usuário + restaurante + membro. É a parte cara (sessão e queries) e
 * NÃO depende dos papéis exigidos — por isso pode ser cacheada por request.
 *
 * LEITURA PURA: nunca escreve. Provisionamento é explícito
 * (`ensureOwnerMembership` / `ensureMinimumAppRole`).
 */
async function loadRestaurantContext(): Promise<AccessResult> {
  const auth = await getAuthenticatedUser();
  if (!auth.user) return { error: auth.error ?? 'Usuário não autenticado' };

  const { user } = auth;
  const ownedRestaurant = await prisma.restaurant.findFirst({
    where: { user_id: user.id, is_active: true },
    select: { id: true, name: true, slug: true, user_id: true },
  });

  if (ownedRestaurant) {
    // A autorização do dono vem de restaurant.user_id. O membro é apenas a
    // identidade dele na equipe — pode não existir em dados antigos.
    const member = await prisma.restaurantMember.findFirst({
      where: { restaurant_id: ownedRestaurant.id, user_id: user.id, status: 'ACTIVE' },
    });

    return {
      data: {
        user,
        restaurant: ownedRestaurant,
        member,
        role: 'OWNER',
        isOwner: true,
      },
    };
  }

  const member = await prisma.restaurantMember.findFirst({
    where: {
      user_id: user.id,
      status: 'ACTIVE',
      restaurant: { is_active: true },
    },
    include: {
      restaurant: {
        select: { id: true, name: true, slug: true, user_id: true },
      },
    },
  });

  if (!member) {
    return { error: 'Usuário não está vinculado a um restaurante' };
  }

  return {
    data: {
      user,
      restaurant: member.restaurant,
      member,
      role: member.role,
      isOwner: false,
    },
  };
}

/** Contexto deduplicado por request via cache(). */
const loadRestaurantContextCached = cache(loadRestaurantContext);

/**
 * Portão de autorização: resolve o contexto (cacheado) e aplica a checagem de
 * papel. A checagem fica fora do cache porque varia por call site.
 *
 * Não escreve no banco.
 */
export async function getRestaurantAccess(
  allowedRoles?: RestaurantMemberRole[]
): Promise<AccessResult> {
  const context = await loadRestaurantContextCached();

  if (context.error || !context.data) {
    return { error: context.error ?? 'Usuário não autenticado' };
  }

  const access = context.data;

  if (!hasAllowedRole(access.role, allowedRoles)) {
    return {
      error: access.isOwner ? 'Acesso negado para esta operação' : 'Acesso negado para esta função',
    };
  }

  return { data: access };
}

export async function getAuditRequestMeta(): Promise<{
  ipAddress?: string;
  userAgent?: string;
}> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  return {
    ipAddress: forwardedFor?.split(',')[0]?.trim() || undefined,
    userAgent: headersList.get('user-agent') || undefined,
  };
}

export async function recordAuditLog(params: {
  restaurantId: string;
  actorUserId?: string | null;
  actorMemberId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const meta = await getAuditRequestMeta();
    await prisma.auditLog.create({
      data: {
        restaurant_id: params.restaurantId,
        actor_user_id: params.actorUserId,
        actor_member_id: params.actorMemberId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        metadata: params.metadata as unknown as Prisma.InputJsonValue,
        ip_address: meta.ipAddress,
        user_agent: meta.userAgent,
      },
    });
  } catch (error) {
    console.error('[AuditLog] Failed to write audit entry', error);
  }
}

/**
 * Regra de criação de restaurante.
 *
 * **Intencional:** não há exigência de role global. Quem cria um restaurante é
 * quem passa pelo fluxo de onboarding — inclusive um usuário recém-cadastrado,
 * que ainda nem tem `profile`. Os demais usuários são clientes (compram dos
 * restaurantes) e simplesmente não entram nesse fluxo.
 * A única restrição é **um restaurante ativo por usuário**.
 */
export async function canUserCreateRestaurant(
  userId: string
): Promise<{ allowed: boolean; error?: string }> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Usuário novo (sem profile): está começando o onboarding.
  if (!profile) {
    return { allowed: true };
  }

  const existingActive = await prisma.restaurant.findFirst({
    where: { user_id: userId, is_active: true },
    select: { id: true },
  });

  if (existingActive) {
    return { allowed: false, error: 'Voce ja possui um restaurante ativo' };
  }

  return { allowed: true };
}
