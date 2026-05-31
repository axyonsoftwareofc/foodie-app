# Foodie App — Autenticação

Este documento descreve como a autenticação funciona no Foodie App. O projeto usa **Supabase Auth** como provedor de identidade, com Server Actions do Next.js como camada de API e cookies HTTP-only para sessão.

---

## Arquitetura de Autenticação

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Browser    │────▶│  Next.js Middle- │────▶│   Supabase   │
│  (cookies)   │     │  ware + Actions  │     │     Auth     │
└──────────────┘     └─────────────────┘     └──────────────┘
```

- **Provedor:** Supabase Auth (email/senha + Google OAuth)
- **Sessão:** Cookies HTTP-only gerenciados pelo `@supabase/ssr`
- **Frontend:** Contexto React (`AuthContext`) + hooks
- **Backend:** Server Actions + middleware de rota
- **Não há endpoints REST** em `/api/auth/*` — toda comunicação é via Server Actions e chamadas diretas ao Supabase

---

## Fluxos de Autenticação

### 1. Registro

**Entry point:** Página `/sign-up` ou chamada programática

```typescript
// Client-side (via AuthContext)
const { error, success } = await signUp(email, password, fullName);
```

**Server Action:** `signUpWithEmail()` em `src/actions/auth.ts`

- Validação Zod do formulário (senha: 8+ chars, maiúscula, minúscula, número, símbolo)
- Rate limiting por email (5 tentativas / 60s)
- Supabase envia email de confirmação (configurável no dashboard)

```
POST (Server Action) signUpWithEmail({ email, password, fullName })
  → Zod validação
  → Rate limit check
  → supabase.auth.signUp({ email, password, options: { data: { full_name } } })
  ← { success, message } | { error }
```

### 2. Login (Email/Senha)

**Entry point:** Página `/sign-in`

```typescript
// Client-side (via AuthContext)
const { error } = await signIn(email, password);
```

**Server Action:** `signInWithEmail()` em `src/actions/auth.ts`

- Rate limiting por email (5 tentativas / 60s)
- Redireciona para `/` após sucesso

**Redirect pós-login:** O parâmetro `?redirectTo=/caminho` na URL de `/sign-in` permite redirecionar o usuário para a página de origem.

```
POST (Server Action) signInWithEmail({ email, password })
  → Rate limit check
  → supabase.auth.signInWithPassword({ email, password })
  → redirect('/') ou redirectTo validado
  ← { error } em caso de falha
```

### 3. Login (Google OAuth)

**Entry point:** Botão "Entrar com Google" nas páginas de auth

```typescript
// Client-side (via GoogleButton)
supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
```

**Callback:** `src/app/auth/callback/route.ts`

- Troca o `code` da URL por uma sessão via `supabase.auth.exchangeCodeForSession(code)`
- Redireciona para `/?auth=success` para o `AuthContext` detectar e recarregar o perfil

**Importante:** O parâmetro `redirectTo` do OAuth é validado para evitar open redirect (apenas caminhos relativos são aceitos).

```
GET /auth/callback?code=xxx
  → supabase.auth.exchangeCodeForSession(code)
  → redirect('/?auth=success')
```

### 4. Logout

```typescript
// Client-side (via AuthContext)
await signOut();
```

**Server Action:** `signOut()` em `src/actions/auth.ts`

- Chama `supabase.auth.signOut()` que invalida os cookies de sessão
- Redireciona para `/sign-in`

```
POST (Server Action) signOut()
  → supabase.auth.signOut()
  → redirect('/sign-in')
```

### 5. Recuperação de Senha

**Entry point:** Página `/forgot-password`

```typescript
// Client-side
const { success, error } = await resetPassword(email);
```

**Server Action:** `resetPassword()` em `src/actions/auth.ts`

- Rate limiting por email (5 tentativas / 60s)
- Envia email com link mágico para `/reset-password`

```
POST (Server Action) resetPassword(email)
  → Rate limit check
  → supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })
  ← { success, message } | { error }
```

### 6. Atualização de Senha

**Entry point:** Página `/reset-password` (após receber email)

```typescript
// Server Action
const { success, error } = await updatePassword(newPassword);
```

**Server Action:** `updatePassword()` em `src/actions/auth.ts`

- Requer sessão ativa (usuário veio do link de recuperação)

```
POST (Server Action) updatePassword(password)
  → supabase.auth.updateUser({ password })
  ← { success, message } | { error }
```

---

## Autorização (RBAC)

### Roles

| Role          | Permissão                                      |
| ------------- | ---------------------------------------------- |
| `ADMIN`       | Acesso total ao sistema                        |
| `GERENCIADOR` | Gerencia restaurante próprio, dashboard, admin |
| `EQUIPE`      | Acesso ao dashboard do restaurante             |
| `CLIENTE`     | Acesso básico (fazer pedidos, ver perfil)      |

### Como funciona

1. **Middleware** (`middleware.ts`): Bloqueia rotas `/admin`, `/dashboard`, `/driver` baseado no role
2. **Cookie cache:** O role é cacheado em cookie HTTP-only assinado com HMAC por 7 dias
3. **Server Actions/API:** Cada operação de escrita verifica ownership via funções em `src/lib/authz.ts`
4. **Client-side:** `AuthContext.hasRole('ADMIN')` para condicionar UI (não substitui verificação server-side)

### Hierarquia

```
ADMIN > GERENCIADOR > EQUIPE > CLIENTE
```

- Rotas `/admin/*` exigem `GERENCIADOR` ou superior
- Rotas `/dashboard/*` exigem `EQUIPE` ou superior
- Rotas `/driver/*` exigem `EQUIPE` ou superior
- Rotas `/profile`, `/orders`, `/checkout`, `/cart`, `/favorites` exigem autenticação

---

## Middleware de Proteção

O middleware (`middleware.ts`) protege automaticamente:

| Rota                                                                    | Requisito                              |
| ----------------------------------------------------------------------- | -------------------------------------- |
| `/admin/*`                                                              | Role ≥ `GERENCIADOR`                   |
| `/dashboard/*`                                                          | Role ≥ `EQUIPE`                        |
| `/driver/*`                                                             | Role ≥ `EQUIPE`                        |
| `/profile`, `/orders`, `/addresses`, `/cart`, `/favorites`, `/checkout` | Autenticado                            |
| `/sign-in`, `/sign-up`                                                  | Redireciona para `/` se já autenticado |

Rotas de API (`/api/*`) e o callback OAuth são excluídos do middleware e fazem sua própria verificação de autenticação.

---

## Arquivos Relevantes

| Arquivo                                   | Função                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `src/actions/auth.ts`                     | Server Actions: signIn, signUp, signOut, resetPassword, updatePassword |
| `src/contexts/AuthContext.tsx`            | Contexto React: estado de auth, refresh, signIn, signUp, signOut       |
| `src/hooks/useAuth.ts`                    | Hook para componentes acessarem o contexto                             |
| `src/lib/auth.ts`                         | `getServerSession()`, `requireAuth()` para Server Components           |
| `src/lib/authz.ts`                        | Verificações de ownership (restaurante, categoria, produto, etc.)      |
| `src/lib/supabase/server.ts`              | Cliente Supabase server-side (cookies)                                 |
| `src/lib/supabase/client.ts`              | Cliente Supabase browser-side                                          |
| `src/app/auth/callback/route.ts`          | Callback OAuth (Google)                                                |
| `middleware.ts`                           | Proteção de rotas, RBAC, cache de role                                 |
| `src/lib/validations/auth.validations.ts` | Schemas Zod de validação                                               |

---

## Testando com Postman

O projeto **não expõe endpoints REST de autenticação**. Para testar fluxos de auth:

1. Use o fluxo normal do browser em `http://localhost:3000/sign-in`
2. Para testes automatizados, use os testes E2E do Playwright (`npm run test:e2e`)
3. Os arquivos em `docs/postman/` são legados e podem não refletir a API atual
