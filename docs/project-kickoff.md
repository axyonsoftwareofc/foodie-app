# Project Kickoff — Foodie App

## Product
- **Name:** Foodie App
- **Type:** Plataforma SaaS de delivery de comida (B2B2C)
- **Goal:** Permitir que restaurantes criem sua loja online com cardápio, pedidos e entregas em minutos, oferecendo aos clientes finais uma experiência de pedido fluida e omnichannel.
- **Target users:** Donos de restaurante (B2B), clientes finais (B2C), entregadores (B2B operacional)
- **Success criteria:**
  - Um restaurante se cadastra e publica seu cardápio em < 10 minutos
  - Cliente final faz um pedido completo em < 3 minutos (da busca ao checkout)
  - Tempo de carregamento da página de cardápio < 2s (P95)
  - 99.9% uptime no cardápio público (subdomínio do restaurante)
- **Non-goals:**
  - App mobile nativo (por enquanto: PWA + web responsiva)
  - Marketplace centralizado (cada restaurante é independente)
  - Logística própria de entrega (integração futura com serviços terceiros)

## Priorities
- **Primary:** Multi-tenant self-service, experiência de checkout omnichannel (Delivery + Mesa + Retirada), performance do cardápio público
- **Secondary:** App do entregador com geolocalização, pagamentos online reais, white-label com domínio próprio
- **Tradeoffs:** Velocidade de lançamento > perfeição. Funcional > customizável. Monólito modular > microserviços.

## Stack
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **Backend:** Next.js Server Actions + API Routes
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Auth:** Supabase Auth (email/senha + Google OAuth)
- **Cache/Filas:** Redis (Upstash ou аналогичный)
- **Pagamentos:** Stripe (cartão), Pix manual/automático, MercadoPago, PayPal
- **Hosting/Deploy:** Vercel
- **Testing:** Vitest (unitário/integração) + Playwright (E2E)
- **Tooling:** ESLint, TypeScript strict, Zod validação

## Architecture
- **Style:** Monólito modular com App Router (route groups como bounded contexts leves)
- **DDD level:** ddd-light — linguagem do domínio clara, mas sem camadas formais de application/domain/infrastructure
- **Main modules/domains:**
  - **Menu/Restaurant:** Cardápio, categorias, produtos, perfil do restaurante
  - **Order/Checkout:** Carrinho, checkout omnichannel, pedidos, status
  - **Kitchen:** Painel da cozinha, Kanban de pedidos, notificações
  - **Delivery:** App do entregador, GPS, roteirização, status de entrega
  - **Tenant:** Onboarding, subdomínios, white-label, billing
  - **Auth/User:** Perfil, endereços, preferências, RBAC
- **Integration points:** Supabase Auth, Stripe/MercadoPago/PayPal APIs, ViaCEP, Redis
- **Data ownership:** Cada restaurante é dono dos seus dados. Soft-delete, nunca hard-delete sem confirmação.

## Design
- **DESIGN.md:** A ser criado quando houver design system formalizado
- **Aesthetic direction:** Clean, moderno, cores vibrantes (emerald/verde como primária), foco em imagens de comida
- **Accessibility baseline:** WCAG 2.1 AA, suporte a leitores de tela, navegação por teclado, alto contraste

## Security And Privacy
- **Sensitive data:** Dados de pagamento (terceirizados via Stripe/MercadoPago), endereços, telefones
- **Auth/authz needs:** RBAC (ADMIN, GERENCIADOR, EQUIPE, CLIENTE), isolamento multi-tenant
- **External inputs:** Upload de imagens (logo, capa), formulários públicos com validação Zod
- **Uploads/webhooks/payments:** Stripe webhooks para confirmação de pagamento, upload de imagens para Supabase Storage

## NFRs
- **Performance:** Cardápio público < 2s LCP, ISR/SSG para páginas de cardápio, Redis cache para dados quentes
- **Availability:** 99.9% para cardápio público. Degradar funcionalidades não-críticas se necessário.
- **Cost:** Otimizar com cache agressivo, evitar chamadas desnecessárias ao banco, usar Vercel Edge para conteúdo estático
- **Observability:** Logs estruturados, error tracking (Sentry), métricas de negócio (pedidos/minuto, taxa de conversão), alertas de falha em pagamento
- **Maintainability:** TypeScript strict, ESLint zero erros, testes para fluxos críticos, documentação de features no formato feature-doc XML
- **Compliance/Privacy:** LGPD — consentimento para marketing, exportação/deleção de dados do usuário

## Decisions
- **[2026-05-19]** Monólito modular com App Router:
  - Why: O time é pequeno, e a complexidade de microserviços não se justifica no estágio atual. Route groups do Next.js permitem isolamento lógico sem custo operacional.
  - Tradeoff: Menor flexibilidade de escala independente por módulo. Aceitável até 10k pedidos/dia.
- **[2026-05-19]** Supabase como plataforma de dados e auth:
  - Why: Unifica banco e autenticação, reduz custo operacional, oferece Row Level Security para multi-tenant.
  - Tradeoff: Vendor lock-in moderado. Migração possível pois é PostgreSQL padrão.
- **[2026-05-19]** Feature-doc XML como formato de documentação de features:
  - Why: Captura fluxos, arquivos, decisões e estado de forma estruturada. Facilita handoff e retrospectiva.
  - Tradeoff: Mais verboso que markdown simples. Compensado pela clareza estrutural.

## Assumptions
- **Assumption:** O volume inicial de pedidos será < 1000/dia
  - Why safe for now: O monólito modular no Vercel escala bem até esse volume com otimizações básicas.
  - Revisit when: Volume ultrapassar 5000 pedidos/dia ou latência do banco > 100ms P95.
- **Assumption:** Restaurantes aceitarão subdomínio (restaurante.foodie.app) como suficiente para o MVP
  - Why safe for now: A maioria dos pequenos restaurantes não tem domínio próprio configurado.
  - Revisit when: 10+ restaurantes solicitarem domínio próprio ou white-label.

## Open Questions
- **Question:** Integração com marketplaces de entrega (iFood, Rappi) ou manter como plataforma independente?
- **Question:** Modelo de cobrança: freemium, comissão por pedido, ou assinatura mensal?

## Next Steps
- Criar Architecture Packet completo (architecture.md, ADRs, plano de implementação)
- Feature-doc para multi-tenant onboarding
- Feature-doc para app do entregador com geolocalização
- Migrar dados mock restantes para Prisma
- Implementar Redis para cache de cardápios públicos
