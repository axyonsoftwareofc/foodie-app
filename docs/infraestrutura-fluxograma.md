# Mapa da Infraestrutura — Foodie App

> **Data do relatório:** 16/06/2026
> **Projeto:** Foodie App — Plataforma SaaS B2B2C de delivery
> **Repositório:** https://github.com/axyonsoftwareofc/foodie-app
> **Site (produção):** https://foodie-app-puce-rho.vercel.app/

---

## 1. Visão Geral dos Ambientes

| Ambiente            | URL / Acesso                            | Hospedagem                                                  | Observação                                             |
| ------------------- | --------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| **Desenvolvimento** | `http://localhost:3000`                 | Local (dev machine)                                         | Node.js 22+, npm 11                                    |
| **Produção**        | https://foodie-app-puce-rho.vercel.app/ | **Vercel** (Projeto: `axyons-projects-860b52ad/foodie-app`) | Deploy automático via GitHub                           |
| **Homologação**     | ❌ _Não configurado_                    | —                                                           | _Sugerido: branch `staging` com preview URL da Vercel_ |

**Capacidade estimada atual:** ~20 clientes sem custo adicional para a Axyon _(a ser validado via testes de carga)_.

---

## 2. Serviços e Links de Acesso

### 2.1 Vercel — Hospedagem da Aplicação

- **Console:** https://vercel.com/axyons-projects-860b52ad/foodie-app
- **Site:** https://foodie-app-puce-rho.vercel.app/
- **Função:** Build e deploy do Next.js 16, ISR, Edge Functions
- **Planos:** _não identificado (verificar tier)_

### 2.2 Supabase — Banco de Dados + Autenticação

- **Console:** https://supabase.com/dashboard/project/imepormclbjnzuavvqdt
- **Função:**
  - PostgreSQL (banco principal via Prisma)
  - Auth (email/senha + Google OAuth)
  - Custom Access Token Hook (injeção de role no JWT)
- **Pooling:** `pgbouncer=true`

### 2.3 Upstash Redis — Cache / Rate Limit / Pub-Sub

- **Console:** https://console.upstash.com/redis/12071909-2c96-456d-ad6f-8822e35a9f3a
- **Função:**
  - Cache de cardápio e restaurante
  - Rate limiting de endpoints críticos
  - Pub/Sub para notificações da cozinha
  - Idempotência de pagamentos

### 2.4 Google Cloud — OAuth (Google Login)

- **Console:** https://console.cloud.google.com/auth/clients?project=foodie-app-487818
- **Função:** Credenciais OAuth para login com Google via Supabase

### 2.5 Sentry — Monitoramento de Erros

- **Console:** https://axyon-software.sentry.io/projects/foodie/?project=4511492841603072
- **Função:** Error tracking (client, edge, server)
- **Source maps:** Enviados no build, deletados após upload

### 2.6 Cloudinary — Upload de Imagens

- **Função:** Upload e otimização de imagens (produtos, logos, capas)

### 2.7 Stripe / Mercado Pago / PayPal — Pagamentos

- **Função:** Processamento omnichannel (cartão, Pix, boleto, PayPal)
- **Webhooks:** Stripe + Mercado Pago atualizam status do pedido

### 2.8 Nodemailer — E-mail

- **Função:** Envio de emails transacionais (convites, recovery, notificações) via SMTP Gmail

### 2.9 ViaCEP — Autopreenchimento

- **Função:** Preenchimento automático de endereço a partir do CEP

---

## 3. Dependências Externas (Resumo)

| Serviço               | Tipo              | Dependência | Graceful Degradation                 |
| --------------------- | ----------------- | ----------- | ------------------------------------ |
| Vercel                | Infraestrutura    | **Crítico** | —                                    |
| Supabase (PostgreSQL) | Banco de Dados    | **Crítico** | —                                    |
| Supabase Auth         | Autenticação      | **Crítico** | Redirect para login                  |
| Upstash Redis         | Cache/Rate Limit  | Alto        | Cache desligado, rate limit liberado |
| Stripe                | Pagamento         | Alto        | Fallback Pix manual                  |
| Mercado Pago          | Pagamento         | Alto        | Fallback Pix manual                  |
| Sentry                | Monitoramento     | Médio       | Console.log estruturado              |
| Cloudinary            | Upload            | Médio       | Upload falha silenciosamente         |
| Nodemailer            | Email             | Médio       | Convites manuais                     |
| ViaCEP                | Autopreenchimento | Baixo       | Campos manuais                       |

---

## 4. Diagrama de Infraestrutura

```mermaid
flowchart TB
    subgraph Usuarios["🎯 Usuários"]
        C[Cliente<br/>Navegador / PWA]
        R[Restaurante<br/>Dashboard Web]
        W[Garçom<br/>Waiter App]
        D[Entregador<br/>Driver App]
        SA[Super Admin<br/>Painel Admin]
    end

    subgraph EdgeLayer["🌐 Edge / Middleware (Next.js Middleware)"]
        direction TB
        MW[Middleware]
        SUB[Subdomain Rewrite<br/>/{slug} → /r/{slug}]
        RBAC[RBAC Check<br/>Cookie Role Cache]
        RL_SENTRY[Sentry Tunnel<br/>Rate Limiting]
    end

    subgraph CDN["📦 CDN & Static"]
        ISR[ISR - Cardápios<br/>Estáticos]
        SW[Service Worker - PWA]
        IMG[Next.js Image<br/>Optimization]
    end

    subgraph Frontend["🖥️ Frontend - Next.js App Router"]
        direction TB
        subgraph Paginas["Páginas"]
            HOME[Home / Busca]
            MENU[Cardápio / r/[slug]]
            CART[Carrinho]
            CHECKOUT[Checkout]
            DASH[Dashboard<br/>Restaurante]
            KITCHEN[Kanban Cozinha]
            ADMIN[Admin / Super Admin]
            DRIVER[Driver App]
            WAITER[Waiter App]
        end
        subgraph State["Estado Global"]
            AUTH[AuthContext]
            CART_CTX[CartContext]
            THEME[ThemeContext]
            ACCESS[AccessibilityContext]
            KT[KitchenTimerContext]
        end
        subgraph Hooks["Custom Hooks"]
            H_FAV[useFavorites]
            H_GEO[useGeolocation]
            H_VIA[useViaCep]
            H_ORDER[useOrders]
            H_KITCHEN[useKitchenOrders]
            H_SOUND[useOrderSound]
            H_NOTIF[useOrderNotifications]
        end
    end

    subgraph Backend["⚙️ Backend - Next.js Server"]
        direction TB
        subgraph ServerActions["Server Actions"]
            SA_AUTH[Auth Actions<br/>signIn / signUp / reset]
            SA_ORDER[Order Actions<br/>create / update / cancel]
            SA_PROD[Product Actions<br/>CRUD produtos]
            SA_CAT[Category Actions<br/>CRUD categorias]
            SA_REST[Restaurant Actions<br/>CRUD restaurantes]
            SA_TEAM[Team Actions<br/>convites / membros]
            SA_PAY[Payment Actions<br/>intent / pix / boleto]
            SA_UPLOAD[Upload Actions<br/>Cloudinary]
            SA_ADMIN[Super Admin Actions]
        end
        subgraph APIRoutes["API Routes (REST)"]
            API_HEALTH[GET /api/health]
            API_DOCS[GET /api/docs]
            API_CATEGORIES[POST /api/categories]
            API_PRODUCTS[POST /api/products]
            API_PAY_INTENT[POST /api/payments/intent]
            API_PAY_PIX[POST /api/payments/pix]
            API_PAY_BOLETO[POST /api/payments/boleto]
            API_PAY_MP[POST /api/payments/mercadopago]
            API_PAY_PP[POST /api/payments/paypal]
            API_TABLES[POST /api/tables]
            API_RESTAURANTS[POST /api/restaurants]
        end
        subgraph Webhooks["Webhooks"]
            WH_STRIPE[POST /api/webhooks/stripe]
            WH_MP[POST /api/webhooks/mercadopago]
        end
    end

    subgraph Services["☁️ Serviços Externos"]
        direction TB
        subgraph Supabase["Supabase"]
            SUPA_AUTH[Auth<br/>Email + Google OAuth]
            SUPA_DB[PostgreSQL<br/>Banco de Dados]
            SUPA_JWT[Custom Access<br/>Token Hook - JWT]
        end
        subgraph Redis["Upstash Redis"]
            REDIS_CACHE[Cache<br/>Cardápio / Restaurante]
            REDIS_RATE[Rate Limiting]
            REDIS_PUB[Pub/Sub<br/>Pedidos Cozinha]
            REDIS_IDEM[Idempotência<br/>Pagamentos]
        end
        subgraph Payments["Gateways de Pagamento"]
            STRIPE[Stripe<br/>Cartão Crédito/Débito]
            MP[Mercado Pago<br/>Pix / Boleto / Cartão]
            PAYPAL[PayPal]
            PIX_MANUAL[Pix Manual<br/>QR Code]
            CASH[Dinheiro - Troco]
        end
        subgraph Infra["Infraestrutura"]
            CLOUDINARY[Cloudinary<br/>Upload Imagens]
            NODEMAILER[Nodemailer<br/>Email SMTP]
            SENTRY[Sentry<br/>Error Tracking]
            VIACEP[ViaCEP<br/>Auto-preenchimento]
        end
    end

    subgraph DevOps["🔧 CI/CD & DevOps"]
        direction TB
        GHA[GitHub Actions]
        LINT[ESLint + Prettier]
        HUSKY[Husky - Pre-commit]
        CODEQL[CodeQL Security]
        DEPENDABOT[Dependabot]
        VITEST[Vitest - Unit Tests]
        PLAYWRIGHT[Playwright - E2E]
    end

    subgraph Data["💾 Camada de Dados"]
        PRISMA[Prisma ORM]
        SCHEMA[Schema Prisma<br/>15 tabelas]
        MIGRATIONS[Migrations]
    end

    %% Conexões - Usuários → Edge
    C --> MW
    R --> MW
    W --> MW
    D --> MW
    SA --> MW

    %% Edge → Frontend
    MW --> SUB
    MW --> RBAC
    MW --> RL_SENTRY
    SUB --> Paginas
    RBAC --> Paginas

    %% Frontend interno
    Paginas --> State
    Paginas --> Hooks
    Paginas --> CDN
    CDN --> ISR
    CDN --> SW
    CDN --> IMG

    %% Frontend → Backend
    Paginas --> ServerActions
    Paginas --> APIRoutes

    %% Backend → Serviços
    ServerActions --> SUPA_AUTH
    ServerActions --> PRISMA
    ServerActions --> REDIS_CACHE
    ServerActions --> REDIS_IDEM
    ServerActions --> STRIPE
    ServerActions --> MP
    ServerActions --> PAYPAL
    ServerActions --> CLOUDINARY
    ServerActions --> NODEMAILER

    APIRoutes --> PRISMA
    APIRoutes --> REDIS_RATE
    APIRoutes --> SENTRY

    Webhooks --> STRIPE
    Webhooks --> MP

    %% Serviços externos → Data
    SUPA_DB --> PRISMA
    PRISMA --> SCHEMA
    SCHEMA --> MIGRATIONS

    %% Redis conexões
    REDIS_CACHE --> Paginas
    REDIS_PUB --> ServerActions
    REDIS_RATE --> APIRoutes
    REDIS_IDEM --> ServerActions

    %% DevOps
    GHA --> LINT
    GHA --> VITEST
    GHA --> PLAYWRIGHT
    GHA --> CODEQL
    HUSKY --> LINT

    %% Sentry
    SENTRY --> RL_SENTRY

    %% Supabase JWT
    SUPA_JWT --> SUPA_AUTH

    %% Acessórios
    VIACEP --> CART
    SENTRY --> ServerActions

    %% Estilo
    classDef users fill:#e1f5fe,stroke:#0288d1,color:#000
    classDef edge fill:#fff3e0,stroke:#f57c00,color:#000
    classDef frontend fill:#e8f5e9,stroke:#388e3c,color:#000
    classDef backend fill:#fce4ec,stroke:#c62828,color:#000
    classDef services fill:#f3e5f5,stroke:#7b1fa2,color:#000
    classDef devops fill:#fff8e1,stroke:#f9a825,color:#000
    classDef data fill:#e0f2f1,stroke:#00796b,color:#000
    classDef cdn fill:#f5f5f5,stroke:#616161,color:#000
    classDef state fill:#e0f7fa,stroke:#00acc1,color:#000
    classDef hooks fill:#f1f8e9,stroke:#689f38,color:#000
    classDef actions fill:#fce4ec,stroke:#d81b60,color:#000
    classDef api fill:#ffebee,stroke:#e53935,color:#000
    classDef wh fill:#ffccbc,stroke:#bf360c,color:#000
    classDef redis fill:#e8eaf6,stroke:#283593,color:#000
    classDef payments fill:#f3e5f5,stroke:#6a1b9a,color:#000
    classDef infra fill:#ede7f6,stroke:#4527a0,color:#000
    classDef supabase fill:#e0f2f1,stroke:#00695c,color:#000

    class C,R,W,D,SA users
    class MW,SUB,RBAC,RL_SENTRY edge
    class HOME,MENU,CART,CHECKOUT,DASH,KITCHEN,ADMIN,DRIVER,WAITER frontend
    class AUTH,CART_CTX,THEME,ACCESS,KT state
    class H_FAV,H_GEO,H_VIA,H_ORDER,H_KITCHEN,H_SOUND,H_NOTIF hooks
    class SA_AUTH,SA_ORDER,SA_PROD,SA_CAT,SA_REST,SA_TEAM,SA_PAY,SA_UPLOAD,SA_ADMIN actions
    class API_HEALTH,API_DOCS,API_CATEGORIES,API_PRODUCTS,API_PAY_INTENT,API_PAY_PIX,API_PAY_BOLETO,API_PAY_MP,API_PAY_PP,API_TABLES,API_RESTAURANTS api
    class WH_STRIPE,WH_MP wh
    class REDIS_CACHE,REDIS_RATE,REDIS_PUB,REDIS_IDEM redis
    class STRIPE,MP,PAYPAL,PIX_MANUAL,CASH payments
    class CLOUDINARY,NODEMAILER,SENTRY,VIACEP infra
    class SUPA_AUTH,SUPA_DB,SUPA_JWT supabase
    class ISR,SW,IMG cdn
    class GHA,LINT,HUSKY,CODEQL,DEPENDABOT,VITEST,PLAYWRIGHT devops
    class PRISMA,SCHEMA,MIGRATIONS data
```

---

## Diagrama de Fluxo de Dados — Pedido (Exemplo Crítico)

```mermaid
flowchart TD
    %% Estilo
    classDef cliente fill:#e1f5fe,stroke:#0288d1
    classDef sistema fill:#e8f5e9,stroke:#388e3c
    classDef dados fill:#f3e5f5,stroke:#7b1fa2
    classDef pago fill:#fff3e0,stroke:#f57c00
    classDef note fill:#f5f5f5,stroke:#9e9e9e,stroke-dasharray: 5 5

    A([Cliente acessa o app]) --> B{Navega cardápio}
    B --> C[Busca no Redis<br/>cache:menu:{slug}]
    C --> D{Cache hit?}
    D -->|Não| E[Busca no PostgreSQL<br/>categorias + produtos]
    D -->|Sim| F[Retorna dados cacheados]
    E --> G[Cacheia no Redis<br/>TTL 300s]
    G --> H[Renderiza cardápio]
    F --> H
    H --> I([Cliente adiciona itens ao carrinho])

    I --> J[CartContext<br/>atualiza estado]
    J --> K([Cliente finaliza pedido])

    K --> L{Middleware<br/>verifica auth + role}
    L -->|Cookie foodie-role| M[OK]
    L -->|Não autenticado| N[Redireciona /sign-in]

    M --> O[Server Action: createOrder]
    O --> P[Cria order no PostgreSQL<br/>status: PENDING]
    O --> Q[Redis pub/sub<br/>orders:kitchen:{id}]
    O --> R[Cria payment intent<br/>no gateway]
    R --> S{Qual gateway?}
    S -->|Stripe| T[PaymentIntent API]
    S -->|Mercado Pago| U[Pix / Boleto / Card]
    S -->|PayPal| V[PayPal Orders API]
    S -->|Pix Manual| W[QR Code estático]
    T --> X[Retorna client_secret]
    U --> X
    V --> X
    W --> X

    X --> Y([Cliente vê tela de pagamento])
    Y --> Z([Cliente confirma pagamento])

    Z --> AA{Gateway processa}
    AA -->|Sucesso| AB[Webhook: payment_intent.succeeded]
    AA -->|Falha| AC[Webhook: payment_intent.failed]

    AB --> AD[Atualiza order<br/>status: CONFIRMED<br/>confirmed_at: now]
    AB --> AE[Redis pub/sub<br/>notifica cozinha]
    AE --> AF[Cozinha altera status<br/>PREPARING → READY]
    AF --> AG[Redis pub/sub<br/>notifica cliente]
    AG --> AH([Cliente vê status<br/>em tempo real])

    AC --> AI[Marca order como<br/>payment_status: failed]
    AI --> AJ([Cliente tenta<br/>outro método])
```

---

## Visão Geral das Camadas

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USUÁRIOS                                      │
│  Cliente (PWA) | Restaurante | Garçom | Entregador | Super Admin     │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                    EDGE (Middleware)                                   │
│  • Autenticação via Supabase SSR    • RBAC com cache em cookie        │
│  • Rewrite de subdomínio (/r/slug)  • Rate limiting (Sentry tunnel)   │
│  • Redirecionamento de rotas protegidas                               │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                    FRONTEND (Next.js App Router)                       │
│  ┌─────────────┬───────────────┬──────────────┬─────────────────┐    │
│  │   Páginas   │  Contextos    │   Hooks      │  CDN / Static   │    │
│  │  (40+ rotas)│  (5 ctx)      │  (14 hooks)  │  ISR / PWA      │    │
│  └─────────────┴───────────────┴──────────────┴─────────────────┘    │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                    BACKEND (Next.js Server)                            │
│  ┌─────────────────────┬─────────────────────┬─────────────────────┐  │
│  │   Server Actions    │    API Routes       │     Webhooks        │  │
│  │  (20+ actions)      │   (15+ endpoints)   │  (Stripe + MP)      │  │
│  │  Auth / Order / Menu│  Payments / CRUD    │  Atualizam status   │  │
│  │  Team / Payment     │  Health / Docs      │  do pedido          │  │
│  └─────────────────────┴─────────────────────┴─────────────────────┘  │
└──────┬──────────┬──────────┬──────────┬──────────┬───────────────────┘
       │          │          │          │          │
┌──────▼──┐ ┌─────▼─────┐ ┌─▼──────┐ ┌─▼──────┐ ┌▼───────────────┐
│Supabase │ │ PostgreSQL│ │Redis   │ │Stripe  │ │Cloudinary      │
│Auth     │ │ (Prisma)  │ │Upstash │ │MP      │ │Nodemailer      │
│Google   │ │15 tabelas │ │Cache   │ │PayPal  │ │Sentry          │
│OAuth    │ │           │ │Rate Lim│ │Pix     │ │ViaCEP          │
└─────────┘ └───────────┘ └────────┘ └────────┘ └────────────────┘
```

---

## Detalhamento por Componente

### 1. Frontend (Next.js 16 App Router)

- **Renderização:** SSR + ISR (cardápios públicos) + CSR (dashboard)
- **Estado Global:** 5 Contextos React (Auth, Cart, Theme, Accessibility, KitchenTimer)
- **Hooks:** 14 hooks customizados (geolocalização, ViaCEP, favoritos, pedidos, som, notificações)
- **PWA:** Service worker, manifest.json, instalável
- **Estilo:** Tailwind CSS 4 com tema claro/escuro e white-label por restaurante
- **Acessibilidade:** Widget WCAG 2.1 AA (fonte, contraste, guia de leitura)

### 2. Edge/Middleware

- **Auth SSR:** `createServerClient` do Supabase SSR para gerenciar sessão
- **RBAC:** Verificação de papel (role) em rota protegida com cache em cookie assinado (`foodie-role`)
- **Subdomínio:** Rewrite de `{slug}.foodie.app` para `/r/{slug}`
- **Rate Limit:** Sentry tunnel limitado a 30 requisições/minuto via Redis

### 3. Backend

- **Server Actions:** Lógica de negócio principal (auth, pedidos, produtos, restaurantes, equipe, pagamentos)
- **API Routes:** Endpoints REST para CRUD, pagamentos (Stripe/Pix/Boleto/MP/PayPal) e health check
- **Webhooks:** Stripe e Mercado Pago — atualizam status do pedido de forma assíncrona
- **Rate Limiting:** 3 tiers (strict 5/60s, moderate 30/60s, relaxed 100/60s) via Redis

### 4. Banco de Dados (PostgreSQL via Supabase + Prisma)

- **ORM:** Prisma 6 com migrations versionadas
- **Schema:** 15 tabelas + 6 enums
- **Índices:** Índices compostos em `restaurant_id + status`, `restaurant_id + created_at`
- **Pooling:** `pgbouncer=true` na string de conexão

### 5. Redis (Upstash)

- **Cache:** Cardápio (`cache:menu:{slug}`, TTL 300s), restaurante (`cache:restaurant:{id}`)
- **Rate Limiting:** `ratelimit:{key}:{window}` com incr/expire
- **Pub/Sub:** Notificações em tempo real para cozinha (`orders:kitchen:{restaurantId}`)
- **Idempotência:** Prevenção de duplicação de pagamentos (`idempotency:{key}`)
- **Graceful degradation:** Sistema opera sem Redis (cache desligado, rate limit liberado)

### 6. Pagamentos (Omnichannel)

- **Stripe:** Payment Intents API, webhook `payment_intent.succeeded`
- **Mercado Pago:** Pix, boleto, cartão com webhook
- **PayPal:** Integração direta
- **Pix Manual:** QR Code estático via chave PIX
- **Dinheiro:** Opção "troco para" com cálculo automático
- **Idempotência:** Chave única por pedido evita duplicação

### 7. Serviços Auxiliares

- **Cloudinary:** Upload e otimização de imagens
- **Nodemailer:** Envio de emails (convites, recovery, notificações) via SMTP Gmail
- **Sentry:** Error tracking (client, edge, server) com graceful fallback para logger
- **ViaCEP:** Auto-preenchimento de endereço brasileiro

### 8. CI/CD & Qualidade

- **GitHub Actions:** 3 jobs (lint+typecheck → unit tests → build)
- **CodeQL:** Análise de segurança automatizada
- **Dependabot:** Atualizações de dependências
- **Husky + lint-staged:** Pré-commit com ESLint + Prettier
- **Testes:** Vitest (unitários com MSW) + Playwright (E2E)
- **Sentry:** Source maps enviados no build, `deleteSourcemapsAfterUpload: true`

---

## Segurança

| Medida              | Implementação                                                                |
| ------------------- | ---------------------------------------------------------------------------- |
| **CSP Headers**     | Strict CSP no `next.config.ts` (script-src, frame-src, connect-src, img-src) |
| **HSTS**            | `max-age=63072000; includeSubDomains; preload`                               |
| **X-Frame-Options** | `DENY`                                                                       |
| **Rate Limiting**   | Auth (5/60s), CRUD (30/60s), Read (100/60s), Sentry (30/min)                 |
| **Idempotência**    | Redis TTL 5min para pagamentos                                               |
| **RBAC**            | 5 papéis de sistema + 5 papéis por restaurante                               |
| **Cookie Role**     | Assinado HMAC-SHA256, expira 1h cache / 7d cookie                            |
| **Auditoria**       | Tabela `audit_logs` com actor, ação, entidade, IP, user-agent                |
| **LGPD**            | Consentimento explícito, exportação/deleção de dados                         |
| **JWT Hook**        | Supabase Custom Access Token Hook injeta role no JWT                         |

---

## Estratégia de Falhas (Failure Modes)

| Serviço       | Modo de Falha   | Graceful Degradation                                          |
| ------------- | --------------- | ------------------------------------------------------------- |
| Redis         | Indisponível    | Cache desligado, rate limit liberado, idempotência desativada |
| Stripe        | Indisponível    | Fallback para Pix manual ou Mercado Pago                      |
| Mercado Pago  | Indisponível    | Fallback para Pix manual (QR Code estático)                   |
| Sentry        | Não configurado | Fallback para `console.log` estruturado                       |
| Cloudinary    | Indisponível    | Upload falha silenciosamente                                  |
| ViaCEP        | Indisponível    | Campos manuais para endereço                                  |
| Supabase Auth | Indisponível    | Redirecionar para login                                       |
