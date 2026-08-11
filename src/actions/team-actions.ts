'use server';

import { createHash, randomBytes } from 'crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { RestaurantMemberRole, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getRestaurantAccess, MANAGEMENT_ROLES, recordAuditLog } from '@/lib/restaurant-access';
import { createClient } from '@/lib/supabase/server';

const INVITATION_DAYS_TO_EXPIRE = 7;
const INVITABLE_ROLES: RestaurantMemberRole[] = ['MANAGER', 'KITCHEN', 'WAITER', 'DRIVER'];

export type TeamMemberView = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: RestaurantMemberRole;
  status: string;
  joinedAt: string | null;
  createdAt: string;
};

export type TeamInvitationView = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: RestaurantMemberRole;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export type AuditLogView = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorUserId: string | null;
  actorMemberId: string | null;
  createdAt: string;
  metadata: unknown;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function validateRole(role: string): role is RestaurantMemberRole {
  return INVITABLE_ROLES.includes(role as RestaurantMemberRole);
}

async function getOrigin(): Promise<string> {
  const headersList = await headers();
  return headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export async function getTeamOverview(): Promise<{
  data?: {
    restaurantName: string;
    members: TeamMemberView[];
    invitations: TeamInvitationView[];
    auditLogs: AuditLogView[];
  };
  error?: string;
}> {
  const access = await getRestaurantAccess(MANAGEMENT_ROLES);
  if (access.error || !access.data) {
    return { error: access.error || 'Nao autorizado' };
  }
  const data = access.data;

  const [members, invitations, auditLogs] = await Promise.all([
    prisma.restaurantMember.findMany({
      where: { restaurant_id: data.restaurant.id },
      orderBy: [{ status: 'asc' }, { role: 'asc' }, { full_name: 'asc' }],
    }),
    prisma.restaurantInvitation.findMany({
      where: {
        restaurant_id: data.restaurant.id,
        status: 'PENDING',
      },
      orderBy: { created_at: 'desc' },
    }),
    prisma.auditLog.findMany({
      where: { restaurant_id: data.restaurant.id },
      orderBy: { created_at: 'desc' },
      take: 20,
    }),
  ]);

  return {
    data: {
      restaurantName: data.restaurant.name,
      members: members.map((member) => ({
        id: member.id,
        email: member.email,
        fullName: member.full_name,
        phone: member.phone,
        role: member.role,
        status: member.status,
        joinedAt: member.joined_at?.toISOString() ?? null,
        createdAt: member.created_at.toISOString(),
      })),
      invitations: invitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        fullName: invitation.full_name,
        phone: invitation.phone,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expires_at.toISOString(),
        createdAt: invitation.created_at.toISOString(),
      })),
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        actorUserId: log.actor_user_id,
        actorMemberId: log.actor_member_id,
        createdAt: log.created_at.toISOString(),
        metadata: log.metadata,
      })),
    },
  };
}

export async function inviteRestaurantMember(input: {
  email: string;
  fullName?: string;
  phone?: string;
  role: string;
}): Promise<{ data?: { invitationLink: string }; error?: string }> {
  const access = await getRestaurantAccess(MANAGEMENT_ROLES);
  if (access.error || !access.data) {
    return { error: access.error || 'Nao autorizado' };
  }
  const data = access.data;

  const email = normalizeEmail(input.email);
  if (!email || !email.includes('@')) return { error: 'Informe um email válido' };
  if (!validateRole(input.role)) return { error: 'Função inválida para convite' };

  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITATION_DAYS_TO_EXPIRE * 24 * 60 * 60 * 1000);

  const existingMember = await prisma.restaurantMember.findFirst({
    where: {
      restaurant_id: data.restaurant.id,
      email,
      status: 'ACTIVE',
    },
  });

  if (existingMember) return { error: 'Esta pessoa já faz parte da equipe' };

  await prisma.$transaction(async (tx) => {
    await tx.restaurantMember.upsert({
      where: {
        restaurant_id_email: {
          restaurant_id: data.restaurant.id,
          email,
        },
      },
      create: {
        restaurant_id: data.restaurant.id,
        email,
        full_name: input.fullName?.trim() || null,
        phone: input.phone?.trim() || null,
        role: input.role as RestaurantMemberRole,
        status: 'INVITED',
        invited_by: data.user.id,
      },
      update: {
        full_name: input.fullName?.trim() || null,
        phone: input.phone?.trim() || null,
        role: input.role as RestaurantMemberRole,
        status: 'INVITED',
        disabled_at: null,
        invited_by: data.user.id,
      },
    });

    await tx.restaurantInvitation.create({
      data: {
        restaurant_id: data.restaurant.id,
        email,
        full_name: input.fullName?.trim() || null,
        phone: input.phone?.trim() || null,
        role: input.role as RestaurantMemberRole,
        token_hash: tokenHash,
        invited_by: data.user.id,
        expires_at: expiresAt,
      },
    });
  });

  await recordAuditLog({
    restaurantId: data.restaurant.id,
    actorUserId: data.user.id,
    actorMemberId: data.member?.id ?? null,
    action: 'team.invitation.created',
    entityType: 'restaurant_member',
    metadata: { email, role: input.role },
  });

  revalidatePath('/dashboard/equipe');
  const origin = await getOrigin();
  return { data: { invitationLink: `${origin}/convite-equipe/${token}` } };
}

export async function getInvitationPreview(token: string): Promise<{
  data?: {
    restaurantName: string;
    email: string;
    role: RestaurantMemberRole;
    expiresAt: string;
  };
  error?: string;
}> {
  const invitation = await prisma.restaurantInvitation.findUnique({
    where: { token_hash: hashToken(token) },
    include: { restaurant: { select: { name: true } } },
  });

  if (!invitation || invitation.status !== 'PENDING') {
    return { error: 'Convite não encontrado ou já utilizado' };
  }

  if (invitation.expires_at < new Date()) {
    await prisma.restaurantInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    return { error: 'Convite expirado' };
  }

  return {
    data: {
      restaurantName: invitation.restaurant.name,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expires_at.toISOString(),
    },
  };
}

export async function acceptRestaurantInvitation(
  token: string
): Promise<{ success?: boolean; redirectTo?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: 'Faça login com o email convidado para aceitar o convite' };
  }

  const email = normalizeEmail(user.email);
  const invitation = await prisma.restaurantInvitation.findUnique({
    where: { token_hash: hashToken(token) },
    include: { restaurant: { select: { id: true, name: true } } },
  });

  if (!invitation || invitation.status !== 'PENDING') {
    return { error: 'Convite não encontrado ou já utilizado' };
  }

  if (invitation.expires_at < new Date()) {
    await prisma.restaurantInvitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    return { error: 'Convite expirado' };
  }

  if (normalizeEmail(invitation.email) !== email) {
    return { error: `Entre com o email ${invitation.email} para aceitar este convite` };
  }

  const now = new Date();
  const member = await prisma.$transaction(async (tx) => {
    const savedMember = await tx.restaurantMember.upsert({
      where: {
        restaurant_id_email: {
          restaurant_id: invitation.restaurant_id,
          email,
        },
      },
      create: {
        restaurant_id: invitation.restaurant_id,
        user_id: user.id,
        email,
        full_name:
          invitation.full_name || (user.user_metadata?.full_name as string | undefined) || null,
        phone: invitation.phone,
        role: invitation.role,
        status: 'ACTIVE',
        invited_by: invitation.invited_by,
        joined_at: now,
      },
      update: {
        user_id: user.id,
        full_name:
          invitation.full_name || (user.user_metadata?.full_name as string | undefined) || null,
        phone: invitation.phone,
        role: invitation.role,
        status: 'ACTIVE',
        joined_at: now,
        disabled_at: null,
      },
    });

    await tx.restaurantInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        accepted_by: user.id,
        accepted_at: now,
      },
    });

    await tx.profile.upsert({
      where: { email },
      create: {
        id: user.id,
        email,
        full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
        role: UserRole.EQUIPE,
      },
      update: {
        role: UserRole.EQUIPE,
      },
    });

    return savedMember;
  });

  await recordAuditLog({
    restaurantId: invitation.restaurant_id,
    actorUserId: user.id,
    actorMemberId: member.id,
    action: 'team.invitation.accepted',
    entityType: 'restaurant_member',
    entityId: member.id,
    metadata: { email, role: invitation.role },
  });

  const redirectTo =
    invitation.role === 'DRIVER'
      ? '/driver'
      : invitation.role === 'WAITER'
        ? '/waiter'
        : invitation.role === 'KITCHEN'
          ? '/dashboard/cozinha'
          : '/dashboard';

  return { success: true, redirectTo };
}

export async function disableRestaurantMember(
  memberId: string
): Promise<{ success?: boolean; error?: string }> {
  const access = await getRestaurantAccess(MANAGEMENT_ROLES);
  if (access.error || !access.data) {
    return { error: access.error || 'Nao autorizado' };
  }
  const data = access.data;

  // Guard de auto-desativação. Se o dono ainda não tem membro materializado,
  // o guard de OWNER logo abaixo continua protegendo.
  if (data.member && memberId === data.member.id) {
    return { error: 'Você não pode desativar o próprio acesso' };
  }

  const member = await prisma.restaurantMember.findFirst({
    where: { id: memberId, restaurant_id: data.restaurant.id },
  });

  if (!member) return { error: 'Membro não encontrado' };
  if (member.role === 'OWNER') return { error: 'O proprietário não pode ser desativado por aqui' };

  await prisma.restaurantMember.update({
    where: { id: memberId },
    data: { status: 'DISABLED', disabled_at: new Date() },
  });

  await recordAuditLog({
    restaurantId: data.restaurant.id,
    actorUserId: data.user.id,
    actorMemberId: data.member?.id ?? null,
    action: 'team.member.disabled',
    entityType: 'restaurant_member',
    entityId: memberId,
    metadata: { email: member.email, role: member.role },
  });

  revalidatePath('/dashboard/equipe');
  return { success: true };
}

export async function cancelRestaurantInvitation(
  invitationId: string
): Promise<{ success?: boolean; error?: string }> {
  const access = await getRestaurantAccess(MANAGEMENT_ROLES);
  if (access.error || !access.data) {
    return { error: access.error || 'Nao autorizado' };
  }
  const data = access.data;

  const invitation = await prisma.restaurantInvitation.findFirst({
    where: {
      id: invitationId,
      restaurant_id: data.restaurant.id,
      status: 'PENDING',
    },
  });

  if (!invitation) return { error: 'Convite não encontrado' };

  await prisma.restaurantInvitation.update({
    where: { id: invitationId },
    data: { status: 'CANCELLED', cancelled_at: new Date() },
  });

  await recordAuditLog({
    restaurantId: data.restaurant.id,
    actorUserId: data.user.id,
    actorMemberId: data.member?.id ?? null,
    action: 'team.invitation.cancelled',
    entityType: 'restaurant_invitation',
    entityId: invitationId,
    metadata: { email: invitation.email, role: invitation.role },
  });

  revalidatePath('/dashboard/equipe');
  return { success: true };
}
