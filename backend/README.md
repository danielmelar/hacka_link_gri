# LinkGRI Backend

Backend do MVP LinkGRI - CRM Multi-Tenant com Agente IA para Corretores de Imóveis.

## 🏗️ Arquitetura

```
backend/
├── src/
│   ├── api/              # Rotas HTTP (Fastify)
│   │   ├── middleware/   # Autenticação
│   │   ├── routes/       # Endpoints (webhook, dashboard, SSE)
│   │   └── server.ts     # Entry point do servidor
│   ├── config/           # Configurações (DB, Redis, env)
│   ├── models/           # Schemas MongoDB (Mongoose)
│   ├── services/         # Lógica de negócio
│   │   ├── telegram/     # Bot e webhook handler
│   │   ├── rag/          # Vector search e busca de imóveis
│   │   └── notification/ # SSE manager
│   ├── agents/           # Configuração dos agentes de IA
│   │   ├── prompts/      # Prompts em markdown
│   │   └── config.ts     # Configuração e seleção de agentes
│   ├── graph/            # LangGraph - Orquestração de agentes
│   │   ├── nodes/        # Nós do grafo (extract, update, select, generate)
│   │   ├── state.ts      # Definição do estado
│   │   └── index.ts      # Definição do workflow
│   ├── types/            # TypeScript types
│   └── utils/            # Helpers (logger, scoring)
├── scripts/              # Scripts utilitários
│   ├── seed.ts           # Popula dados de teste
│   └── setup-webhook.ts  # Configura webhook do Telegram
├── docker-compose.yml    # Infraestrutura local
└── Dockerfile            # Build da aplicação
```

## 🚀 Quick Start

### 1. Instalação

```bash
cd backend
npm install
```

### 2. Configuração

```bash
cp .env.example .env
# Edite .env com suas credenciais
```

Variáveis obrigatórias:
- `OPENAI_API_KEY` - Chave da API OpenAI
- `TELEGRAM_BOT_TOKEN` - Token do BotFather
- `MONGODB_URI` - URI do MongoDB
- `REDIS_URL` - URL do Redis

### 3. Infraestrutura Local (Docker)

```bash
docker-compose up -d
```

Isso inicia:
- MongoDB na porta 27017
- Redis na porta 6379
- Mongo Express (UI) na porta 8081

### 4. Seed de Dados

```bash
npm run seed
```

Cria:
- 1 corretor de teste
- 5 imóveis de exemplo
- 3 leads de exemplo

### 5. Desenvolvimento

```bash
npm run dev
```

Servidor inicia em `http://localhost:3000`

## 📡 Endpoints

### Health Check
```
GET /health
```

### Webhook Telegram
```
POST /webhook/telegram
```

### Dashboard API (requer autenticação)
```
GET    /api/profile              # Perfil do corretor
GET    /api/stats                # Estatísticas
GET    /api/leads                # Lista de leads
GET    /api/leads/:id            # Detalhes do lead
GET    /api/leads/:id/messages   # Histórico de mensagens
POST   /api/leads/:id/claim      # Resgatar lead
GET    /api/properties           # Lista de imóveis
POST   /api/properties           # Criar imóvel
GET    /api/deep-link            # Gerar link do Telegram
```

### SSE (Server-Sent Events)
```
GET /api/events?brokerId=xxx
```

Eventos:
- `new_lead` - Novo lead iniciou conversa
- `lead_update` - Lead atualizado
- `lead_ready` - Lead qualificado (score >= 70)
- `message_received` - Nova mensagem
- `agent_changed` - Agente alterado

## 🔐 Autenticação

Todas as rotas do dashboard requerem autenticação via Bearer token:

```
Authorization: Bearer <api_token>
```

O token do corretor é gerado automaticamente no cadastro.

## 🤖 Fluxo do Agente

```
Mensagem do Lead
       ↓
[extract_entities]     → Extrai entidades com OpenAI
       ↓
[update_lead_state]    → Atualiza estado no MongoDB
       ↓
[select_agent]         → Seleciona agente baseado em regras
       ↓
[generate_response]    → Gera resposta com LLM
       ↓
[send_response]        → Envia para Telegram + notifica broker
```

### Regras de Transição de Agente

| Condição | Agente Selecionado |
|----------|-------------------|
| Default | Sofia (SDR Geral) |
| `temFilhos === true` | Especialista em Famílias |
| `perfilEstimado === 'AltoPadrao'` | Especialista em Alto Padrão |
| `orcamento > 1M` | Especialista em Alto Padrão |

## 🏠 Deep Linking

Cada corretor tem um link único:

```
https://t.me/LinkGRIBot?start=<deep_link_token>
```

Quando o lead clica:
1. Telegram envia `/start <token>`
2. Backend cria lead vinculado ao corretor
3. Sofia envia mensagem de boas-vindas
4. Corretor recebe notificação SSE

## 📊 Scoring de Leads

O score (0-100) é calculado baseado em:

| Informação | Pontos |
|------------|--------|
| Nome | 5 |
| Telefone | 10 |
| Email | 5 |
| Tipo de imóvel | 10 |
| Região | 10 |
| Orçamento | 15 |
| Tem filhos | 10 |
| Urgência alta | 15 |
| Perfil definido | 10 |

**Qualificação automática:** Score >= 70

## 🐳 Docker

### Build
```bash
docker build -t linkgri-backend .
```

### Run
```bash
docker-compose up -d
```

### Logs
```bash
docker-compose logs -f app
```

## 📝 Scripts

```bash
npm run seed              # Popula dados de teste
npm run setup-webhook     # Configura webhook do Telegram
npm run build             # Compila TypeScript
npm run start             # Inicia produção
npm run dev               # Modo desenvolvimento
npm run lint              # ESLint
npm run typecheck         # Verifica tipos
```

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente | `development` |
| `PORT` | Porta do servidor | `3000` |
| `MONGODB_URI` | URI MongoDB | `mongodb://localhost:27017/linkgri` |
| `REDIS_URL` | URL Redis | `redis://localhost:6379` |
| `OPENAI_API_KEY` | Chave OpenAI | - |
| `OPENAI_MODEL` | Modelo LLM | `gpt-4o-mini` |
| `TELEGRAM_BOT_TOKEN` | Token BotFather | - |
| `TELEGRAM_WEBHOOK_URL` | URL webhook | - |
| `JWT_SECRET` | Segredo JWT | - |
| `ENABLE_SSE` | Habilitar SSE | `true` |
| `ENABLE_VECTOR_SEARCH` | Habilitar vector search | `true` |

## 🧪 Testes Manuais

### 1. Criar Corretor
```bash
curl -X POST http://localhost:3000/api/brokers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"12345678"}'
```

### 2. Obter Deep Link
```bash
curl http://localhost:3000/api/deep-link \
  -H "Authorization: Bearer <api_token>"
```

### 3. Simular Webhook Telegram
```bash
curl -X POST http://localhost:3000/webhook/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123,
    "message": {
      "message_id": 1,
      "from": {"id":123,"first_name":"Test","is_bot":false},
      "chat": {"id":123,"type":"private"},
      "date": 1234567890,
      "text": "/start <deep_link_token>"
    }
  }'
```

## 📚 Documentação Adicional

- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [MongoDB Atlas Vector Search](https://www.mongodb.com/docs/atlas/atlas-vector-search/)

## 🆘 Suporte

Em caso de problemas:
1. Verifique logs: `docker-compose logs -f app`
2. Verifique health: `curl http://localhost:3000/health`
3. Verifique conexões: `curl http://localhost:3000/api/sse-stats`
