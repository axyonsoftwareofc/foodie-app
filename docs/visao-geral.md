# Foodie App — Visão Geral Executiva do Projeto

**Documento para apresentação a parceiros, investidores, clientes potenciais e demais pessoas interessadas no projeto.**

**Atualizado em:** Junho de 2026  
**Projeto:** Privado  
**Repositório:** github.com/axyonsoftwareofc/foodie-app

---

## 1. Resumo executivo

O **Foodie App** é uma plataforma digital para delivery e gestão de restaurantes, pensada especialmente para o mercado brasileiro. A solução conecta clientes, restaurantes, cozinha, garçons e entregadores em um único ambiente, reduzindo a dependência de ferramentas separadas para cardápio digital, pedidos, pagamentos, salão e entregas.

Na prática, o projeto busca oferecer ao restaurante uma presença digital própria, com cardápio online, checkout, acompanhamento de pedidos, operação de cozinha, atendimento presencial por mesa e gestão de entregadores. Para o cliente final, a experiência é semelhante à de um aplicativo de delivery moderno: escolher o restaurante, montar o pedido, pagar e acompanhar o andamento.

O diferencial central está em combinar **delivery, atendimento presencial e operação interna do restaurante** em uma plataforma única, com recursos alinhados à realidade brasileira, como Pix, boleto, Mercado Pago, português do Brasil e cuidados de privacidade baseados na LGPD.

---

## 2. Problema que o projeto resolve

Restaurantes pequenos e médios costumam depender de várias soluções isoladas: redes sociais para divulgação, aplicativos de terceiros para delivery, planilhas para controle interno, grupos de mensagem para a cozinha e sistemas separados para pagamentos. Isso gera custo, perda de controle sobre a experiência do cliente e dificuldade para acompanhar dados de vendas e operação.

O Foodie App foi desenhado para resolver esse cenário com uma plataforma centralizada. O restaurante pode operar seu canal digital próprio, acompanhar pedidos em tempo real, organizar a cozinha, registrar pedidos do salão e controlar entregas sem precisar alternar entre múltiplas ferramentas.

---

## 3. Públicos atendidos

| Público                         | Como usa o Foodie App                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Cliente final**               | Escolhe restaurantes, monta o carrinho, usa cupons, paga online e acompanha o pedido.            |
| **Dono do restaurante**         | Configura o restaurante, gerencia cardápio, horários, entregas, equipe e informações comerciais. |
| **Equipe de cozinha**           | Recebe pedidos em um painel visual e atualiza o preparo até a entrega.                           |
| **Garçom**                      | Atende mesas no salão, registra pedidos pelo celular e envia tudo diretamente para a cozinha.    |
| **Entregador**                  | Visualiza entregas atribuídas, atualiza status e ajuda o cliente a acompanhar o pedido.          |
| **Administrador da plataforma** | Acompanha a operação geral, restaurantes cadastrados, segurança e evolução do produto.           |

---

## 4. Como a solução funciona, em linguagem simples

O cliente acessa o cardápio do restaurante pelo navegador ou pelo aplicativo instalável no celular. Ele seleciona os itens, aplica cupom quando disponível, escolhe a forma de pagamento e finaliza o pedido.

Depois disso, o pedido aparece para o restaurante. A cozinha visualiza a demanda em um painel de etapas, parecido com um quadro de produção: novos pedidos, pedidos em preparo, pedidos prontos e pedidos entregues. Se o pedido for de salão, o garçom também pode registrar tudo diretamente pelo modo de atendimento de mesas.

Na etapa de entrega, o restaurante pode organizar entregadores, zonas de entrega e status do pedido. O cliente acompanha a evolução sem precisar ligar ou mandar mensagem para saber se o pedido já saiu.

---

## 5. Funcionalidades principais

### Experiência do cliente

- Cardápio digital com categorias, fotos, preços e descrição dos produtos.
- Carrinho de compras com cálculo de total, itens, observações e cupons.
- Pagamento por Pix, cartão, PayPal, Mercado Pago, boleto e dinheiro.
- Histórico de pedidos, restaurantes favoritos e endereços salvos.
- Acompanhamento do pedido em tempo real.
- Aplicativo instalável no celular por tecnologia PWA, sem exigir download em loja.

### Operação do restaurante

- Cadastro e configuração do restaurante.
- Cardápio com produtos, categorias, preços, disponibilidade e imagens.
- Painel administrativo para acompanhar operação, pedidos e indicadores.
- Kanban da cozinha para organizar pedidos por etapa.
- Notificações sonoras para novos pedidos.
- Gestão de mesas para atendimento presencial.
- Gestão de entregadores e zonas de entrega.
- Relatórios básicos de vendas e operação.

### Gestão e plataforma

- Separação por restaurante, permitindo que cada operação tenha seus próprios dados, equipe e cardápio.
- Suporte a domínio ou endereço exclusivo por restaurante.
- Controle de acesso por perfil, separando permissões de administrador, gerente, equipe e cliente.
- Integração com serviços externos de pagamento, imagens, cache e monitoramento.

---

## 6. Etapas do projeto

### Etapa 1 — Fundamentos do produto

Foram definidos o público-alvo, as jornadas principais e a arquitetura geral da plataforma. O foco inicial foi construir uma base capaz de atender múltiplos restaurantes sem misturar dados, permissões ou operação.

### Etapa 2 — Experiência de compra

A experiência do cliente foi estruturada com busca de restaurantes, cardápio digital, carrinho, checkout, cupons, favoritos, endereços e acompanhamento de pedido. Essa etapa tornou o produto utilizável do ponto de vista do consumidor final.

### Etapa 3 — Painel do restaurante

Foram criados recursos para que o restaurante gerencie seu cardápio, configure dados da operação, organize pedidos e acompanhe informações básicas de desempenho. Essa parte transforma o sistema em uma ferramenta de gestão, não apenas em uma vitrine.

### Etapa 4 — Cozinha e operação em tempo real

O projeto incorporou o Kanban da cozinha, notificações de novos pedidos e atualização de status. Essa etapa é importante porque aproxima o sistema do dia a dia operacional do restaurante, onde velocidade e clareza são essenciais.

### Etapa 5 — Atendimento presencial

O modo garçom permite que mesas sejam atendidas pelo próprio sistema. Com isso, o restaurante pode usar a mesma plataforma tanto para delivery quanto para pedidos feitos no salão.

### Etapa 6 — Entregas

Foram adicionados recursos para cadastro de entregadores, atribuição de pedidos, zonas de entrega, atualização de status e acompanhamento. A intenção é dar ao restaurante mais controle sobre a logística própria.

### Etapa 7 — Segurança, qualidade e preparação para evolução

O projeto recebeu camadas de autenticação, autorização por perfil, proteção contra abuso, testes automatizados, documentação e integração com monitoramento. Essa etapa prepara a solução para evoluir com mais previsibilidade e menos risco.

---

## 7. Tecnologia usada, sem excesso técnico

O Foodie App foi construído com tecnologias modernas e amplamente usadas no mercado, escolhidas para acelerar desenvolvimento, facilitar manutenção e permitir crescimento gradual.

| Área                                           | Papel no projeto                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| **Next.js, React e TypeScript**                | Base da aplicação web, incluindo telas, rotas e lógica do produto. |
| **PostgreSQL e Supabase**                      | Armazenamento de dados e autenticação de usuários.                 |
| **Prisma**                                     | Organização segura do acesso ao banco de dados.                    |
| **Stripe, Mercado Pago, PayPal, Pix e boleto** | Opções de pagamento para diferentes perfis de cliente.             |
| **Redis / Upstash**                            | Cache, proteção contra abuso e suporte a recursos em tempo real.   |
| **Cloudinary**                                 | Armazenamento e entrega de imagens do cardápio e restaurantes.     |
| **Vercel**                                     | Hospedagem da aplicação.                                           |
| **Sentry**                                     | Monitoramento de erros e estabilidade.                             |
| **Vitest e Playwright**                        | Testes automatizados para reduzir regressões.                      |

---

## 8. Segurança e privacidade

O projeto considera segurança desde a base da operação. Há login por email e senha, suporte a autenticação com Google, controle de acesso por perfil e proteção contra chamadas excessivas em rotas sensíveis.

As informações de pagamento são processadas por gateways especializados. Isso significa que a plataforma não precisa armazenar números de cartão, reduzindo risco e complexidade. Além disso, a arquitetura considera princípios da LGPD, como controle de dados pessoais, privacidade do usuário e possibilidade de evolução para rotinas formais de solicitação, exportação e exclusão de dados.

---

## 9. Organização do produto

O produto está dividido em áreas funcionais claras:

- **Cliente:** navegação, cardápio, carrinho, checkout, pedidos, favoritos e perfil.
- **Restaurante:** configuração, cardápio, pedidos, equipe, mesas e entregadores.
- **Cozinha:** visão operacional dos pedidos em etapas.
- **Garçom:** atendimento de mesas no salão.
- **Entregador:** acompanhamento das entregas atribuídas.
- **API e integrações:** pagamentos, webhooks, saúde do sistema e documentação técnica.

Essa organização ajuda o projeto a crescer por módulos, permitindo priorizar novas funcionalidades sem comprometer a experiência já construída.

---

## 10. Indicadores atuais do projeto

| Métrica                             | Situação atual |
| ----------------------------------- | -------------- |
| **Arquivos TypeScript/React**       | 276 arquivos   |
| **Testes automatizados declarados** | 286 testes     |
| **Cobertura de linhas**             | 62,6%          |
| **Rotas de API**                    | 14 rotas       |
| **Server Actions exportadas**       | 93 funções     |
| **Dependências de produção**        | 25 pacotes     |
| **Dependências de desenvolvimento** | 24 pacotes     |

Esses números indicam que o projeto já passou da fase de protótipo simples. Ele possui estrutura de produto, testes, integrações e uma base funcional ampla para continuar evoluindo.

---

## 11. Diferenciais do Foodie App

1. **Foco no mercado brasileiro:** inclui Pix, boleto, Mercado Pago, português do Brasil e preocupação com LGPD.
2. **Canal próprio para restaurantes:** o restaurante reduz dependência de marketplaces e fortalece sua marca.
3. **Delivery e salão na mesma solução:** o sistema atende pedidos online e presenciais.
4. **Operação visual de cozinha:** o Kanban facilita acompanhar preparo e reduzir confusão operacional.
5. **Estrutura multi-restaurante:** cada restaurante pode operar com dados, cardápio, equipe e endereço próprios.
6. **Base preparada para integrações:** pagamentos, imagens, cache, monitoramento e APIs externas já fazem parte da visão do produto.
7. **Qualidade e segurança como parte do projeto:** testes, autenticação, permissões e monitoramento não são tratados como itens opcionais.

---

## 12. Próximos passos possíveis

- Publicar um app mobile nativo para Android e iOS, além da experiência PWA atual.
- Integrar com marketplaces como iFood e Rappi, quando houver estratégia comercial para isso.
- Criar programa de fidelidade para clientes recorrentes.
- Evoluir o painel de indicadores para BI comercial e operacional.
- Adicionar impressão de comandas para cozinhas que ainda operam com papel.
- Ampliar automações de marketing, como campanhas para clientes inativos.
- Formalizar políticas e fluxos completos de privacidade, suporte e operação.

---

## 13. Conclusão

O Foodie App é uma iniciativa com potencial para se posicionar como uma plataforma completa de operação digital para restaurantes brasileiros. Ele não se limita ao delivery: também cobre gestão de cardápio, atendimento presencial, cozinha, entregas, pagamentos e segurança.

Para pessoas de negócios, o ponto principal é que o projeto já possui uma base robusta para demonstrar valor, validar uso com restaurantes reais e evoluir para uma oferta comercial mais ampla. A próxima fase deve priorizar validação de mercado, refinamento da experiência operacional e definição clara do modelo de monetização.
