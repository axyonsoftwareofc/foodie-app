# Relatório de Funcionalidades — Foodie App

**Projeto:** Foodie App — Plataforma SaaS B2B2C de delivery de alimentos  
**Estágio:** Protótipo/MVP  
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Prisma · Supabase · Redis · Stripe  
**Repositório:** https://github.com/axyonsoftwareofc/foodie-app

---

## 1. Autenticação e Autorização

| Funcionalidade            | Descrição                                                                       |
| ------------------------- | ------------------------------------------------------------------------------- |
| **Email/Senha**           | Cadastro e login via Supabase Auth com Server Actions                           |
| **Google OAuth**          | Login com conta Google via Supabase OAuth                                       |
| **Recuperação de Senha**  | Fluxo completo de "esqueci senha" com email de redefinição                      |
| **RBAC Multi-nível**      | 5 papéis de sistema: `SUPER_ADMIN`, `ADMIN`, `GERENCIADOR`, `EQUIPE`, `CLIENTE` |
| **RBAC de Restaurante**   | 5 papéis por restaurante: `OWNER`, `MANAGER`, `KITCHEN`, `WAITER`, `DRIVER`     |
| **Proteção de Rotas**     | Middleware que verifica autenticação e redireciona não-autenticados             |
| **Cache de Papel (Role)** | Cookie assinado (`foodie-role`) evita consulta ao DB a cada requisição          |
| **JWT Custom Hook**       | Hook SQL no Supabase que injeta o papel do usuário no `app_metadata` do JWT     |
| **Rate Limiting**         | Endpoints críticos (auth, pagamento) limitados via Redis                        |
| **Rotas por Subdomínio**  | Cada restaurante tem um subdomínio próprio reescrito via middleware             |

---

## 2. Frontend — Cliente

| Funcionalidade                 | Descrição                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Busca de Restaurantes**      | Campo de busca com debounce, filtros por categoria, avaliação, taxa de entrega                                |
| **Lista de Restaurantes**      | Cards com imagem, avaliação, tempo de entrega, taxa, status aberto/fechado                                    |
| **Cardápio Público**           | Categorias com produtos, preços, descrições, imagens, opções e badges                                         |
| **Carrinho de Compras**        | Sidebar global, adicionar/remover itens, controle de quantidade, cupom de desconto, persistência localStorage |
| **Checkout**                   | Multi-etapas: endereço, cálculo de entrega, método de pagamento, resumo do pedido                             |
| **Histórico de Pedidos**       | Listagem de pedidos anteriores com detalhes e status em tempo real                                            |
| **Favoritos**                  | Salvar e remover restaurantes favoritos                                                                       |
| **Gerenciamento de Endereços** | CRUD de endereços salvos, auto-preenchimento ViaCEP, endereço padrão                                          |
| **Perfil do Usuário**          | Editar nome, telefone, avatar, verificação de email                                                           |
| **Preferências**               | Restrições alimentares, cozinhas favoritas, notificações                                                      |
| **Privacidade (LGPD)**         | Visibilidade do perfil, histórico de pedidos, consentimento de marketing, compartilhamento de dados           |
| **Banners Promocionais**       | Banners animados na página inicial                                                                            |
| **PWA**                        | Service worker, manifest.json, instalável, suporte offline                                                    |
| **Acessibilidade**             | Widget WCAG 2.1 AA: tamanho da fonte, contraste, guia de leitura, atalhos de teclado                          |
| **Tema (Claro/Escuro)**        | Detecção automática + alternância manual com persistência em localStorage                                     |

---

## 3. Dashboard do Restaurante

| Funcionalidade                   | Descrição                                                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visão Geral**                  | Gráfico de receita, estatísticas de pedidos, ações rápidas                                                                                      |
| **Gerenciamento de Cardápio**    | Drag-and-drop de categorias (dnd-kit), CRUD de produtos, badges (vegano, sem glúten, picante, popular, novo, desconto), opções, disponibilidade |
| **Kanban da Cozinha**            | Colunas: PENDING → CONFIRMED → PREPARING → READY → DELIVERING → DELIVERED; arrastar pedidos entre status; timers; som de novo pedido            |
| **Gestão de Pedidos**            | Lista completa, filtros por status/tipo, modal de detalhes, cancelamento com motivo                                                             |
| **Gestão de Mesas**              | CRUD de mesas, capacidade, status (AVAILABLE/OCCUPIED/RESERVED), QR code por mesa                                                               |
| **Gestão de Equipe**             | Convite por email, papéis (MANAGER, KITCHEN, WAITER, DRIVER), revogar convites, desabilitar membros                                             |
| **Configuração de Entrega**      | Taxa de entrega, pedido mínimo, raio de entrega, tempo estimado, zonas de entrega                                                               |
| **Entregadores**                 | Gerenciar entregadores, atribuição de corridas                                                                                                  |
| **Configurações do Restaurante** | Perfil, endereço, contato, horários de funcionamento (por dia), CNPJ, dados bancários                                                           |
| **Domínio Personalizado**        | Configurar domínio próprio para o restaurante                                                                                                   |
| **Tema White-label**             | Cor primária, fundo, card, texto, fontes, bordas personalizáveis                                                                                |
| **Planos/Assinatura**            | Gerenciamento de plano de assinatura                                                                                                            |
| **Access Pass (POS)**            | Modo garçom/POS para pedidos no salão                                                                                                           |
| **Onboarding**                   | Fluxo multi-etapas: informações básicas, domínio, tema                                                                                          |
| **Cardápio por QR Code**         | QR code por mesa para cardápio digital                                                                                                          |
| **Avaliações**                   | Visualizar e responder avaliações de clientes                                                                                                   |
| **Compartilhar WhatsApp**        | Compartilhar link do restaurante via WhatsApp                                                                                                   |

---

## 4. Aplicativo do Garçom (Waiter)

| Funcionalidade            | Descrição                                               |
| ------------------------- | ------------------------------------------------------- |
| **Lista de Mesas**        | Visualizar mesas com status, criar pedidos por mesa     |
| **Navegação no Cardápio** | Visualizar cardápio completo, adicionar itens ao pedido |
| **Criação de Pedidos**    | Criar pedidos para clientes no salão                    |
| **Gestão de Pedidos**     | Visualizar e gerenciar pedidos da mesa                  |

---

## 5. Aplicativo do Entregador (Driver)

| Funcionalidade           | Descrição                                               |
| ------------------------ | ------------------------------------------------------- |
| **Lista de Entregas**    | Visualizar entregas atribuídas                          |
| **Rastreamento GPS**     | Localização em tempo real                               |
| **Mapa de Entrega**      | Visualização em mapa com rota (Leaflet + React-Leaflet) |
| **Rastreamento ao Vivo** | Cliente acompanha entrega em tempo real                 |

---

## 6. Sistema de Pagamentos (Omnichannel)

| Funcionalidade               | Descrição                                                        |
| ---------------------------- | ---------------------------------------------------------------- |
| **Cartão de Crédito/Débito** | Stripe Payment Intents, CardForm, Stripe Elements                |
| **Pix (QR Code)**            | Geração de QR Code (qrcode.react), formulário Pix, confirmação   |
| **Boleto Bancário**          | Geração e exibição de boleto                                     |
| **Mercado Pago**             | Integração com webhook                                           |
| **PayPal**                   | Processamento de pagamentos                                      |
| **Dinheiro (Troco)**         | Opção de pagamento em dinheiro com valor para troco              |
| **Cupom/Desconto**           | Validação de cupom, cálculo de desconto                          |
| **Webhooks**                 | Handlers para Stripe e Mercado Pago atualizarem status do pedido |
| **Idempotência**             | Redis-based para evitar duplicação de pagamentos                 |

---

## 7. API REST

| Endpoint                         | Finalidade                       |
| -------------------------------- | -------------------------------- |
| `GET /api/health`                | Health check com auth opcional   |
| `GET /api/docs`                  | Documentação OpenAPI             |
| `POST /api/categories`           | CRUD de categorias do cardápio   |
| `POST /api/products`             | CRUD de produtos                 |
| `POST /api/payments/intent`      | Criar payment intent no Stripe   |
| `POST /api/payments/pix`         | Criar pagamento Pix              |
| `POST /api/payments/boleto`      | Criar boleto                     |
| `POST /api/payments/mercadopago` | Processar pagamento Mercado Pago |
| `POST /api/payments/paypal`      | Processar pagamento PayPal       |
| `POST /api/webhooks/stripe`      | Webhook Stripe                   |
| `POST /api/webhooks/mercadopago` | Webhook Mercado Pago             |
| `POST /api/tables`               | CRUD de mesas                    |
| `GET /api/mesa/[tableId]`        | Dados de mesa específica         |
| `POST /api/restaurants`          | CRUD de restaurantes             |
| `POST /api/profile`              | Gerenciamento de perfil          |
| `GET /api/test-redis`            | Teste de conectividade Redis     |
| `GET /api/sentry-example-api`    | Teste do Sentry                  |

---

## 8. Banco de Dados (PostgreSQL — Prisma)

**Tabelas principais:**

| Tabela                   | Finalidade                                                      |
| ------------------------ | --------------------------------------------------------------- |
| `profiles`               | Perfis de usuário com papéis                                    |
| `restaurants`            | Dados do restaurante (endereço, entrega, banco, tema, horários) |
| `restaurant_tables`      | Mesas com QR codes                                              |
| `categories`             | Categorias do cardápio (ordenáveis, com ícones/imagens)         |
| `products`               | Itens do cardápio (preço, badges, opções, info dietética)       |
| `orders`                 | Ciclo de vida completo do pedido com timestamps por status      |
| `restaurant_members`     | Membros da equipe com papéis                                    |
| `restaurant_invitations` | Convites com token de aceitação                                 |
| `audit_logs`             | Trilha de auditoria                                             |
| `user_privacy_settings`  | Configurações LGPD                                              |
| `user_preferences`       | Restrições alimentares, cozinhas favoritas, notificações        |
| `user_favorites`         | Restaurantes favoritos                                          |
| `addresses`              | Endereços salvos                                                |
| `reviews`                | Avaliações e respostas                                          |

**Enums:** `OrderStatus` (7 estados), `OrderType` (3 tipos), `UserRole` (5 níveis), `RestaurantMemberRole` (5 papéis), `RestaurantStatus` (3 estados)

---

## 9. Infraestrutura e DevOps

| Funcionalidade          | Descrição                                                                   |
| ----------------------- | --------------------------------------------------------------------------- |
| **CI/CD**               | GitHub Actions: lint → typecheck → testes → build                           |
| **Qualidade de Código** | ESLint 9, Prettier, Husky pre-commit (lint-staged)                          |
| **Segurança**           | CodeQL, Dependabot, CSP headers, rate limiting                              |
| **Monitoramento**       | Sentry (client, edge, server)                                               |
| **Cache**               | Upstash Redis (cardápio, restaurante, rate limiting, pub/sub, idempotência) |
| **Upload de Imagens**   | Cloudinary                                                                  |
| **Email**               | Nodemailer via SMTP                                                         |
| **Testes Unitários**    | Vitest + Testing Library + MSW                                              |
| **Testes E2E**          | Playwright                                                                  |

---

## 10. Hooks Customizados

| Hook                    | Finalidade                             |
| ----------------------- | -------------------------------------- |
| `useAuth`               | Estado de autenticação                 |
| `useCart`               | Estado do carrinho                     |
| `useDebounce`           | Debounce para busca/filtros            |
| `useFavorites`          | Favoritar/desfavoritar restaurantes    |
| `useFilters`            | Estado de filtros de busca             |
| `useGeolocation`        | Geolocalização do navegador            |
| `useKitchenOrders`      | Polling de pedidos da cozinha          |
| `useLocalStorage`       | Persistência em localStorage           |
| `useNewOrderDetector`   | Detectar novos pedidos via polling     |
| `useOrderNotifications` | Notificações de atualização de pedidos |
| `useOrders`             | Busca de pedidos do cliente            |
| `useOrderSound`         | Som de novo pedido                     |
| `useTabTitle`           | Título dinâmico da aba                 |
| `useViaCep`             | Auto-preenchimento de CEP              |

---

## 11. Contextos React

| Contexto               | Finalidade                      |
| ---------------------- | ------------------------------- |
| `AuthContext`          | Estado global de autenticação   |
| `CartContext`          | Estado global do carrinho       |
| `ThemeContext`         | Tema claro/escuro               |
| `AccessibilityContext` | Configurações de acessibilidade |
| `KitchenTimerContext`  | Timer de polling da cozinha     |

---

## 12. Segurança

- Headers HTTP rigorosos (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) no `next.config.ts`
- Rate limiting com Redis em endpoints de autenticação e pagamento
- Middleware de proteção de rotas com verificação de papel (role)
- Idempotência em pagamentos via Redis
- Auditoria completa (`audit_logs`) para operações do restaurante
- Configurações de privacidade LGPD por usuário
- Sentry para monitoramento de erros
- CodeQL e Dependabot ativos no GitHub

---

## Resumo Quantitativo

| Categoria            | Quantidade                            |
| -------------------- | ------------------------------------- |
| Páginas/Rotas        | 40+                                   |
| Server Actions       | 20+                                   |
| Componentes          | 15 diretórios de componentes          |
| Hooks customizados   | 14                                    |
| Contextos React      | 5                                     |
| Tabelas no banco     | 15                                    |
| Métodos de pagamento | 6                                     |
| Papéis (RBAC)        | 5 de sistema + 5 por restaurante      |
| Testes               | Vitest (unitários) + Playwright (E2E) |
