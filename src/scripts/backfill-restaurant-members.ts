// src/scripts/backfill-restaurant-members.ts
//
// Backfill do achado #2 (docs/auditoria-2026-08-10.md).
//
// A autorização (`getRestaurantAccess`) virou LEITURA PURA e deixou de
// provisionar dados por conta própria. Este script corrige o que os acessos
// anteriores vinham materializando de forma implícita:
//
//   1. Restaurantes ativos cujo dono não tem membro OWNER ativo -> cria.
//   2. Profiles com role abaixo do necessário -> promove.
//      Donos vão para GERENCIADOR (o middleware exige esse nível em /admin/*);
//      demais membros ativos vão para EQUIPE. Nunca rebaixa ninguém.
//
// Uso:  npm run backfill:members
//       npm run backfill:members -- --dry-run   (apenas relata, não escreve)
//
// Idempotente: rodar mais de uma vez não causa efeito adicional.
//
// Nota sobre o --dry-run: o passo 2 depende dos vínculos criados no passo 1.
// Como o dry-run não escreve, ele pode subestimar quantos profiles serão
// promovidos — a execução real é a fonte da verdade.

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

async function backfillOwnerMembers(): Promise<{ created: number; skipped: number }> {
  const restaurants = await prisma.restaurant.findMany({
    where: { is_active: true },
    select: { id: true, name: true, user_id: true },
  });

  let created = 0;
  let skipped = 0;

  for (const restaurant of restaurants) {
    const existing = await prisma.restaurantMember.findFirst({
      where: { restaurant_id: restaurant.id, user_id: restaurant.user_id, status: 'ACTIVE' },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const profile = await prisma.profile.findUnique({
      where: { id: restaurant.user_id },
      select: { email: true, full_name: true },
    });

    if (!profile?.email) {
      console.warn(
        `  ! ${restaurant.name} (${restaurant.id}): dono ${restaurant.user_id} sem profile/email — pulado`
      );
      skipped++;
      continue;
    }

    const email = profile.email.trim().toLowerCase();
    console.log(`  + ${restaurant.name}: criando membro OWNER para ${email}`);

    if (!dryRun) {
      // Reaproveita a linha existente (ex.: convite antigo com o mesmo email)
      // em vez de violar a unique [restaurant_id, email].
      const byEmail = await prisma.restaurantMember.findFirst({
        where: { restaurant_id: restaurant.id, email },
        select: { id: true },
      });

      if (byEmail) {
        await prisma.restaurantMember.update({
          where: { id: byEmail.id },
          data: {
            user_id: restaurant.user_id,
            role: 'OWNER',
            status: 'ACTIVE',
            joined_at: new Date(),
            disabled_at: null,
          },
        });
      } else {
        await prisma.restaurantMember.create({
          data: {
            restaurant_id: restaurant.id,
            user_id: restaurant.user_id,
            email,
            full_name: profile.full_name,
            role: 'OWNER',
            status: 'ACTIVE',
            joined_at: new Date(),
          },
        });
      }
    }

    created++;
  }

  return { created, skipped };
}

async function backfillMemberProfiles(): Promise<{ promoted: number }> {
  const members = await prisma.restaurantMember.findMany({
    where: { status: 'ACTIVE', user_id: { not: null } },
    select: { user_id: true, email: true },
  });

  const userIds = [...new Set(members.map((m) => m.user_id!).filter(Boolean))];

  // Donos precisam de GERENCIADOR (o middleware exige esse nível para /admin/*),
  // não apenas EQUIPE — é o mesmo nível que `upgradeUserToOwner` aplica na criação.
  const ownerIds = new Set(
    (
      await prisma.restaurant.findMany({
        where: { is_active: true, user_id: { in: userIds } },
        select: { user_id: true },
      })
    ).map((r) => r.user_id)
  );

  const profiles = await prisma.profile.findMany({
    where: {
      id: { in: userIds },
      role: { in: [UserRole.CLIENTE, UserRole.EQUIPE] },
    },
    select: { id: true, email: true, role: true },
  });

  let promoted = 0;

  for (const profile of profiles) {
    const target = ownerIds.has(profile.id) ? UserRole.GERENCIADOR : UserRole.EQUIPE;

    if (profile.role === target) continue;
    // Não rebaixa: um EQUIPE que não é dono já está no nível correto.
    if (profile.role === UserRole.EQUIPE && target === UserRole.EQUIPE) continue;

    console.log(`  ^ promovendo ${profile.email} de ${profile.role} para ${target}`);
    if (!dryRun) {
      await prisma.profile.update({ where: { id: profile.id }, data: { role: target } });
    }
    promoted++;
  }

  return { promoted };
}

async function main() {
  console.log(dryRun ? '== DRY RUN (nada sera escrito) ==\n' : '== BACKFILL ==\n');

  console.log('1) Membros OWNER faltantes:');
  const owners = await backfillOwnerMembers();
  console.log(`   ${owners.created} criado(s), ${owners.skipped} já ok\n`);

  console.log('2) Profiles de membros ativos ainda como CLIENTE:');
  const profiles = await backfillMemberProfiles();
  console.log(`   ${profiles.promoted} promovido(s)\n`);

  console.log('Concluido.');
}

main()
  .catch((error) => {
    console.error('Falha no backfill:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
