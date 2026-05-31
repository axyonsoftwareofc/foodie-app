// src/lib/openapi.ts
// Documentacao OpenAPI 3.1 gerada manualmente.
// TODO: migrar para zod-openapi registry com os schemas Zod existentes.
import { createDocument } from 'zod-openapi';

const title = 'Foodie App';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const openApiSpec = createDocument({
  openapi: '3.1.0',
  info: {
    title: `${title} — API`,
    version: '0.1.0',
    description:
      'API REST do Foodie App. Autenticacao via Supabase (cookies HTTP-only). Rotas protegidas exigem sessao ativa.',
  },
  servers: [{ url: appUrl, description: 'Servidor atual' }],
  paths: {
    '/api/restaurants': {
      get: {
        summary: 'Listar restaurantes ativos',
        tags: ['Restaurantes'],
        parameters: [
          {
            name: 'id',
            in: 'query',
            schema: { type: 'string' },
            description: 'Buscar por ID especifico',
          },
        ],
        responses: {
          '200': { description: 'Lista de restaurantes ou unico' },
        },
      },
      post: {
        summary: 'Criar restaurante',
        tags: ['Restaurantes'],
        security: [{ cookieAuth: [] }],
        responses: {
          '201': { description: 'Restaurante criado' },
          '401': { description: 'Nao autenticado' },
        },
      },
      put: {
        summary: 'Atualizar restaurante',
        tags: ['Restaurantes'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Restaurante atualizado' },
          '403': { description: 'Nao autorizado (nao e dono)' },
        },
      },
      delete: {
        summary: 'Soft-delete restaurante',
        tags: ['Restaurantes'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Restaurante desativado' },
        },
      },
    },
    '/api/products': {
      get: {
        summary: 'Listar produtos de um restaurante',
        tags: ['Produtos'],
        parameters: [
          { name: 'restaurantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'categoryId', in: 'query', schema: { type: 'string' } },
          { name: 'id', in: 'query', schema: { type: 'string' } },
          { name: 'available', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Lista de produtos' } },
      },
      post: {
        summary: 'Criar produto',
        tags: ['Produtos'],
        security: [{ cookieAuth: [] }],
        responses: {
          '201': { description: 'Produto criado' },
          '403': { description: 'Nao autorizado' },
        },
      },
      put: {
        summary: 'Atualizar produto',
        tags: ['Produtos'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Produto atualizado' } },
      },
      delete: {
        summary: 'Soft-delete produto',
        tags: ['Produtos'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Produto desativado' } },
      },
    },
    '/api/categories': {
      get: {
        summary: 'Listar categorias de um restaurante',
        tags: ['Categorias'],
        parameters: [
          { name: 'restaurantId', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Lista de categorias' } },
      },
      post: {
        summary: 'Criar categoria',
        tags: ['Categorias'],
        security: [{ cookieAuth: [] }],
        responses: { '201': { description: 'Categoria criada' } },
      },
      put: {
        summary: 'Atualizar categoria',
        tags: ['Categorias'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Categoria atualizada' } },
      },
      delete: {
        summary: 'Soft-delete categoria',
        tags: ['Categorias'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Categoria desativada' } },
      },
    },
    '/api/profile': {
      get: {
        summary: 'Obter perfil do usuario autenticado',
        tags: ['Perfil'],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: 'Dados do perfil' },
          '401': { description: 'Nao autenticado' },
        },
      },
      put: {
        summary: 'Atualizar perfil',
        tags: ['Perfil'],
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Perfil atualizado' } },
      },
    },
    '/api/payments/intent': {
      post: {
        summary: 'Criar PaymentIntent do Stripe',
        tags: ['Pagamentos'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { orderId: { type: 'string' }, email: { type: 'string' } },
                required: ['orderId'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'clientSecret do Stripe' },
          '503': { description: 'Stripe nao habilitado' },
        },
      },
    },
    '/api/payments/pix': {
      post: {
        summary: 'Gerar QR Code PIX',
        tags: ['Pagamentos'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { orderId: { type: 'string' } },
                required: ['orderId'],
              },
            },
          },
        },
        responses: { '200': { description: 'QR Code PIX e chave' } },
      },
    },
    '/api/payments/paypal': {
      post: {
        summary: 'Criar pedido PayPal',
        tags: ['Pagamentos'],
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Link de aprovacao PayPal' } },
      },
      put: {
        summary: 'Capturar pagamento PayPal',
        tags: ['Pagamentos'],
        security: [{ cookieAuth: [] }],
        responses: { '200': { description: 'Pagamento capturado' } },
      },
    },
    '/api/webhooks/stripe': {
      post: {
        summary: 'Webhook do Stripe',
        tags: ['Webhooks'],
        description: 'Recebe eventos do Stripe. Validacao por assinatura HMAC.',
        responses: { '200': { description: 'Evento processado' } },
      },
    },
    '/api/webhooks/mercadopago': {
      post: {
        summary: 'Webhook do Mercado Pago',
        tags: ['Webhooks'],
        description: 'Recebe notificacoes do Mercado Pago. Validacao por query secret + API.',
        responses: {
          '200': { description: 'Notificacao processada' },
          '401': { description: 'Secret invalido' },
        },
      },
    },
    '/api/health': {
      get: {
        summary: 'Health check do sistema',
        tags: ['Sistema'],
        responses: { '200': { description: 'Sistema saudavel' } },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'sb-access-token',
        description: 'Cookie de sessao do Supabase (gerenciado automaticamente pelo navegador)',
      },
    },
    schemas: {
      SignInRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
        required: ['email', 'password'],
      },
      SignUpRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          confirmPassword: { type: 'string' },
        },
        required: ['fullName', 'email', 'password', 'confirmPassword'],
      },
      UpdateProfileRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string', minLength: 2 },
          phone: { type: 'string' },
          avatarUrl: { type: 'string', format: 'uri' },
        },
      },
    },
  },
  tags: [
    { name: 'Restaurantes', description: 'CRUD de restaurantes (proprietario)' },
    { name: 'Produtos', description: 'CRUD de produtos do cardapio' },
    { name: 'Categorias', description: 'CRUD de categorias do cardapio' },
    { name: 'Perfil', description: 'Perfil do usuario autenticado' },
    { name: 'Pagamentos', description: 'Stripe, PIX, PayPal' },
    { name: 'Webhooks', description: 'Callbacks de gateways de pagamento' },
    { name: 'Sistema', description: 'Health check e utilitarios' },
  ],
});

export type { title, appUrl };
