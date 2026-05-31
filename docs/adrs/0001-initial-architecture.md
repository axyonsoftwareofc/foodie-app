# ADR 0001: Monólito Modular com Next.js App Router + Supabase + Redis

## Status

Proposed

## Context

O Foodie App está em estágio de protótipo/PoC evoluindo para MVP. Precisamos de uma arquitetura que:

1. Permita entrega rápida de features (time-to-market)
2. Suporte isolamento multi-tenant (restaurantes independentes)
3. Escale para centenas de restaurantes e milhares de pedidos/dia
4. Seja operacionalmente simples para um time pequeno (1-3 devs)
5. Suporte os 3 modos de pedido: Delivery, Mesa (QR Code), Retirada
6. Integre com múltiplos gateways de pagamento (Stripe, MercadoPago, PayPal)

## Decision

Usar **monólito modular** com Next.js App Router como framework full-stack, **Supabase** para banco de dados PostgreSQL e autenticação, e **Redis** (Upstash) para cache, pub/sub e rate limiting.

O App Router organiza o código em route groups que funcionam como bounded contexts leves:

- `(auth)` — Autenticação e recuperação de senha
- `(admin)` — Painel administrativo
- `(profile)` — Perfil do usuário
- `(driver)` — App do entregador
- `dashboard/` — Painel do dono de restaurante
- `r/[slug]/` — Cardápio público do restaurante
- `api/` — API routes para webhooks e integrações externas

Server Actions substituem a necessidade de uma camada de API REST para a maior parte das operações CRUD, reduzindo boilerplate e latência.

## Consequences

### Positive

- **Simplicidade operacional:** Um deploy na Vercel, um banco de dados, um cache
- **Velocidade de desenvolvimento:** Server Actions eliminam a necessidade de criar endpoints REST para cada operação
- **TypeScript end-to-end:** Tipos compartilhados entre frontend e backend
- **Isolamento lógico:** Route groups mantêm o código organizado sem custo de runtime
- **ISR/SSG:** Páginas de cardápio podem ser pré-renderizadas e revalidadas sob demanda
- **Custo:** Tiers gratuitos/generosos de Vercel, Supabase e Upstash cobrem o MVP

### Negative

- **Cold starts:** Serverless functions no Vercel podem ter latência de inicialização (mitigado com ISR e Redis cache)
- **Vendor lock-in:** Dependência do ecossistema Vercel + Supabase (mitigado por usar PostgreSQL padrão e Next.js open-source)
- **Escalabilidade limitada:** Monólito pode se tornar gargalo com crescimento extremo (revisitável)

### Tradeoff

- Menos flexibilidade de escala independente por módulo vs. mais simplicidade operacional
- Menos isolamento de falha entre módulos vs. mais velocidade de desenvolvimento

## Alternatives Considered

### Microserviços (Next.js + API Gateway + serviços por domínio)

- **Why not:** Complexidade operacional desproporcional para o estágio e tamanho do time. Overhead de comunicação entre serviços, deploy coordination, e debugging distribuído não se justificam antes de 5000+ pedidos/dia ou 5+ desenvolvedores.

### NestJS + Next.js separado (backend dedicado)

- **Why not:** Duas bases de código para manter, latência extra de comunicação HTTP, tipos duplicados. A integração Server Actions + Prisma do Next.js elimina a necessidade de um backend dedicado para CRUD.

### Supabase completo (banco + auth + storage + edge functions)

- **Why not na totalidade:** Supabase Edge Functions (Deno) têm ecossistema menor que Node.js. Preferimos manter a lógica de negócio no Next.js e usar Supabase apenas para banco e auth.

## Status

Proposed — aprovado nesta data. Revisitar quando houver 5+ desenvolvedores ativos ou volume > 5000 pedidos/dia.
