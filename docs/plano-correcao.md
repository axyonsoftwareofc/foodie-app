# Plano de Correção — Segurança e UI/UX

> **Data:** 18/06/2026
> **Base:** `docs/relatorio-seguranca-uiux.md`
> **Decisões confirmadas:**
>
> - Acessibilidade: montar no layout (UX-H1)
> - CSP: habilitar enforce por padrão, manter `'unsafe-inline'` por ora (SEC-H4)
> - Cache de role: reduzir para 60s (SEC-H1)

---

## FASE 1 — Segurança BLOCKER

### Passo 1.1 — SEC-B1: `requireSuperAdmin()` real

- **Arquivo:** `src/actions/super-admin-actions.ts:9-11`
- Substituir no-op por função real (consulta `profile.role` via `getCurrentUser` + `prisma.profile.findUnique`).
- Aplicar no início de cada action exportada: `getSuperAdminMetrics`, `getAllRestaurants`, `toggleRestaurantActive`, `getAllUsers`, `setUserRole`, `getGlobalAuditLog`.

### Passo 1.2 — SEC-B2: auth + ownership em `populateRestaurantTemplate`

- **Arquivo:** `src/actions/restaurant-template-actions.ts:7-44`
- Adicionar `getCurrentUser` + `userOwnsRestaurant` antes de popular.

### Passo 1.3 — SEC-B3: auth em `uploadRestaurantImage`

- **Arquivo:** `src/actions/upload-actions.ts:17-55`
- Exigir `getCurrentUser` antes do upload.

### Passo 1.4 — SEC-B4: assinatura HMAC no webhook Mercado Pago

- **Arquivo:** `src/app/api/webhooks/mercadopago/route.ts:31-36`
- Remover secret da query string; verificar `x-signature` via HMAC-SHA256 com `timingSafeEqual`.

---

## FASE 2 — Segurança HIGH

### Passo 2.1 — SEC-H1: cache de role 60s

- **Arquivo:** `middleware.ts:100` — `age > 3600` → `age > 60`.

### Passo 2.2 — SEC-H2: fail-closed no secret

- **Arquivos:** `middleware.ts:48-55`, `src/lib/redis.ts:95-102` — permitir fallback só em `test`/localhost.

### Passo 2.3 — SEC-H3: comparação time-safe

- **Arquivos:** `middleware.ts:97`, `src/lib/redis.ts:115` — usar `crypto.timingSafeEqual`.

### Passo 2.4 — SEC-H4: CSP enforce por padrão

- **Arquivo:** `next.config.ts:27-28` — inverter flag.

### Passo 2.5 — SEC-H5: colunas públicas em `/api/restaurants`

- **Arquivo:** `src/app/api/restaurants/route.ts:69-79` — trocar `select('*')` por lista explícita sem `bank_info`.

### Passo 2.6 — SEC-H6: reprecificar `/api/mesa/[tableId]`

- **Arquivo:** `src/app/api/mesa/[tableId]/route.ts:91-120` — usar `calculateOrderPricing` + Zod.

### Passo 2.7 — SEC-H7: validar valor pago no webhook

- **Arquivo:** `src/lib/payments/webhook-order-update.ts:35-49` — adicionar `paidAmount` e validar contra `order.total`.

---

## FASE 3 — Segurança MEDIUM/LOW

### Passo 3.1 — SEC-M3: `createDriver` sem `userId` do cliente

- **Arquivo:** `src/actions/delivery-actions.ts:399-442`

### Passo 3.2 — SEC-M4/M5: Zod em actions e payments

- `orders.ts`, `waiter-actions.ts`, `restaurantActions.ts`, rotas de pagamento.

### Passo 3.3 — SEC-M6/M7: `updatePassword` com rate-limit + força de senha

- **Arquivo:** `src/actions/auth.ts:133-145`

### Passo 3.4 — SEC-L1..L4: limpeza

- `orders.ts` (logger), `api/health` (token por padrão), `redis.ts` (remover código morto), `pix/route.ts` (falhar sem PIX_KEY), `middleware.ts` (comentário).

---

## FASE 4 — UI/UX HIGH

### Passo 4.1 — UX-H1: montar acessibilidade no layout

- **Arquivo:** `src/app/layout.tsx` — adicionar `AccessibilityProvider` + `AccessibilityWidget`.

### Passo 4.2 — UX-H2: corrigir rota `/search`

- **Arquivo:** `src/components/layout/BottomNav.tsx:12` — apontar para `/?focus=search`.

### Passo 4.3 — UX-H3: ligar `CancelOrderModal`

- **Arquivo:** `src/app/orders/[id]/page.tsx:406-415`

### Passo 4.4/4.5 — UX-H4/H5: confirmação em destrutivas + botão mesa acessível

- `CartSidebarGlobal.tsx`, `dashboard/mesas/page.tsx`.

---

## FASE 5 — UI/UX MEDIUM/LOW

### Passo 5.1 — UX-M1: `loading.tsx`/`error.tsx` por segmento

### Passo 5.2 — UX-M2: surfacing de erros (cozinha, upload, PIX)

### Passo 5.3 — UX-M3: acessibilidade de modais

### Passo 5.4 — UX-M4: variáveis de tema (dark mode)

### Passo 5.5 — UX-M5/M6 + LOW

---

## Verificação após cada fase

- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:run`
