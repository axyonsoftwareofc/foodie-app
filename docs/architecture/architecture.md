# Architecture — Foodie App

## Context
- **Product:** Plataforma SaaS de delivery de comida (B2B2C)
- **Stage:** Prototype → MVP (pré-lançamento)
- **Key constraints:** Time-to-market rápido, time pequeno, mercado brasileiro (LGPD, Pix, PT-BR)
- **Non-goals:** App nativo, marketplace centralizado, logística própria

## Architecture Style
- **Style:** Monólito modular com Next.js App Router
- **DDD level:** ddd-light
- **Rationale:** Route groups do App Router (`(auth)`, `(admin)`, `(profile)`, `(driver)`) fornecem isolamento lógico por domínio sem overhead de serviços separados. Server Actions + API Routes cobrem toda a lógica de backend.
- **Rejected alternatives:**
  - Microserviços: Complexidade operacional desproporcional para o estágio atual.
  - Remix/SvelteKit: Next.js já adotado, migração seria custosa sem ganho claro.

## Modules And Boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│                         FOODIE APP                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Tenant  │  │   Menu   │  │  Order   │  │ Delivery │        │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │        │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤        │
│  │ Onboard  │  │ Category │  │ Cart     │  │ GPS      │        │
│  │ Domain   │  │ Product  │  │ Checkout │  │ Routing  │        │
│  │ Theme    │  │ Search   │  │ Payment  │  │ Status   │        │
│  │ Billing  │  │ Rating   │  │ Kitchen  │  │ History  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │              │              │              │             │
│  ┌────┴──────────────┴──────────────┴──────────────┴─────┐      │
│  │                   Shared Kernel                        │      │
│  │  Auth (Supabase)  │  Validation (Zod)  │  Types        │      │
│  │  Prisma Client    │  Redis Cache       │  Utils        │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                  │
│  External:                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Supabase │  │  Stripe  │  │ Mercado  │  │  PayPal  │        │
│  │ Auth+DB  │  │          │  │  Pago    │  │          │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

### Tenant Module
- **Responsibility:** Onboarding self-service, subdomínios, white-label, billing
- **Owns:** `Restaurant`, `RestaurantTable`, `bank_info`, `operating_hours`
- **Does not own:** Cardápio (pertence ao Menu), Pedidos (pertence ao Order)
- **Depends on:** Auth (Supabase), Menu (para cardápio inicial)

### Menu Module
- **Responsibility:** Cardápio público, categorias, produtos, busca, avaliações
- **Owns:** `Category`, `Product`, `Review`, página `/r/[slug]`
- **Does not own:** Dados de restaurante (lê do Tenant)
- **Depends on:** Tenant (restaurant data), Redis (cache)

### Order Module
- **Responsibility:** Carrinho, checkout omnichannel, pagamentos, cozinha
- **Owns:** `Order`, `CartState`, fluxo de checkout, painel da cozinha, webhooks de pagamento
- **Does not own:** Menu (lê para validar itens), Delivery (notifica após pronto)
- **Depends on:** Menu (validação de produtos), Delivery (status pós-preparo), Stripe/MercadoPago/PayPal APIs

### Delivery Module
- **Responsibility:** App do entregador, GPS tracking, roteirização, histórico de entregas
- **Owns:** Status de entrega, coordenadas, rotas, notificações ao cliente
- **Does not own:** Pedido (lê do Order para atribuir entregas)
- **Depends on:** Order (dados do pedido), Redis (pub/sub para tracking em tempo real)

## Data
- **Primary storage:** PostgreSQL via Supabase
- **Ownership:** Cada restaurante é dono dos seus dados. `restaurant_id` como chave de isolamento em todas as tabelas de domínio.
- **Migration strategy:** Prisma Migrate. Migrations versionadas no repositório. Nunca fazer rollback automático.
- **Consistency expectations:** Consistência eventual para cache de cardápio. Consistência forte para pagamentos e status de pedidos.
- **Retention/deletion:** Soft-delete para restaurantes e produtos. Dados pessoais deletáveis via LGPD request.

### Redis Usage
- **Cache de cardápio:** `cache:menu:{slug}` — invalida ao atualizar categoria/produto
- **Cache de restaurante:** `cache:restaurant:{id}` — invalida ao atualizar perfil
- **Pub/sub de pedidos:** `orders:kitchen:{restaurantId}` — notificações em tempo real
- **Rate limiting:** `ratelimit:{key}` — proteção de API routes
- **Sessões de checkout:** `checkout:{sessionId}` — evita dupla submissão

## Integrations

| Integration | Purpose | Failure Mode | Retry/Idempotency |
|---|---|---|---|
| Supabase Auth | Autenticação e usuários | Fallback: redirecionar para login | N/A (stateless) |
| Stripe | Processamento de cartão | Fallback: Pix manual | Idempotency key via orderId |
| Mercado Pago | Pix, boleto, cartão | Fallback: Pix manual via QR code | Idempotency via external_reference |
| PayPal | Pagamentos digitais | Fallback: mensagem de erro | Native PayPal idempotency |
| ViaCEP | Auto-preenchimento de endereço | Fallback: campos manuais | N/A (GET) |
| Redis (Upstash) | Cache, pub/sub, rate limit | Fallback: banco direto | N/A |

## NFRs

### Security
- RBAC com 4 papéis: ADMIN, GERENCIADOR, EQUIPE, CLIENTE
- Row Level Security via `restaurant_id` em todas as queries
- Secrets em variáveis de ambiente, nunca no código
- Headers de segurança: CSP, HSTS, X-Frame-Options
- Rate limiting nas API routes de pagamento

### Privacy (LGPD)
- Consentimento explícito para marketing e cookies
- Página de preferências de privacidade (`/profile/privacy`)
- Exportação de dados do usuário sob demanda
- Deleção de dados pessoais (soft-delete + anonimização)
- Dados de pagamento: nunca armazenar números de cartão (terceirizado)

### Performance
- ISR (Incremental Static Regeneration) para cardápios públicos
- Redis cache para dados de restaurante e menu
- Otimização de imagens via Next.js Image + CDN
- Lazy loading de componentes pesados
- Bundle splitting por rota

### Availability
- Cardápio público: 99.9% (crítico para vendas)
- Dashboard admin: 99.5% (aceitável degradação parcial)
- Estratégia: cardápio público é static/ISR, sobrevive sem banco por algum tempo

### Observability
- Logs estruturados com request ID para tracing
- Error tracking (Sentry ou similar)
- Métricas de negócio: pedidos/hora, taxa de conversão, ticket médio
- Health check endpoint para monitoramento
- Alertas: falha em pagamento, latência alta, erro 5xx

### Maintainability
- Feature-doc XML para cada funcionalidade complexa
- TypeScript strict mode
- ESLint zero erros (warnings tolerados apenas em testes)
- Testes para fluxos críticos: checkout, pagamento, criação de pedido
- Código em português (nomes de função, comentários) para alinhamento com o domínio brasileiro

### Accessibility
- WCAG 2.1 AA
- Navegação completa por teclado
- Leitores de tela (aria-labels, live regions)
- Alto contraste e redução de movimento
- Widget de acessibilidade implementado

## Risks And Tradeoffs

| Risk | Mitigation | Revisit When |
|---|---|---|
| Monólito crescer demais e ficar difícil de manter | Manter módulos com boundaries claras. Extrair para serviços separados se necessário. | 3+ desenvolvedores trabalhando simultaneamente no mesmo módulo |
| Vendor lock-in no Supabase | Usar PostgreSQL padrão + migração documentada | Custos do Supabase > 2x alternativa ou necessidade de multi-cloud |
| Latência de cold start no Vercel | ISR para páginas estáticas, Redis cache, Edge Functions para rotas críticas | P95 de cold start > 3s |
| Complexidade do white-label | Começar com subdomínio + tema básico. White-label como fase 2. | Após 10+ restaurantes ativos |

## Assumptions
- **Assumption:** Redis (Upstash) será suficiente para cache e pub/sub
  - Why safe for now: Upstash oferece Redis serverless com tier gratuito generoso.
  - Revisit when: Latência de cache > 10ms ou volume de pub/sub > 1000 msg/s.
- **Assumption:** Vercel Pro será suficiente para produção inicial
  - Why safe for now: Limites generosos de banda e execução.
  - Revisit when: Custo mensal > R$ 500 ou necessidade de execuções > 1M/mês.
- **Assumption:** Não precisaremos de fila de mensagens dedicada (SQS, RabbitMQ)
  - Why safe for now: Redis pub/sub cobre notificações em tempo real e Server Actions são síncronas.
  - Revisit when: Necessidade de processamento assíncrono pesado (ex: geração de relatórios, exportação de dados).
