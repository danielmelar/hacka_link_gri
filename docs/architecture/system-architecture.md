# Arquitetura do Sistema - CLAVIS v1.0

## Visão Geral da Arquitetura

A CLAVIS segue uma arquitetura **modular, escalável e orientada a serviços**, projetada para suportar multi-tenancy desde o início.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTES                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │   Telegram   │  │   Dashboard  │  │   MongoDB    │                      │
│  │    (Lead)    │  │  (Corretor)  │  │   Express    │                      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                      │
└─────────┼─────────────────┼─────────────────┼──────────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (Fastify)                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ /webhook/telegram│  │   /api/*        │  │  /api/events    │             │
│  │   (Público)     │  │ (Autenticado)   │  │    (SSE)        │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
└───────────┼────────────────────┼────────────────────┼──────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAMADA DE SERVIÇOS                                  │
│                                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐                        │
│  │  Telegram Service   │    │  Agent Engine       │                        │
│  │  - Bot handler      │    │  - LangGraph        │                        │
│  │  - Webhook parser   │    │  - Multi-agentes    │                        │
│  │  - Message sender   │    │  - RAG              │                        │
│  └──────────┬──────────┘    └──────────┬──────────┘                        │
│             │                          │                                   │
│  ┌──────────┴──────────┐    ┌──────────┴──────────┐                        │
│  │  RAG Service        │    │  Notification       │                        │
│  │  - Vector search    │    │  - SSE Manager      │                        │
│  │  - Property search  │    │  - Real-time events │                        │
│  └─────────────────────┘    └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CAMADA DE DADOS                                   │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │    MongoDB      │  │     Redis       │  │   OpenRouter    │             │
│  │  (Persistência) │  │    (Cache)      │  │    (LLM API)    │             │
│  │                 │  │                 │  │                 │             │
│  │  - Brokers      │  │  - Lead state   │  │  - GPT-4o-mini  │             │
│  │  - Leads        │  │  - Rate limits  │  │  - Claude 3.5   │             │
│  │  - Properties   │  │  - Sessions     │  │  - Embeddings   │             │
│  │  - Messages     │  │                 │  │                 │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Princípios Arquiteturais

### 1. Multi-Tenancy via Deep Linking

Em vez de criar um bot do Telegram para cada corretor (complexo e caro), usamos **um único bot global** com links exclusivos:

```
Corretor A → t.me/clavisapp_bot?start=TOKEN_A
Corretor B → t.me/clavisapp_bot?start=TOKEN_B
Corretor C → t.me/clavisapp_bot?start=TOKEN_C
```

**Vantagens:**
- Um único webhook para gerenciar
- Escalabilidade imediata
- Custo zero de infraestrutura adicional

**Isolamento de dados garantido em 3 camadas:**
1. **Deep link** vincula lead ao corretor na criação
2. **Todas as queries** filtram por `brokerId`
3. **SSE connections** separadas por `brokerId`

### 2. Engine de Multi-Agentes (LangGraph)

A conversa não segue um roteiro fixo. Usamos um **Grafo de Estado** onde cada nó é uma função pura:

```
Entrada → Extrair Entidades → Atualizar Estado → Selecionar Agente → Gerar Resposta → Enviar
```

**Por que LangGraph?**
- Fluxo explícito e visual
- Fácil de debugar e monitorar
- Cada nó pode ser testado isoladamente
- Permite loops e condicionais complexas

### 3. RAG com Isolamento Multi-Tenant

Toda busca de imóveis é rigidamente filtrada:

```javascript
// SEMPRE filtrar por brokerId
Property.find({ brokerId: state.brokerId, active: true })
```

**Um agente NUNCA sugere o imóvel de outro corretor.**

---

## Componentes Principais

### API Gateway (Fastify)

- **Roteamento**: Webhook público + API autenticada + SSE
- **Rate Limiting**: Proteção contra spam do Telegram
- **CORS**: Configurado para o dashboard
- **Error Handling**: Padronizado em todos os endpoints

### Serviço Telegram

- **Bot Handler**: Inicialização e configuração do bot
- **Webhook Parser**: Processa updates do Telegram
- **Message Sender**: Envia mensagens com typing indicator
- **Deep Link Handler**: Cria vínculo lead-corretor

### Engine de Agentes

- **State Manager**: Mantém estado da conversa em MongoDB + Redis
- **Entity Extractor**: Usa LLM para extrair informações da mensagem
- **Agent Selector**: Regras de transição entre agentes
- **Response Generator**: Gera resposta com contexto do lead
- **Property RAG**: Busca imóveis relevantes do portfólio

### Serviço de Notificação

- **SSE Manager**: Conexões persistentes por corretor
- **Event Dispatcher**: Envia eventos em tempo real
- **Heartbeat**: Mantém conexões vivas

---

## Fluxo de Dados

### 1. Novo Lead (Deep Link)

```
Lead clica no link → Telegram envia /start TOKEN
    → Backend cria Lead (vinculado ao Broker)
    → Sofia envia mensagem de boas-vindas
    → Notifica corretor via SSE (new_lead)
```

### 2. Mensagem do Lead

```
Lead envia mensagem → Telegram webhook
    → Busca Lead pelo chatId
    → Extrai entidades (OpenRouter)
    → Atualiza estado no MongoDB
    → Seleciona agente baseado em regras
    → Busca imóveis relevantes (RAG)
    → Gera resposta (OpenRouter)
    → Envia para Telegram
    → Notifica corretor (message_received)
    → Se score >= 70, notifica (lead_ready)
```

### 3. Corretor no Dashboard

```
Corretor abre dashboard → Conecta SSE
    → Recebe notificações em tempo real
    → Visualiza leads, estatísticas, conversas
    → Pode "resgatar" lead (claim)
```

---

## Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Framework HTTP | Fastify | Performance, async/await nativo, plugins |
| Banco de dados | MongoDB | Flexibilidade de schema para estado dos agentes |
| Cache | Redis | Sessões, rate limiting, estado temporário |
| LLM | OpenRouter | Múltiplos provedores, fallback, preços competitivos |
| Orquestração | LangGraph | Fluxo explícito, fácil de manter e evoluir |
| Bot | Telegraf | SDK maduro para Telegram |
| Real-time | SSE | Unidirecional, mais simples que WebSockets |
| Container | Docker | Consistência entre dev e prod |

---

## Escalabilidade

### Horizontal
- Múltiplas instâncias do backend (load balancer)
- MongoDB replica set
- Redis cluster

### Vertical
- Modelos LLM mais potentes para clientes enterprise
- Cache agressivo de embeddings
- Batch processing para analytics

---

## Segurança

- **Isolamento multi-tenant**: `brokerId` em todas as queries
- **Autenticação**: API tokens por corretor
- **Rate limiting**: Proteção contra abuse
- **Validação**: Zod para todas as entradas
- **Logs**: Winston com sanitização de dados sensíveis

---

*Documento versionado. Última atualização: 24/05/2026*
