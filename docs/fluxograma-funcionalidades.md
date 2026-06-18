# Fluxograma de Funcionalidades — CRUDs Identificados

```mermaid
flowchart TB
    %% ===== ESTILOS =====
    classDef modulo fill:#1a237e,stroke:#fff,color:#fff,font-weight:bold
    classDef crud fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    classDef create fill:#e3f2fd,stroke:#1565c0,color:#0d47a1
    classDef read fill:#f3e5f5,stroke:#6a1b9a,color:#4a148c
    classDef update fill:#fff3e0,stroke:#e65100,color:#bf360c
    classDef delete fill:#ffebee,stroke:#c62828,color:#b71c1c
    classDef process fill:#f5f5f5,stroke:#616161,color:#212121
    classDef actor fill:#e1f5fe,stroke:#0288d1,color:#01579b,font-weight:bold
    classDef external fill:#fce4ec,stroke:#c62828,color:#b71c1c,font-style:italic

    %% ===== ATORES =====
    A1([Cliente]):::actor
    A2([Restaurante]):::actor
    A3([Garçom]):::actor
    A4([Entregador]):::actor
    A5([Super Admin]):::actor

    %% ================================================
    %% MÓDULO: AUTENTICAÇÃO
    %% ================================================
    subgraph Modulo_Auth["🔐 Autenticação"]
        M_AUTH{{AUTH}}:::modulo
        A_SIGNUP[Registrar]:::create
        A_SIGNIN[Login]:::process
        A_LOGOUT[Logout]:::process
        A_PASS[Recuperar Senha]:::process
        A_OAUTH[Google OAuth]:::external
        A_RATE[Rate Limit<br/>Redis 5/60s]:::process

        M_AUTH --> A_SIGNUP
        M_AUTH --> A_SIGNIN
        M_AUTH --> A_LOGOUT
        M_AUTH --> A_PASS
        M_AUTH --> A_OAUTH
        M_AUTH --> A_RATE
    end

    %% ================================================
    %% MÓDULO: USUÁRIO / PERFIL
    %% ================================================
    subgraph Modulo_Profile["👤 Perfil do Usuário"]
        M_PROF{{PERFIL}}:::modulo
        P_CRUD[CRUD Perfil<br/>nome / foto / telefone]:::crud
        P_PREF[CRUD Preferências<br/>dietas / cozinhas / notif.]:::crud
        P_PRIV[CRUD Privacidade (LGPD)<br/>visibilidade / marketing / 2FA]:::crud
        P_DEL[DELETE Conta<br/>anonimização LGPD]:::delete

        M_PROF --> P_CRUD
        M_PROF --> P_PREF
        M_PROF --> P_PRIV
        M_PROF --> P_DEL
    end

    %% ================================================
    %% MÓDULO: RESTAURANTE
    %% ================================================
    subgraph Modulo_Restaurant["🏪 Restaurante"]
        M_REST{{RESTAURANTE}}:::modulo
        R_CREATE[CREATE<br/>Registrar restaurante<br/>onboarding multi-etapa]:::create
        R_READ[READ<br/>Ver perfil público<br/>cardápio / horários]:::read
        R_UPDATE[UPDATE<br/>Editar perfil / endereço<br/>horários / CNPJ / banco]:::update
        R_DELETE[DELETE<br/>Desativar restaurante<br/>soft-delete]:::delete
        R_THEME[UPDATE Tema<br/>white-label: cores / fontes]:::update
        R_DOMAIN[UPDATE Domínio<br/>subdomínio personalizado]:::update
        R_PLANS[Plano / Assinatura<br/>billing]:::process

        M_REST --> R_CREATE
        M_REST --> R_READ
        M_REST --> R_UPDATE
        M_REST --> R_DELETE
        M_REST --> R_THEME
        M_REST --> R_DOMAIN
        M_REST --> R_PLANS
    end

    %% ================================================
    %% MÓDULO: CARDÁPIO (MENU)
    %% ================================================
    subgraph Modulo_Menu["📋 Cardápio"]
        M_MENU{{CARDÁPIO}}:::modulo
        MC_CAT{{CATEGORIAS}}:::modulo
        MC_PROD{{PRODUTOS}}:::modulo

        MC_CAT --> CAT_C[CREATE<br/>Nova categoria<br/>nome / ícone / imagem]:::create
        MC_CAT --> CAT_R[READ<br/>Listar categorias<br/>ordenado por sort_order]:::read
        MC_CAT --> CAT_U[UPDATE<br/>Editar / reordenar<br/>drag-and-drop dnd-kit]:::update
        MC_CAT --> CAT_D[DELETE<br/>Remover categoria<br/>e produtos associados]:::delete

        MC_PROD --> PROD_C[CREATE<br/>Novo produto<br/>preço / badges / opções]:::create
        MC_PROD --> PROD_R[READ<br/>Listar produtos<br/>por categoria]:::read
        MC_PROD --> PROD_U[UPDATE<br/>Editar / disponibilidade<br/>badges: vegano, spicy...]:::update
        MC_PROD --> PROD_D[DELETE<br/>Remover produto]:::delete
        MC_PROD --> PROD_IMG[Upload Imagem<br/>Cloudinary]:::external
    end

    %% ================================================
    %% MÓDULO: MESAS
    %% ================================================
    subgraph Modulo_Tables["🪑 Mesas"]
        M_TBL{{MESAS}}:::modulo
        T_C[CREATE<br/>Nova mesa<br/>número / capacidade]:::create
        T_R[READ<br/>Listar mesas<br/>status: AVAILABLE/OCCUPIED]:::read
        T_U[UPDATE<br/>Alterar status / editar<br/>gerar QR code]:::update
        T_D[DELETE<br/>Remover mesa]:::delete
        T_QR[QR Code<br/>cardápio digital<br/>por mesa]:::process

        M_TBL --> T_C
        M_TBL --> T_R
        M_TBL --> T_U
        M_TBL --> T_D
        M_TBL --> T_QR
    end

    %% ================================================
    %% MÓDULO: PEDIDOS
    %% ================================================
    subgraph Modulo_Order["📦 Pedidos"]
        M_ORD{{PEDIDOS}}:::modulo
        O_C[CREATE<br/>Novo pedido<br/>DINE_IN / DELIVERY / PICKUP]:::create
        O_R[READ<br/>Listar / detalhar<br/>histórico do cliente]:::read
        O_U_STATUS[UPDATE Status<br/>PENDING → CONFIRMED<br/>→ PREPARING → READY<br/>→ DELIVERING → DELIVERED]:::update
        O_U_KITCHEN[UPDATE Cozinha<br/>Kanban drag-and-drop<br/>timers por etapa]:::update
        O_CANCEL[UPDATE Cancelar<br/>com motivo + timestamp]:::update
        O_COUPON[Validar Cupom<br/>desconto]:::process

        M_ORD --> O_C
        M_ORD --> O_R
        M_ORD --> O_U_STATUS
        M_ORD --> O_U_KITCHEN
        M_ORD --> O_CANCEL
        M_ORD --> O_COUPON
    end

    %% ================================================
    %% MÓDULO: PAGAMENTOS
    %% ================================================
    subgraph Modulo_Payment["💳 Pagamentos"]
        M_PAY{{PAGAMENTOS}}:::modulo
        PAY_STRIPE[Processar Stripe<br/>Payment Intents API]:::external
        PAY_MP[Processar Mercado Pago<br/>Pix / Boleto / Cartão]:::external
        PAY_PP[Processar PayPal]:::external
        PAY_PIX[Gerar Pix Manual<br/>QR Code estático]:::process
        PAY_CASH[Dinheiro - Troco<br/>calcular troco]:::process
        PAY_WEBHOOK[Webhooks<br/>Stripe + MP<br/>atualizam status]:::external
        PAY_IDEM[Idempotência<br/>Redis: evitar duplicata]:::process

        M_PAY --> PAY_STRIPE
        M_PAY --> PAY_MP
        M_PAY --> PAY_PP
        M_PAY --> PAY_PIX
        M_PAY --> PAY_CASH
        M_PAY --> PAY_WEBHOOK
        M_PAY --> PAY_IDEM
    end

    %% ================================================
    %% MÓDULO: ENDEREÇOS
    %% ================================================
    subgraph Modulo_Address["📍 Endereços"]
        M_ADDR{{ENDEREÇOS}}:::modulo
        ADDR_C[CREATE<br/>Novo endereço<br/>ViaCEP auto-preenche]:::create
        ADDR_R[READ<br/>Listar endereços<br/>definir padrão]:::read
        ADDR_U[UPDATE<br/>Editar endereço]:::update
        ADDR_D[DELETE<br/>Remover endereço]:::delete

        M_ADDR --> ADDR_C
        M_ADDR --> ADDR_R
        M_ADDR --> ADDR_U
        M_ADDR --> ADDR_D
    end

    %% ================================================
    %% MÓDULO: FAVORITOS
    %% ================================================
    subgraph Modulo_Fav["❤️ Favoritos"]
        M_FAV{{FAVORITOS}}:::modulo
        FAV_C[CREATE<br/>Adicionar aos favoritos]:::create
        FAV_R[READ<br/>Listar favoritos]:::read
        FAV_D[DELETE<br/>Remover dos favoritos]:::delete

        M_FAV --> FAV_C
        M_FAV --> FAV_R
        M_FAV --> FAV_D
    end

    %% ================================================
    %% MÓDULO: AVALIAÇÕES
    %% ================================================
    subgraph Modulo_Review["⭐ Avaliações"]
        M_REV{{AVALIAÇÕES}}:::modulo
        REV_C[CREATE<br/>Avaliar pedido<br/>nota 1-5 + comentário]:::create
        REV_R[READ<br/>Listar avaliações<br/>do restaurante]:::read
        REV_U[UPDATE<br/>Restaurante responde<br/>avaliação]:::update
        REV_D[DELETE<br/>Remover avaliação]:::delete

        M_REV --> REV_C
        M_REV --> REV_R
        M_REV --> REV_U
        M_REV --> REV_D
    end

    %% ================================================
    %% MÓDULO: EQUIPE (TEAM)
    %% ================================================
    subgraph Modulo_Team["👥 Equipe do Restaurante"]
        M_TEAM{{EQUIPE}}:::modulo
        TEAM_C[CREATE<br/>Convidar membro<br/>por email + papel]:::create
        TEAM_R[READ<br/>Listar membros<br/>papéis: OWNER/MANAGER/...]:::read
        TEAM_U[UPDATE<br/>Alterar papel / status<br/>ativar / desativar]:::update
        TEAM_D[DELETE<br/>Remover membro<br/>revogar convite]:::delete
        TEAM_AUDIT[Auditoria<br/>audit_logs<br/>todas as ações]:::read

        M_TEAM --> TEAM_C
        M_TEAM --> TEAM_R
        M_TEAM --> TEAM_U
        M_TEAM --> TEAM_D
        M_TEAM --> TEAM_AUDIT
    end

    %% ================================================
    %% MÓDULO: DELIVERY
    %% ================================================
    subgraph Modulo_Delivery["🚚 Delivery"]
        M_DEL{{DELIVERY}}:::modulo
        DEL_CFG[CRUD Config<br/>taxa / raio / tempo<br/>zonas de entrega]:::crud
        DEL_DRIVER[READ Entregadores<br/>atribuir corridas]:::read
        DEL_GPS[UPDATE GPS<br/>rastreamento em tempo real<br/>Leaflet + React-Leaflet]:::update
        DEL_TRACK[READ Cliente<br/>acompanha entrega<br/>ao vivo]:::read

        M_DEL --> DEL_CFG
        M_DEL --> DEL_DRIVER
        M_DEL --> DEL_GPS
        M_DEL --> DEL_TRACK
    end

    %% ================================================
    %% MÓDULO: CARRINHO
    %% ================================================
    subgraph Modulo_Cart["🛒 Carrinho"]
        M_CART{{CARRINHO}}:::modulo
        CART_ADD[Adicionar item<br/>com opções]:::create
        CART_REM[Remover item]:::delete
        CART_QTY[Alterar quantidade]:::update
        CART_COUPON[Aplicar cupom<br/>desconto]:::process
        CART_PERSIST[Persistência<br/>localStorage]:::process

        M_CART --> CART_ADD
        M_CART --> CART_REM
        M_CART --> CART_QTY
        M_CART --> CART_COUPON
        M_CART --> CART_PERSIST
    end

    %% ================================================
    %% MÓDULO: SUPER ADMIN
    %% ================================================
    subgraph Modulo_Admin["🔧 Super Admin"]
        M_ADMIN{{SUPER ADMIN}}:::modulo
        SA_REST[CRUD Restaurantes<br/>gerenciar todos]:::crud
        SA_USER[CRUD Usuários<br/>gerenciar todos]:::crud
        SA_AUDIT[READ Auditoria<br/>logs do sistema]:::read

        M_ADMIN --> SA_REST
        M_ADMIN --> SA_USER
        M_ADMIN --> SA_AUDIT
    end

    %% ================================================
    %% CONEXÕES ENTRE ATORES E MÓDULOS
    %% ================================================
    A1 --> Modulo_Auth
    A1 --> Modulo_Profile
    A1 --> Modulo_Menu
    A1 --> Modulo_Cart
    A1 --> Modulo_Order
    A1 --> Modulo_Payment
    A1 --> Modulo_Address
    A1 --> Modulo_Fav
    A1 --> Modulo_Review

    A2 --> Modulo_Auth
    A2 --> Modulo_Restaurant
    A2 --> Modulo_Menu
    A2 --> Modulo_Tables
    A2 --> Modulo_Order
    A2 --> Modulo_Team
    A2 --> Modulo_Delivery
    A2 --> Modulo_Review

    A3 --> Modulo_Auth
    A3 --> Modulo_Tables
    A3 --> Modulo_Menu
    A3 --> Modulo_Order

    A4 --> Modulo_Auth
    A4 --> Modulo_Delivery

    A5 --> Modulo_Auth
    A5 --> Modulo_Admin
```

---

## Legenda

| Cor                                                                     | Significado                                   |
| ----------------------------------------------------------------------- | --------------------------------------------- |
| <span style="color:#2e7d32">■ Verde</span>                              | **CRUD** — todas as 4 operações presentes     |
| <span style="color:#1565c0">■ Azul</span>                               | **CREATE** — criação de registros             |
| <span style="color:#6a1b9a">■ Roxo</span>                               | **READ** — leitura / listagem / consulta      |
| <span style="color:#e65100">■ Laranja</span>                            | **UPDATE** — edição / alteração de status     |
| <span style="color:#c62828">■ Vermelho</span>                           | **DELETE** — remoção / desativação            |
| <span style="color:#616161">■ Cinza</span>                              | **Processo** — operação que não é CRUD        |
| <span style="color:#c62828;font-style:italic">■ Vermelho itálico</span> | **Externo** — integração com serviço terceiro |

## Resumo de CRUDs por Módulo

| Módulo          | CREATE | READ | UPDATE | DELETE |   CRUD Completo   |
| --------------- | :----: | :--: | :----: | :----: | :---------------: |
| Perfil          |   ✅   |  ✅  |   ✅   |   ✅   |      **Sim**      |
| Restaurante     |   ✅   |  ✅  |   ✅   |   ✅   |      **Sim**      |
| Categorias      |   ✅   |  ✅  |   ✅   |   ✅   |      **Sim**      |
| Produtos        |   ✅   |  ✅  |   ✅   |   ✅   |      **Sim**      |
| Mesas           |   ✅   |  ✅  |   ✅   |   ✅   |      **Sim**      |
| Endereços       |   ✅   |  ✅  |   ✅   |   ✅   |      **Sim**      |
| Avaliações      |   ✅   |  ✅  |   ✅   |   ✅   |      **Sim**      |
| Equipe          |   ✅   |  ✅  |   ✅   |   ✅   |      **Sim**      |
| Super Admin     |   ✅   |  ✅  |   ✅   |   ✅   |      **Sim**      |
| Delivery Config |   ✅   |  ✅  |   ✅   |   ✅   |      **Sim**      |
| Favoritos       |   ✅   |  ✅  |   ❌   |   ✅   |  Não (s/ UPDATE)  |
| Pedidos         |   ✅   |  ✅  |   ✅   |   ❌   |  Não (s/ DELETE)  |
| Autenticação    |   ✅   |  ❌  |   ❌   |   ❌   | Não (só registro) |
| Carrinho        |   ✅   |  ❌  |   ✅   |   ✅   |   Não (sessão)    |
| Pagamentos      |   ❌   |  ❌  |   ❌   |   ❌   |  Processo apenas  |
