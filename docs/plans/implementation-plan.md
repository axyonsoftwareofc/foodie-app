# Implementation Plan — Foodie App

> Versão: 1.0 | Data: 2026-05-19 | Status: Em andamento

## Visão Geral

Plano de implementação faseado para evoluir o Foodie de protótipo para MVP pronto para beta.

```
Fase 1 (Atual)  Fase 2 (Mês 1)   Fase 3 (Mês 2)    Fase 4 (Mês 3)
[Fundacoes]  →  [Multi-tenant] →  [Entregador]   →  [White-label]
     │              │                  │                  │
     └─ Checkout    └─ Onboarding      └─ GPS tracking    └─ Dominio proprio
     └─ Cardapio    └─ Subdominios     └─ Redis pub/sub   └─ Temas
     └─ Pagamentos  └─ Settings page   └─ Rotas           └─ Billing
     └─ Kitchen     └─ Redis cache     └─ Notificacoes    └─ Launch!
```

---

## Phase 1: Fundações Sólidas (ATUAL — 95% completo)

**Goal:** Pipeline de checkout funcional, cardápio real (Prisma), base multi-tenant preparada.

### Features concluídas

- [x] Schema Prisma completo (11 models + relations)
- [x] Cardápio público via Prisma (`/r/[slug]`)
- [x] Homepage migrada de mock para Prisma com fallback
- [x] Carrinho + checkout omnichannel (Delivery, Mesa, Retirada)
- [x] 5 gateways de pagamento (stubs prontos para ativação)
- [x] Painel da cozinha com Kanban
- [x] Dashboard do restaurante (menu, pedidos, settings)
- [x] `isRestaurantOpen()` com horários reais
- [x] CNPJ integrado no recibo
- [x] 240 testes passando, 0 erros de lint

### Pendências da Fase 1

- [ ] Ativar Redis cache para cardápios públicos
- [ ] Ativar pagamentos reais (Stripe/Pix) — remover feature flags
- [ ] Finalizar migração de todas as queries de Supabase para Prisma
- [ ] Deploy de preview na Vercel para validação de integração

---

## Phase 2: Multi-Tenant Self-Service (Mês 1)

**Goal:** Restaurantes se cadastram sozinhos e publicam cardápio em < 10 minutos.

### Features

#### 2.1 Onboarding Wizard

- **Descrição:** Fluxo guiado de 3 passos para criar restaurante
  1. Dados básicos (nome, categoria, CNPJ, telefone)
  2. Escolher subdomínio (restaurante.foodie.app)
  3. Upload de logo e capa
- **Arquivos novos:**
  - `src/app/onboarding/layout.tsx`
  - `src/app/onboarding/page.tsx` (step 1)
  - `src/app/onboarding/domain/page.tsx` (step 2)
  - `src/app/onboarding/theme/page.tsx` (step 3)
  - `src/actions/tenant-actions.ts`
- **Fluxo:** Landing Page → Sign Up → Onboarding Wizard → Dashboard
- **Validações:** Subdomínio único, CNPJ válido, imagem < 5MB

#### 2.2 Subdomínio Automático

- **Descrição:** Cada restaurante acessível via `{slug}.foodie.app`
- **Arquivos modificados:**
  - `middleware.ts` — detectar subdomínio, redirecionar para `/r/[slug]`
  - `next.config.ts` — configurar wildcard subdomínios
- **Infra:** Configurar DNS wildcard `*.foodie.app` → Vercel

#### 2.3 Redis Cache

- **Descrição:** Cache de cardápios e dados de restaurante para performance
- **Arquivos novos:**
  - `src/lib/redis.ts` — singleton Redis client
  - `src/lib/cache/cardapio-cache.ts` — cache + invalidação
  - `src/lib/cache/restaurant-cache.ts`
- **Estratégia:**
  - Cache miss: buscar do banco, armazenar em Redis (TTL 5min)
  - Invalidação: ao editar categoria/produto, limpar cache do cardápio
  - Fallback: se Redis offline, ir direto no banco

#### 2.4 Settings Page — Completa

- **Descrição:** Expandir `/dashboard/settings` atual com:
  - CNPJ (via Prisma)
  - Logo e capa (upload para Supabase Storage)
  - Chave Pix (para pagamento automático)
  - Toggle de status (Aberto/Fechado/Ocupado)
- **Arquivos modificados:**
  - `src/app/dashboard/settings/page.tsx`

### Testes da Fase 2

- Teste de onboarding wizard (3 passos)
- Teste de conflito de subdomínio
- Teste de cache hit/miss/invalidação
- Teste de fallback Redis offline

---

## Phase 3: App do Entregador (Mês 2)

**Goal:** Entregadores recebem pedidos, navegam com GPS, atualizam status em tempo real.

### Features

#### 3.1 Painel do Entregador

- **Descrição:** Lista de entregas disponíveis, em andamento e histórico
- **Arquivos novos:**
  - `src/app/(driver)/driver/page.tsx` — dashboard do entregador
  - `src/app/(driver)/driver/deliveries/[id]/page.tsx` — detalhes da entrega
  - `src/components/delivery/DeliveryCard.tsx`
  - `src/components/delivery/DeliveryList.tsx`
- **Status do entregador:** ONLINE, OFFLINE, BUSY

#### 3.2 GPS Tracking em Tempo Real

- **Descrição:** Cliente vê entregador no mapa durante a entrega
- **Arquivos novos:**
  - `src/components/delivery/LiveTracker.tsx` — mapa com posição em tempo real
  - `src/actions/delivery-tracking.ts` — atualização de coordenadas
  - `src/lib/redis/pubsub.ts` — canal de tracking
- **Fluxo:**
  1. Entregador ativa GPS (navigator.geolocation.watchPosition)
  2. Coordenadas enviadas via Server Action a cada 10s
  3. Publicadas no Redis pub/sub
  4. Cliente assina canal do seu pedido
  5. Mapa atualiza posição do entregador em tempo real
- **Battery-aware:** Só envia tracking se pedido estiver em status DELIVERING

#### 3.3 Atribuição de Entregas

- **Descrição:** Restaurante atribui pedido pronto a um entregador disponível
- **Arquivos novos:**
  - `src/components/kitchen/AssignDriverModal.tsx`
  - `src/actions/delivery-assignment.ts`
- **Regras:**
  - Apenas pedidos com status READY podem ser atribuídos
  - Entregador precisa estar ONLINE e não BUSY
  - Após atribuição, status do pedido muda para DELIVERING
  - Notificação push/email para o cliente

#### 3.4 Notificações em Tempo Real

- **Descrição:** Cliente recebe updates de status sem recarregar a página
- **Arquivos modificados:**
  - `src/app/orders/[id]/page.tsx` — adicionar subscription Redis
  - `src/hooks/useOrderNotifications.ts` — hook existente, integrar com Redis
- **Eventos:** ORDER_CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED

### Testes da Fase 3

- Teste de tracking com coordenadas mockadas
- Teste de atribuição de entrega (entregador disponível/indisponível)
- Teste de notificação em tempo real
- Teste de ciclo completo: Pedido → Cozinha → Entregador → Cliente

---

## Phase 4: White-Label e Lançamento (Mês 3)

**Goal:** Restaurantes premium têm domínio próprio e customização visual. App pronto para beta público.

### Features

#### 4.1 Domínio Próprio

- **Descrição:** Restaurante conecta seu próprio domínio (ex: pizzariadoze.com.br)
- **Arquivos novos:**
  - `src/app/dashboard/domain/page.tsx` — página de configuração de domínio
  - `src/actions/domain-actions.ts` — verificação DNS
- **Fluxo:**
  1. Restaurante informa domínio (ex: pizzariadoze.com.br)
  2. Sistema gera registro CNAME para apontar para `foodie.app`
  3. Verificação periódica de DNS
  4. Após confirmado, domínio fica ativo
  5. Redirecionamento 301 do subdomínio antigo para o novo

#### 4.2 Temas Customizáveis

- **Descrição:** Cores, fontes e layout customizáveis por restaurante
- **Arquivos novos:**
  - `src/app/dashboard/theme/page.tsx` — editor de tema
  - `src/lib/theme/resolver.ts` — resolução de tema por restaurante
- **Customizável:**
  - Cor primária e secundária
  - Fonte do título e corpo
  - Logo e favicon
  - Layout do cardápio (grid, lista)
  - Banner da homepage

#### 4.3 Billing (Assinaturas)

- **Descrição:** Planos de assinatura para restaurantes
- **Arquivos novos:**
  - `src/app/dashboard/billing/page.tsx`
  - `src/actions/billing-actions.ts`
- **Planos:**
  - **Grátis:** Subdomínio, tema básico, até 50 pedidos/mês
  - **Pro (R$ 97/mês):** Domínio próprio, temas, pedidos ilimitados, relatórios
  - **Enterprise (R$ 297/mês):** White-label completo, API, suporte prioritário

#### 4.4 Launch Checklist

- [ ] Deploy Vercel com domínio `foodie.app`
- [ ] Configurar Redis em produção (Upstash)
- [ ] Ativar Stripe em produção (chaves live)
- [ ] Configurar monitoramento (Vercel Analytics + Sentry)
- [ ] Teste de carga: 100 pedidos simultâneos
- [ ] LGPD: política de privacidade, termos de uso
- [ ] SEO: sitemap, meta tags, Open Graph para cardápios
- [ ] Backup automatizado do banco (Supabase)

### Testes da Fase 4

- Teste de verificação de domínio (DNS)
- Teste de aplicação de tema por restaurante
- Teste de checkout com Stripe em produção
- E2E: Onboarding completo → Publicar cardápio → Pedido → Entrega

---

## Riscos e Dependências

| Risco                                          | Probabilidade | Impacto | Mitigação                                                         |
| ---------------------------------------------- | ------------- | ------- | ----------------------------------------------------------------- |
| Supabase indisponível                          | Baixa         | Alto    | Cache Redis reduz dependência de leitura                          |
| Vercel cold start afetar checkout              | Média         | Médio   | ISR + Edge Functions para páginas críticas                        |
| Complexidade do white-label atrasar lançamento | Média         | Médio   | Fase 4 é opcional para MVP. Lançar sem white-label se necessário. |
| Gateways de pagamento rejeitarem conta         | Baixa         | Alto    | Começar com Pix manual (zero dependência externa)                 |
| Custo de Redis/Upstash escalar inesperadamente | Baixa         | Baixo   | Monitorar uso. Cache apenas dados quentes.                        |

## Dependências Externas

| Dependência             | Status         | Bloqueia         |
| ----------------------- | -------------- | ---------------- |
| Supabase (banco + auth) | Ativo          | Nada (já em uso) |
| Vercel (deploy)         | Ativo          | Lançamento       |
| Redis/Upstash           | Não contratado | Fase 2 (cache)   |
| Stripe live keys        | Não ativado    | Pagamentos reais |
| Domínio foodie.app      | Não registrado | Subdomínios      |
