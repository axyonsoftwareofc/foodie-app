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
  member: RestaurantMember;
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

async function ensureOwnerMember(
  user: User,
  restaurant: AccessRestaurant
): Promise<RestaurantMember> {
  const email = normalizeEmail(user.email!);

  const existing = await prisma.restaurantMember.findFirst({
    where: {
      restaurant_id: restaurant.id,
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
        full_name: existing.full_name ?? user.user_metadata?.full_name ?? null,
        role: 'OWNER',
        status: 'ACTIVE',
        joined_at: existing.joined_at ?? new Date(),
        disabled_at: null,
      },
    });
  }

  return prisma.restaurantMember.create({
    data: {
      restaurant_id: restaurant.id,
      user_id: user.id,
      email,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      role: 'OWNER',
      status: 'ACTIVE',
      joined_at: new Date(),
    },
  });
}

// Chaveado por primitivos e envolvido em cache(): roda no máximo uma vez por
// request, mesmo quando vários call sites resolvem acesso na mesma renderização.
const ensureMinimumAppRole = cache(
  async (userId: string, email: string, fullName: string | null): Promise<void> => {
    const profile = await prisma.profile.findUnique({ where: { email }, select: { role: true } });

    if (!profile) {
      await prisma.profile.create({
        data: {
          id: userId,
          email,
          full_name: fullName,
          role: UserRole.EQUIPE,
        },
      });
      return;
    }

    if (profile.role === UserRole.CLIENTE) {
      await prisma.profile.update({
        where: { email },
        data: { role: UserRole.EQUIPE },
      });
    }
  }
);

/**
 * Resolve usuário + restaurante + membro. É a parte cara (sessão e queries) e
 * NÃO depende dos papéis exigidos — por isso pode ser cacheada por request.
 */
async function loadRestaurantContext(ensureMembership: boolean): Promise<AccessResult> {
  const auth = await getAuthenticatedUser();
  if (!auth.user) return { error: auth.error ?? 'Usuário não autenticado' };

  const { user } = auth;
  const ownedRestaurant = await prisma.restaurant.findFirst({
    where: { user_id: user.id, is_active: true },
    select: { id: true, name: true, slug: true, user_id: true },
  });

  if (ownedRestaurant) {
    let member: RestaurantMember;
    if (ensureMembership) {
      member = await ensureOwnerMember(user, ownedRestaurant);
    } else {
      const existing = await prisma.restaurantMember.findFirst({
        where: { restaurant_id: ownedRestaurant.id, user_id: user.id, status: 'ACTIVE' },
      });
      if (!existing) {
        return { error: 'Usuário não está vinculado a um restaurante' };
      }
      member = existing;
    }
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

/** Caso padrão (ensureMembership=true) deduplicado por request via cache(). */
const loadRestaurantContextCached = cache(() => loadRestaurantContext(true));

/**
 * Portão de autorização: resolve o contexto (cacheado) e aplica a checagem de
 * papel. A checagem fica fora do cache porque varia por call site.
 */
export async function getRestaurantAccess(
  allowedRoles?: RestaurantMemberRole[],
  ensureMembership = true
): Promise<AccessResult> {
  const context = ensureMembership
    ? await loadRestaurantContextCached()
    : await loadRestaurantContext(false);

  if (context.error || !context.data) {
    return { error: context.error ?? 'Usuário não autenticado' };
  }

  const access = context.data;

  if (!hasAllowedRole(access.role, allowedRoles)) {
    return {
      error: access.isOwner ? 'Acesso negado para esta operação' : 'Acesso negado para esta função',
    };
  }

  if (!access.isOwner) {
    await ensureMinimumAppRole(
      access.user.id,
      normalizeEmail(access.user.email!),
      (access.user.user_metadata?.full_name as string | undefined) ?? null
    );
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

export async function canUserCreateRestaurant(
  userId: string
): Promise<{ allowed: boolean; error?: string }> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { role: true },
  });

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
