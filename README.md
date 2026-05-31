# Foodie App

Plataforma de delivery de comida full-stack para o mercado brasileiro.

## Funcionalidades

### Para Clientes

- Descoberta de restaurantes com busca e filtros (categoria, avaliação, frete)
- Cardápio com categorias e produtos
- Carrinho de compras com cupons de desconto
- Checkout com múltiplos meios de pagamento
- Acompanhamento de pedidos em tempo real
- Favoritos, endereços salvos e perfil do usuário

### Para Donos de Restaurante

- Painel administrativo (dashboard)
- Gestão de cardápio (categorias e produtos)
- Gestão de pedidos com Kanban da cozinha
- Configurações de entrega e horários de funcionamento
- Notificações sonoras de novos pedidos

### Pagamentos

- Cartão de crédito/débito (Stripe)
- Pix com QR Code
- Mercado Pago
- PayPal
- Boleto bancário
- Dinheiro (troco)

## Stack

- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS 4
- **Banco de dados:** PostgreSQL + Prisma ORM
- **Autenticação:** Supabase Auth
- **Pagamentos:** Stripe, Mercado Pago, PayPal
- **Ícones:** Lucide React
- **Animações:** Framer Motion
- **Notificações:** Sonner
- **PWA:** Service Worker + Manifest

## Começando

### Pré-requisitos

- Node.js 18+
- PostgreSQL
- Conta no [Supabase](https://supabase.com) (auth + banco)
- Opcional: contas no Stripe, Mercado Pago, PayPal

### Instalação

```bash
# Clonar
git clone https://github.com/axyonsoftwareofc/foodie-app.git
cd foodie-app

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# Rodar migrations
npx prisma migrate dev

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Variáveis de ambiente

| Variável                             | Descrição                            |
| ------------------------------------ | ------------------------------------ |
| `DATABASE_URL`                       | URL de conexão PostgreSQL (Supabase) |
| `NEXT_PUBLIC_SUPABASE_URL`           | URL do projeto Supabase              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Chave anônima do Supabase            |
| `STRIPE_SECRET_KEY`                  | Chave secreta do Stripe              |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Chave pública do Stripe              |
| `NEXT_PUBLIC_APP_URL`                | URL base da aplicação                |

Veja `.env.example` para a lista completa.

## Comandos

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run lint       # Verificar lint
npx vitest run     # Rodar testes
npx prisma studio  # Interface visual do banco
```

## Estrutura

```
src/
├── app/            # Páginas (App Router)
│   ├── (auth)/     # Login, cadastro
│   ├── dashboard/  # Painel do restaurante
│   ├── checkout/   # Checkout
│   ├── orders/     # Pedidos
│   └── api/        # Rotas de API
├── actions/        # Server Actions
├── components/     # Componentes React
├── hooks/          # Custom hooks
├── contexts/       # Contextos (Auth, Cart, Theme)
├── lib/            # Utilitários, validações, Prisma
├── types/          # Tipos TypeScript
└── tests/          # Testes (Vitest + Playwright)
```

## Licença

Projeto privado.
