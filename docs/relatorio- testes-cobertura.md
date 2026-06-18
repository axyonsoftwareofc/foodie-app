# Relatório de Testes e Cobertura — Foodie App

> **Data:** 16/06/2026  
> **Projeto:** Foodie App — Plataforma SaaS B2B2C de delivery  
> **Repositório:** https://github.com/axyonsoftwareofc/foodie-app

---

## 1. Resumo Executivo

| Métrica                     | Valor                                                 |
| --------------------------- | ----------------------------------------------------- |
| **Testes unitários**        | 260 passed, 1 skipped, 0 failed                       |
| **Arquivos de teste**       | 29 (Vitest)                                           |
| **Testes E2E**              | 7 specs (Playwright)                                  |
| **Cobertura de statements** | 63,19%                                                |
| **Cobertura de branches**   | 52,14%                                                |
| **Cobertura de funções**    | 68,71%                                                |
| **Cobertura de linhas**     | 63,69%                                                |
| **Threshold configurado**   | Linhas 60%, Funções 60%, Branches 50%, Statements 60% |
| **Status**                  | ✅ Todos os thresholds atingidos                      |

---

## 2. Cobertura por Módulo

| Módulo                       | % Statements | % Branches | % Funções | % Linhas |   Status    |
| ---------------------------- | :----------: | :--------: | :-------: | :------: | :---------: |
| **hooks**                    |    86,07     |   83,05    |   95,83   |  85,00   |     ✅      |
| **components/ui**            |     100      |    100     |    100    |   100    |     ✅      |
| **lib/constants**            |     100      |    100     |    100    |   100    |     ✅      |
| **lib/validations**          |     100      |    100     |    100    |   100    |     ✅      |
| **lib/payments**             |     100      |   93,75    |    100    |   100    |     ✅      |
| **components/restaurant**    |    78,94     |   64,00    |   75,00   |  85,29   |     ✅      |
| **app/api/health**           |    71,42     |   62,50    |    100    |  73,52   |     ✅      |
| **components/accessibility** |    65,78     |   88,46    |   64,70   |  68,57   |     ✅      |
| **contexts**                 |    62,97     |   38,05    |   64,70   |  64,28   | ⚠️ Branches |
| **components/cart**          |    45,83     |   37,50    |   60,00   |  50,00   |     ⚠️      |
| **components/home**          |    46,15     |   63,63    |   33,33   |  46,15   |     ⚠️      |
| **lib/utils**                |    55,55     |   50,79    |   58,82   |  56,60   |     ⚠️      |
| **lib/supabase**             |      0       |    100     |     0     |    0     |     ❌      |
| **lib/rate-limit**           |     2,70     |     0      |     0     |   2,70   |     ❌      |
| **actions**                  |      0       |     0      |     0     |    0     |     ❌      |
| **AuthContext**              |     1,42     |     0      |     0     |   1,51   |     ❌      |

---

## 3. Cobertura Detalhada

### 3.1 Hooks (✅ 86,07%)

| Hook              | % Statements | Observação                             |
| ----------------- | :----------: | -------------------------------------- |
| `useDebounce`     |     100      | Cobertura total                        |
| `useFilters`      |    97,82     | Apenas linha 69 não coberta            |
| `useLocalStorage` |    93,33     | Linha 36 (erro de parsing) não coberta |
| `useFavorites`    |    79,41     | Linhas 31, 49-55 (casos de erro)       |
| `useOrders`       |    78,72     | Linhas 39-40, 55, 76-82                |
| `useCart`         |      75      | Linha 16                               |
| `useAuth`         |      60      | Linhas 46-48                           |

### 3.2 Componentes

| Componente                | % Statements | Observação                |
| ------------------------- | :----------: | ------------------------- |
| `Skeleton.tsx`            |     100      | Cobertura total           |
| `ThemeToggle.tsx`         |     100      | Cobertura total           |
| `SkipLinks.tsx`           |     100      | Cobertura total           |
| `MenuItemModal.tsx`       |    78,94     | Linhas 43, 71-72, 77, 146 |
| `AccessibilityWidget.tsx` |    64,86     | Linhas 66, 121, 170, 198  |
| `CouponInput.tsx`         |    45,83     | Linhas 17-32, 37, 43      |
| `RestaurantCard.tsx`      |    46,15     | Linhas 36-44, 85          |

### 3.3 Contextos

| Contexto                   | % Statements | Observação                     |
| -------------------------- | :----------: | ------------------------------ |
| `ThemeContext.tsx`         |    91,42     | Linhas 32, 74, 87              |
| `AccessibilityContext.tsx` |    90,19     | Linhas 44, 54, 101-102, 129    |
| `CartContext.tsx`          |    81,13     | Linhas 71-72, 85-96, 229       |
| `AuthContext.tsx`          |     1,42     | **Praticamente sem cobertura** |

### 3.4 Utilitários

| Utilitário          | % Statements | Observação                     |
| ------------------- | :----------: | ------------------------------ |
| `coupon.utils.ts`   |    93,75     | Linha 52                       |
| `cart.utils.ts`     |    72,72     | Linhas 43-44                   |
| `focus.utils.ts`    |      75      | Linhas 19-20, 68-72            |
| `checkout.utils.ts` |    36,84     | Linhas 21, 73-164              |
| `format.utils.ts`   |      20      | Linhas 26-60                   |
| `rate-limit.ts`     |     2,70     | **Praticamente sem cobertura** |

---

## 4. Testes E2E (Playwright)

### 4.1 Specs existentes

| Arquivo                   | Fluxo testado                          |
| ------------------------- | -------------------------------------- |
| `home.spec.ts`            | Homepage, busca, navegação             |
| `checkout-flow.spec.ts`   | Fluxo completo de checkout             |
| `kitchen-flow.spec.ts`    | Kanban da cozinha, alteração de status |
| `delivery-cycle.spec.ts`  | Ciclo de entrega, rastreamento         |
| `onboarding-flow.spec.ts` | Onboarding do restaurante              |
| `redis-health.spec.ts`    | Health check Redis                     |
| `webhooks.spec.ts`        | Webhooks de pagamento                  |

### 4.2 Browsers configurados

- Chromium (Desktop)
- Firefox (Desktop)
- Mobile Safari (iPhone 13)
- Android Chrome (Pixel 5)

**Paralelização:** Total (retry: 2 em CI, 0 local)

---

## 5. Lacunas Identificadas (Gaps)

### 5.1 Zonas sem cobertura (0%)

| Arquivo                                            | Risco                                     | Prioridade |
| -------------------------------------------------- | ----------------------------------------- | :--------: |
| **Server Actions** (`src/actions/`) — 20+ arquivos | **Crítico** — lógica de negócio principal |  🔴 Alta   |
| **AuthContext** (`src/contexts/AuthContext.tsx`)   | **Alto** — estado global de autenticação  |  🔴 Alta   |
| **rate-limit.ts**                                  | **Médio** — proteção contra abuso         |  🟡 Média  |
| **supabase/server.ts**                             | **Médio** — cliente server-side           |  🟡 Média  |

### 5.2 Cobertura insuficiente

| Arquivo              | Cobertura | Problema                 | Prioridade |
| -------------------- | :-------: | ------------------------ | :--------: |
| `format.utils.ts`    |    20%    | Formatação de moeda/data |  🟡 Média  |
| `checkout.utils.ts`  |  36,84%   | Lógica de checkout       |  🟡 Média  |
| `CouponInput.tsx`    |  45,83%   | Componente de cupom      |  🟡 Média  |
| `RestaurantCard.tsx` |  46,15%   | Card de restaurante      |  🟢 Baixa  |
| `CartContext.tsx`    |  81,13%   | Faltam branches de cupom |  🟢 Baixa  |

### 5.3 Fluxos E2E não cobertos

| Fluxo                             | Risco | Prioridade |
| --------------------------------- | ----- | :--------: |
| Painel Super Admin                | Médio |  🟡 Média  |
| Gestão de equipe (convite/aceite) | Médio |  🟡 Média  |
| Upload de imagens (Cloudinary)    | Baixo |  🟢 Baixa  |
| Fluxo de cancelamento de pedido   | Médio |  🟡 Média  |
| Geração de QR code por mesa       | Baixo |  🟢 Baixa  |
| Tema white-label                  | Baixo |  🟢 Baixa  |

---

## 6. Configuração de Testes

### 6.1 Vitest

```ts
// vitest.config.ts
environment:       jsdom
globals:           true
setup file:        src/tests/setup.tsx
include:           src/tests/**/*.{test,spec}.{js,ts,jsx,tsx}
coverage provider: v8
coverage reporters: text, json, html
thresholds:
  lines:      60%
  functions:  60%
  branches:   50%
  statements: 60%
```

### 6.2 Mocks globais (setup.tsx)

- `localStorage` (getItem, setItem, removeItem, clear)
- `window.confirm` (retorna `true`)
- `next/navigation` (useRouter, useParams, usePathname)
- `next/image` (renderiza `<img>` simples)
- `sonner` (toast.success, error, info, warning)
- `@/lib/prisma` (PrismaClient mockado)
- `@/lib/redis` (getRedis retorna `null`)
- `@/lib/logger` (debug, info, warn, error)
- `@/lib/sentry` (captureException mockado)
- `@/lib/rate-limit` → **NÃO mockado** (usa graceful degradation real)

### 6.3 Scripts disponíveis

| Comando                 | Descrição           |
| ----------------------- | ------------------- |
| `npm run test`          | Vitest watch mode   |
| `npm run test:ui`       | Vitest UI dashboard |
| `npm run test:run`      | Single run (CI)     |
| `npm run test:coverage` | Com cobertura       |
| `npm run test:e2e`      | Playwright          |
| `npm run test:e2e:ui`   | Playwright com UI   |

---

## 7. Problemas Conhecidos nos Testes

| Problema                              | Arquivo                        | Impacto                                                                    |
| ------------------------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `window.matchMedia is not a function` | `ThemeToggle.test.tsx`         | Baixo — jsdom não implementa matchMedia. Testes passam mas exibem warning  |
| `Error parsing stored orders`         | `useOrders.test.ts`            | Esperado — testa cenário de JSON inválido intencionalmente                 |
| `Error reading localStorage`          | `useLocalStorage.test.ts`      | Esperado — testa cenário de JSON inválido                                  |
| 1 teste skipped                       | `AccessibilityWidget.test.tsx` | `should close panel when close button is clicked` — possivelmente instável |

---

## 8. Recomendações

### 🔴 Prioridade Alta

1. **Criar testes para Server Actions** — 20+ arquivos em `src/actions/` sem cobertura. Esta é a camada crítica de lógica de negócio (auth, pedidos, pagamentos, restaurantes)
2. **Testar AuthContext** — Estado global de autenticação com apenas 1,42% de cobertura
3. **Adicionar teste para rate-limit.ts** — Lógica de segurança essencial

### 🟡 Prioridade Média

4. **Aumentar cobertura de format.utils.ts** e `checkout.utils.ts`
5. **Adicionar testes E2E** para Super Admin, equipe, upload e cancelamento
6. **Corrigir teste skipped** no AccessibilityWidget
7. **Mockar window.matchMedia** no setup para eliminar warnings do ThemeToggle

### 🟢 Prioridade Baixa

8. **Aumentar cobertura de CouponInput** (45,83%) e `RestaurantCard` (46,15%)
9. **Cobertura de CartContext** — branches de cupom não testados
10. **Testes para supabase/server.ts** — mas depende de ter servidor Supabase disponível

---

## 9. Evolução da Cobertura (Sugestão de Metas)

|       Marco        | Statements | Branches | Funções | Linhas |
| :----------------: | :--------: | :------: | :-----: | :----: |
|    **Atual** ✅    |    63%     |   52%    |   69%   |  64%   |
| **Curto prazo** 🎯 |    70%     |   60%    |   75%   |  70%   |
| **Médio prazo** 🎯 |    80%     |   70%    |   85%   |  80%   |
| **Longo prazo** 🎯 |    90%     |   80%    |   90%   |  90%   |
