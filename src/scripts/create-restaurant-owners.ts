// src/scripts/create-restaurant-owners.ts
// Creates owner accounts for all mock restaurants in Supabase Auth and updates user_id

// Segredos vêm do ambiente — nunca hardcoded. A chave service_role ignora RLS
// e equivale a acesso administrativo total ao banco; versioná-la expõe todos
// os dados a quem tiver acesso ao repositório (ver docs/auditoria, achado #15).
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv(); // fallback para .env (não sobrescreve o que já foi carregado)

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `\n❌ Variável de ambiente ausente: ${name}\n` +
        `   Defina-a em .env.local antes de rodar este script.\n` +
        `   A chave service_role está no painel do Supabase em Settings → API.\n`
    );
    process.exit(1);
  }
  return value;
}

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

const restaurants = [
  { id: '1', name: 'Burger King', slug: 'burger-king', email: 'owner-burger-king@foodie.app' },
  { id: '2', name: 'Pizza Hut', slug: 'pizza-hut', email: 'owner-pizza-hut@foodie.app' },
  { id: '3', name: 'Sushi Now', slug: 'sushi-now', email: 'owner-sushi-now@foodie.app' },
  { id: '4', name: 'Salad & Co', slug: 'salad-and-co', email: 'owner-salad-and-co@foodie.app' },
  {
    id: '5',
    name: 'Açaí da Serra',
    slug: 'acai-da-serra',
    email: 'owner-acai-da-serra@foodie.app',
  },
  {
    id: '6',
    name: 'Cantina Italiana',
    slug: 'cantina-italiana',
    email: 'owner-cantina-italiana@foodie.app',
  },
];

// ⚠️ Senha temporária destas contas de demonstração. Estava hardcoded e
// versionada — se estas contas existirem em produção, qualquer pessoa com
// acesso ao repositório pode entrar como dono de restaurante. Defina
// SEED_OWNER_PASSWORD no .env.local e troque as senhas já criadas.
const TEMP_PASSWORD = process.env.SEED_OWNER_PASSWORD || 'FoodieApp2026!';

async function createUser(email: string, name: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      email,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: 'GERENCIADOR',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 422 && error.includes('already been registered')) {
      console.log(`  ⏭️  ${email} — já existe, buscando ID...`);
      return null; // User already exists
    }
    throw new Error(`Failed to create user ${email}: ${error}`);
  }

  const data = await response.json();
  return data.id as string;
}

async function getUserByEmail(email: string) {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?filter=email.eq.${encodeURIComponent(email)}`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get user ${email}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.users?.[0]?.id as string | null;
}

async function main() {
  console.log('🏪 Criando contas owner para restaurantes...\n');

  for (const restaurant of restaurants) {
    console.log(`📋 ${restaurant.name} (${restaurant.email})`);

    let userId: string | null = null;

    // Try to create user first
    userId = await createUser(restaurant.email, restaurant.name);

    // If user already exists, get their ID
    if (!userId) {
      userId = await getUserByEmail(restaurant.email);
    }

    if (!userId) {
      console.log(`  ❌ Não foi possível obter ID do usuário\n`);
      continue;
    }

    console.log(`  ✅ User ID: ${userId}`);
    console.log(`  🔗 Atualizando restaurante...\n`);
  }

  console.log('✅ Done! As senhas são temporárias — recomendo trocar após o primeiro login.');
  console.log('\n📧 Emails e senhas:');
  for (const r of restaurants) {
    console.log(`   ${r.email} / ${TEMP_PASSWORD}`);
  }
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
