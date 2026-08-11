# Auditoria de Código — Foodie App

**Data:** 10 de agosto de 2026
**Escopo:** caminhos críticos — autenticação/autorização, middleware, multi-tenancy,
server actions, pagamentos e webhooks, **e desempenho da área do restaurante**. Não é
uma auditoria de segurança completa nem uma varredura de UI/componentes.
**Método:** leitura direta do código (não confie apenas em relatórios antigos de `docs/`).
Cada achado aponta arquivo/linha e uma recomendação.

> **Atualização (relatada pelo usuário):** o app está lento, sobretudo a área do
> restaurante (`/dashboard`). A investigação de causa raiz está na seção
> **[Desempenho](#0-desempenho-área-do-restaurante)** abaixo (achados P1–P4).

## Resumo

| #   | Achado                                                                       | Categoria      | Severidade |
| --- | ---------------------------------------------------------------------------- | -------------- | ---------- |
| P1  | Waterfalls de dados client-side no dashboard (`useEffect` → server action)   | Desempenho     | **Alta**   |
| P2  | `auth.getUser()` (round-trip de rede) repetido por navegação                 | Desempenho     | **Alta**   |
| P3  | `getRestaurantAccess` escreve no banco em caminho de leitura (= #2)          | Desempenho     | Média      |
| P4  | Consultas sem paginação / seleção ampla e busca em memória                   | Desempenho     | Baixa      |
| 1   | Dois modelos de autorização divergentes (dono único vs RBAC de membros)      | Inconsistência | **Média**  |
| 2   | Função de autorização faz escritas no banco (efeitos colaterais)             | Dívida/Risco   | **Média**  |
| 3   | `Order.items`/`kitchen_notes` como JSON sem tipo forte nem tabela relacional | Dívida         | **Média**  |
| 4   | Staleness da role em cache (até 60s) e `maxAge` de 7 dias enganoso           | Risco (baixo)  | Baixa      |
| 5   | Extração de IP inconsistente entre middleware e rate-limit                   | Inconsistência | Baixa      |
| 6   | Webhook do Mercado Pago consulta a API antes do check de idempotência        | Eficiência     | Baixa      |
| 7   | Cliente Stripe duplicado com `apiVersion as any` e versão hardcoded          | Dívida         | Baixa      |
| 8   | `canUserCreateRestaurant` libera quando não há profile                       | Observação     | Baixa      |
| 9   | Restos de exemplo do Sentry e OpenAPI incompleto                             | Higiene        | Info       |
| 10  | Nomenclatura de rotas mistura PT/EN                                          | Consistência   | Info       |
| 11  | `GRANT EXECUTE` duplicado no SQL do hook                                     | Cosmético      | Info       |
| 12  | `/api/tables` ficou fora da unificação de autorização (ainda só-dono)        | Inconsistência | **Média**  |
| 13  | Tipo `RestaurantTable` diverge do schema Prisma                              | Dívida         | Baixa      |

> **Não é problema:** `.env*`, `*.log`, `replay_*.log` e `*.tsbuildinfo` estão no
> `.gitignore` e não são versionados — nenhum segredo vaza pelo repositório. Os webhooks
> de pagamento verificam assinatura, aplicam idempotência (TTL 24h) e conferem o valor
> pago contra o total do pedido — este fluxo está sólido.

---

## 0. Desempenho (área do restaurante)

**Sintoma relatado:** app lento no geral, com destaque para `/dashboard`.
**Método:** leitura dos caminhos de dados do dashboard (páginas, layout e as server
actions que elas chamam). Um profiling em runtime confirmaria a ordem de grandeza, mas a
causa é arquitetural e visível no código.

**Diagnóstico resumido:** o gargalo **não** é query pesada nem falta de índice — o
`prisma` é singleton (`src/lib/prisma.ts`) e a tabela `orders` tem bons índices
(`@@index([restaurant_id, status])`, `([restaurant_id, created_at])`, etc.). O problema é
a combinação de **busca de dados no cliente em cascata** com **revalidação de sessão por
rede repetida**.

### P1. Waterfalls de dados client-side no dashboard — **Alta**

> **Status (2026-08-11): RESOLVIDO.** As quatro telas (`page`, `equipe`, `entregadores`,
> `mesas`) foram convertidas: a `page.tsx` virou Server Component que busca no servidor e
> passa os dados por prop para um componente client (`DashboardHome`, `EquipeClient`,
> `EntregadoresClient`, `MesasClient`). Os dados do servidor ficam em **props, não em
> `useState`**, para refletirem as revalidações. Atualização pós-mutação via
> `revalidatePath` (equipe/entregadores) ou `router.refresh()` (mesas). Removidos os
> `useEffect` de carga inicial, estados de loading e spinners.
> **Efeito colateral positivo:** sumiram os warnings `react-hooks/set-state-in-effect`
> que o Next 16.3 apontava nessas telas.

**Onde:** `src/app/(main)/dashboard/page.tsx` (`'use client'`, `useEffect` →
`getOrderStats`, linha 22), `.../equipe/page.tsx` (`useEffect` → `getTeamOverview`,
linha 68), `.../entregadores/page.tsx` (`getDrivers`), `.../mesas/page.tsx`
(`fetch('/api/tables')`).

Essas páginas são Client Components que só disparam a busca de dados **depois** de montar
no navegador (`render → mount → fetch`). Isso cria uma cascata: baixar HTML → baixar/parsear
JS → montar → **só então** iniciar a requisição de dados. Não há SSR, streaming nem
paralelismo. Já `orders/page.tsx` e `menu/page.tsx` são Server Components que buscam no
servidor e chegam prontos — são o padrão bom a seguir.

**Recomendação:** converter as páginas de dashboard para **Server Components** que buscam
os dados no servidor e passam por props (ou via `<Suspense>` + streaming). Onde a
interatividade exigir cliente, buscar no Server Component pai e passar os dados para um
filho client — mantendo o fetch fora do `useEffect`.

### P2. `auth.getUser()` repetido (round-trip de rede) — **Alta**

> **Status (2026-08-11): RESOLVIDO no caminho de renderização.** A validação de sessão
> passou a ser deduplicada por request via `cache()` do React (`getServerSession`, em
> `src/lib/auth.ts` — o mesmo mecanismo que `createClient` já usava).
> `getRestaurantAccess` foi dividido em `loadRestaurantContext` (parte cara, cacheada,
> sem dependência dos papéis) e um portão fino que aplica a checagem de papel; assinatura
> e semântica preservadas nos 43 call sites. `getRestaurantProfile` (layout) e as ações de
> `orders.ts` também passaram a usar a sessão cacheada.
> Chamadas cruas a `auth.getUser()` no projeto: **61 → 34** (as restantes são mutations,
> que rodam em requests próprios, onde o dedupe não se aplica).
> **Permanece:** o `auth.getUser()` do middleware — roda em runtime separado (edge) e não
> compartilha o cache. Eliminá-lo exigiria confiar no cookie (`getSession`), abrindo mão
> da verificação do JWT no servidor — **não recomendado**.

**Onde:** 61 chamadas a `supabase.auth.getUser()` no código (ex.: `orders.ts` 9x,
`restaurantActions.ts` 7x, `delivery-actions.ts` 6x). `auth.getUser()` **revalida o JWT
contra o servidor Auth do Supabase a cada chamada** (ida à rede) — diferente de ler a
sessão do cookie localmente.

Numa única visita ao dashboard, as validações acontecem **em série**: middleware
(`middleware.ts`) → `dashboard/layout.tsx` chama `getRestaurantProfile()` (getUser +
query) → a página client chama sua action (getUser + query). Cada camada soma latência de
rede antes de qualquer dado aparecer.

**Recomendação:**

- Reduzir o **número** de validações por navegação: consolidar múltiplas actions de uma
  mesma tela numa única action "batch" (já há `profile-batch-actions.ts` como precedente).
- Dedupe por request: `src/lib/auth.ts` já expõe `getServerSession`/`requireAuth`
  encapsulados em `cache()` (dedupe dentro do mesmo render). As **actions**, porém,
  recriam client + `getUser()` — padronizar para reutilizar um resolvedor de usuário
  cacheado por request reduz idas repetidas à rede dentro de um mesmo Server Component.
- Como o middleware já valida a sessão nas rotas protegidas, avaliar confiar nessa
  validação para leituras subsequentes do mesmo request em vez de revalidar em cada action.

### P3. `getRestaurantAccess` escreve em caminho de leitura — **Média** (ver achado #2)

**Correção de uma imprecisão da primeira versão deste relatório:** afirmei que cada carga
disparava `INSERT`/`UPDATE`. Na verdade `ensureOwnerMember` tem um _fast path_ — se o
membro já existe e está consistente (`user_id`, email, `OWNER`, `ATIVO`), apenas retorna;
o mesmo vale para `ensureMinimumAppRole`, que só promove quando o profile é `CLIENTE`.
Em regime estável são **leituras extras**, não escritas.

O custo real, portanto, é (a) queries adicionais por call site e (b) uma função de
autorização com **capacidade** de escrever — surpreendente e difícil de raciocinar.
O item (a) foi mitigado pelo cache por request do P2; o item (b) é o que o achado #2
(separar autorização de provisionamento) endereça.

### P4. Consultas sem paginação / seleção ampla — **Baixa**

**Onde:** `orders.ts` `getOrders` (cliente) busca **todos** os pedidos sem paginação nem
`select` enxuto (linha 419); `getOrdersForRestaurant` inclui `reviews` de até 100 pedidos
e filtra por nome de item **em memória** (linhas 923-947).

**Impacto:** baixo hoje, cresce com o volume de pedidos. **Recomendação:** paginar
`getOrders`, restringir `select` aos campos usados, e (médio prazo) mover a busca por item
para SQL/coluna indexada se virar recurso central.

### Prioridade de desempenho

1. **P1** — converter o dashboard para Server Components (maior ganho percebido, isolado).
2. **P2** — reduzir/deduplicar validações de sessão por navegação.
3. **P3/P4** — vêm de brinde ao corrigir #2 e ao paginar consultas.

---

## 1. Dois modelos de autorização divergentes — **Média**

> **Status (2026-08-10): RESOLVIDO.** Menu (`categoryActions`, `productActions`),
> config (`restaurantActions`), `upload-actions`, `restaurant-template-actions` e as
> rotas `/api/{categories,products,restaurants}` foram migrados para o RBAC de membros
> (`getRestaurantAccess`), escopando cada recurso ao restaurante do acesso. Papéis:
> gestão = `OWNER/MANAGER`; **dados bancários e exclusão do restaurante = OWNER**;
> **status de mesa inclui WAITER**. Coberto por 34 testes novos (typecheck + suíte verdes).
> **Pendência menor:** os helpers só-dono em `src/lib/authz.ts` (`getOwnedCategory`,
> `getOwnedProduct`, `userOwnsRestaurant`, `userOwnsTable`, `userOwnsReviewRestaurant`)
> ficaram **sem uso** — candidatos a remoção para evitar reintrodução do modelo antigo.
> `getCurrentUser` permanece (usado por pagamentos e super-admin).

**Onde:** `src/lib/authz.ts` vs `src/lib/restaurant-access.ts`.

O projeto tem duas formas incompatíveis de decidir "este usuário pode gerir este
restaurante?":

- **`authz.ts` — dono único:** checa `restaurant.user_id === userId`
  (`userOwnsRestaurant`, `getOwnedCategory`, `getOwnedProduct`, ...). Usado por
  `categoryActions.ts` (linhas 87, 119, 156, 197), `productActions.ts` (171, 218, 271,
  302), `restaurantActions.ts`, `restaurant-template-actions.ts`, `upload-actions.ts` e
  pelas rotas `src/app/api/{categories,products,restaurants}/route.ts` e de pagamento.
- **`restaurant-access.ts` — RBAC de membros:** `getRestaurantAccess(allowedRoles)` com
  `OWNER/MANAGER/KITCHEN/WAITER/DRIVER`. Usado por `team-actions.ts`,
  `delivery-actions.ts`, `waiter-actions.ts`, `restaurant-creation.ts`.

**Impacto:** um membro convidado como `MANAGER` (ou `KITCHEN`) **não** consegue editar
cardápio, categorias ou produtos, porque essas actions só aceitam o dono via `user_id`.
O sistema de equipe/convites (`RestaurantMember`, `RestaurantInvitation`) sugere que
gestores deveriam ter esse acesso — há uma expectativa quebrada.

**Recomendação:** convergir para `restaurant-access.ts` como fonte única de autorização
por restaurante. Migrar as actions de menu/produto/categoria para
`getRestaurantAccess(MANAGEMENT_ROLES)` e aposentar gradualmente os helpers "owner-only"
de `authz.ts` (mantendo `getCurrentUser`). Decidir isto antes de adicionar novas
funcionalidades de gestão para não ampliar a divergência.

## 2. Autorização com efeitos colaterais de escrita — **Média**

**Onde:** `src/lib/restaurant-access.ts` — `getRestaurantAccess` (linhas 129-201),
`ensureOwnerMember` (55-103), `ensureMinimumAppRole` (105-127).

`getRestaurantAccess` tem `ensureMembership = true` por padrão e, ao ser chamada,
**escreve no banco**: cria/atualiza o `RestaurantMember` do dono e promove o `Profile`
de `CLIENTE` para `EQUIPE`. Ou seja, uma função com nome de verificação de acesso muta
estado como efeito colateral — inclusive em caminhos que poderiam ser apenas leitura.

**Impacto:** requisições GET deixam de ser idempotentes; auto-promoção de role acontece
de forma implícita; comportamento surpreendente para quem chama esperando só uma
checagem. Também acopla auth a provisionamento.

**Recomendação:** separar responsabilidades — uma função pura de autorização
(sem escrita) e um passo explícito de provisionamento (`provisionOwnerMembership`)
chamado apenas no fluxo de criação/onboarding do restaurante. No mínimo, tornar o
`ensureMembership=false` o padrão e documentar quando o provisionamento é desejado.

## 3. `Order.items` como JSON sem tipo forte — **Média**

**Onde:** `prisma/schema.prisma` (Order.items: `Json`, Order.kitchen_notes: `Json`),
`src/lib/payments/order-payment.ts` (`parseItems`, linhas 26-37).

Os itens do pedido são gravados como JSON livre. `parseItems` aceita tanto **array**
quanto **string JSON** — sinal de que o formato gravado não é consistente entre os
caminhos de criação de pedido. Não há tabela relacional `OrderItem`, logo não há
integridade referencial com `Product` nem garantia histórica de preço/nome além do que
ficou serializado.

**Impacto:** risco de dados malformados, dificuldade de relatórios/consultas por item,
e parsing defensivo espalhado. Divergência de shape pode causar bugs silenciosos em
recibo, cozinha e cálculo de pagamento.

**Recomendação:** definir um schema Zod único para o item de pedido e validar **na
escrita** (nas actions/rotas que criam pedidos), padronizando para array. Avaliar, em
médio prazo, extrair uma tabela `OrderItem` relacional se relatórios por item forem
necessários.

## 4. Staleness da role e `maxAge` enganoso — **Baixa**

**Onde:** `middleware.ts` — `ROLE_CACHE_MAX_AGE = 60` (linha 15), `ROLE_COOKIE_MAX_AGE`
= 7 dias (14), `verifyCookieValue` (96-119).

O cookie `foodie-role` é assinado por HMAC e só é confiável por **60s** (depois a role é
rebuscada). O desenho é razoável, mas: (a) o `maxAge` de 7 dias no cookie é enganoso —
a validade efetiva é 60s; (b) há uma janela de até 60s em que uma mudança de role
(ex.: rebaixar um usuário) ainda é aceita pelo middleware.

**Recomendação:** manter, mas documentar a janela de 60s como decisão explícita. Se
revogação imediata for requisito, invalidar o cookie no momento da troca de role
(setar `maxAge:0` no fluxo que altera `profiles.role`).

## 5. Extração de IP inconsistente — **Baixa**

**Onde:** `middleware.ts` `checkSentryTunnelRateLimit` usa `x-forwarded-for.split(',')[0]`
(**primeiro** hop, controlado pelo cliente, spoofável — linha 37). Já
`src/lib/rate-limit.ts` `getClientIp` usa por padrão o **último** hop (mais difícil de
forjar) e respeita `TRUSTED_PROXY_COUNT`.

**Impacto:** o rate limit do túnel do Sentry pode ser contornado trocando o primeiro IP
do header. Baixa gravidade (endpoint de telemetria), mas é inconsistente com o resto.

**Recomendação:** reusar `getClientIp`/`getClientIdentifierFromHeaders` de `rate-limit.ts`
no middleware para uma política única de confiança em proxies.

## 6. MP webhook consulta a API antes da idempotência — **Baixa**

**Onde:** `src/app/api/webhooks/mercadopago/route.ts` — `fetch` à API do MP (linhas
90-103) **antes** de `isDuplicateRequest` (105).

A assinatura é verificada primeiro (correto), mas cada reentrega duplicada do webhook
dispara uma chamada externa à API do Mercado Pago antes de perceber que é duplicata.

**Recomendação:** manter a verificação de assinatura no topo, e mover o check de
idempotência para logo após ela (antes do `fetch`). Cuidado: hoje a chave de idempotência
é o `paymentId`; se movida para antes, garantir que a chave seja estável sem depender do
corpo verificado pela API.

## 7. Cliente Stripe duplicado — **Baixa**

**Onde:** `src/app/api/webhooks/stripe/route.ts` (40-43) e
`src/app/api/payments/intent/route.ts` (54-58): ambos instanciam Stripe com
`apiVersion: (process.env.STRIPE_API_VERSION as any) || '2024-12-18.acacia'`.

**Impacto:** `as any` derruba a checagem de tipo da versão; versão default hardcoded em
dois lugares; risco de divergência.

**Recomendação:** centralizar num factory `getStripeClient()` (talvez em
`src/lib/utils/stripe.ts`, que já existe) e tipar a versão corretamente.

## 8. `canUserCreateRestaurant` libera sem profile — **Baixa / Observação**

**Onde:** `src/lib/restaurant-access.ts` (244-266): se não existe `Profile`, retorna
`{ allowed: true }`.

Provavelmente intencional (novo usuário pode criar seu primeiro restaurante e a regra
principal é "um restaurante ativo por usuário"). Registrado para confirmação de intenção
— não há checagem de role global aqui.

**Recomendação:** confirmar que criar restaurante deve ser permitido a qualquer usuário
autenticado; se não, adicionar checagem explícita de role.

## 9. Restos de exemplo e OpenAPI incompleto — **Info**

- `src/app/(main)/sentry-example-page/` e `src/app/api/sentry-example-api/route.ts` são
  exemplos de setup do Sentry — remover antes de produção.
- `src/lib/openapi.ts` tem TODO: "migrar para zod-openapi registry com os schemas Zod
  existentes". A rota `/api/docs` serve doc parcial.

## 10. Nomenclatura de rotas mistura PT/EN — **Info**

Convivem `dashboard/cozinha`, `dashboard/menu`, `criar-restaurante`, `convite-equipe`,
`waiter`, `mesa`, `planos`. Não é bug, mas prejudica previsibilidade.

**Recomendação:** adotar uma convenção (recomendo PT-BR para rotas de usuário, dado o
público) e documentá-la; migrar de forma incremental com redirects.

## 11. `GRANT EXECUTE` duplicado no SQL — **Cosmético**

**Onde:** `docs/supabase/custom-access-token-hook.sql` (linhas 55-56) repete o mesmo
`GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;`.
Sem efeito; remover a linha duplicada.

---

## 12. `/api/tables` ficou fora da unificação de autorização — **Média**

> **Status (2026-08-11): RESOLVIDO.** Os três handlers (GET, POST, DELETE) passaram a usar
> `getRestaurantAccess(MANAGEMENT_ROLES)`, escopando as queries ao restaurante do acesso.
> Coberto por 6 testes de contrato de autorização (`src/tests/api/tables.test.ts`).
> Nota: falhas de autorização agora respondem **403** (antes 401/404), consistente com as
> demais rotas migradas. O cliente só verifica `res.ok`, então não houve impacto.

**Onde:** `src/app/api/tables/route.ts` (GET, POST e DELETE) resolve o restaurante com
`.eq('user_id', user.id)` — o modelo **só-dono** que o achado #1 aposentou. Passou
despercebido porque a migração cobriu apenas `/api/{categories,products,restaurants}`.

**Impacto:** um `MANAGER` convidado não consegue gerenciar mesas por esta rota — a mesma
expectativa quebrada do achado #1. A tela `/dashboard/mesas` ainda usa esta rota para
criar/remover.

**Recomendação:** migrar os três handlers para `getRestaurantAccess(MANAGEMENT_ROLES)`,
como nas demais rotas. Alternativa mais enxuta: trocar as mutações da tela pelas server
actions `createTable`/`deleteTable` (já em RBAC) e remover a rota — mas isso depende do
achado #13.

## 13. Tipo `RestaurantTable` diverge do banco — **Baixa**

**Onde:** `src/types/restaurant-management.types.ts` declara `number: number` e
`status: 'available' | 'occupied' | 'reserved'` (minúsculas). O `prisma/schema.prisma`
usa `number String` e o enum `TableStatus` em **maiúsculas** (AVAILABLE/OCCUPIED/RESERVED).

**Impacto:** o tipo declarado não corresponde ao dado em runtime; quem confiar nele
escreve comparações que nunca casam (ex.: `status === 'available'`). Em
`/dashboard/mesas` a página normaliza defensivamente na fronteira
(`String(t.number)`, `String(t.status)`) justamente por causa disso.

**Recomendação:** alinhar o tipo ao schema (`number: string` e status em maiúsculas, de
preferência reusando o enum do Prisma) e remover as normalizações que existirem. Mudança
pequena, mas toca consumidores compartilhados — merece ser feita isolada, com typecheck.

## Prioridade sugerida

1. **Decidir o modelo de autorização único** (#1) — é a inconsistência de maior impacto
   funcional e bloqueia o recurso de equipe.
2. **Separar autorização de provisionamento** (#2).
3. **Padronizar e validar o shape de `Order.items`** (#3).
4. Restante (#4–#11) como higiene incremental.
