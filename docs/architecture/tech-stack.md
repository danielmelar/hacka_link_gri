# Stack Tecnológico - LinkGRI v1.0

## Visão Geral

A LinkGRI foi construída com uma stack moderna, focada em performance, desenvolvedor-experiência e escalabilidade.

---

## Backend

### Runtime
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 20+ | Runtime JavaScript |
| **TypeScript** | 5.4+ | Tipagem estática |

### Framework HTTP
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Fastify** | 4.27+ | Servidor HTTP de alta performance |
| **@fastify/cors** | 9.0+ | Cross-origin resource sharing |
| **@fastify/websocket** | 8.3+ | WebSocket support (futuro) |

**Por que Fastify?**
- Performance superior ao Express (2x mais rápido)
- Schema validation integrado
- Plugin system robusto
- Async/await nativo
- Logging integrado

### Banco de Dados
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **MongoDB** | 7.0+ | Banco de dados principal |
| **Mongoose** | 8.4+ | ODM para MongoDB |
| **Redis** | 7.0+ | Cache e sessões |
| **ioredis** | 5.4+ | Cliente Redis para Node.js |

**Por que MongoDB?**
- Schema flexível (ideal para estado dos agentes)
- Native JSON (compatível com objetos JavaScript)
- Text search integrado
- Vector search (MongoDB Atlas)
- Escalabilidade horizontal

### Inteligência Artificial
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **OpenRouter** | API v1 | Gateway unificado de LLMs |
| **@langchain/core** | 0.3+ | Abstrações para LLMs |
| **@langchain/langgraph** | 0.2+ | Orquestração de agentes |
| **@langchain/openai** | 0.3+ | Integração OpenAI via OpenRouter |
| **@langchain/mongodb** | 0.1+ | Vector store MongoDB |

**Por que OpenRouter?**
- Acesso a múltiplos provedores (OpenAI, Anthropic, Google, Meta)
- Fallback automático entre modelos
- Preços competitivos
- Rate limits generosos
- Analytics de uso

**Modelos Utilizados:**
| Agente | Modelo | Provedor | Por quê |
|--------|--------|----------|---------|
| Sofia (SDR) | gpt-4o-mini | OpenAI | Rápido, barato, eficiente |
| Especialista Família | gpt-4o-mini | OpenAI | Rápido, barato, eficiente |
| Especialista Alto Padrão | claude-3.5-sonnet | Anthropic | Melhor contexto longo |
| Extração de Entidades | gpt-4o-mini | OpenAI | Tarefa simples, precisa ser rápida |
| Embeddings | text-embedding-3-small | OpenAI | Compatível com vector search |

### Bot Telegram
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Telegraf** | 4.16+ | Framework para bots Telegram |

**Por que Telegraf?**
- API limpa e moderna
- TypeScript nativo
- Middleware system
- Webhook e polling support

### Validação e Tipagem
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Zod** | 3.23+ | Validação de schemas |

**Por que Zod?**
- TypeScript-first
- Runtime validation
- Error messages claras
- Composição de schemas

### Logging
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Winston** | 3.13+ | Logger estruturado |

**Por que Winston?**
- Múltiplos transports
- Formato JSON para produção
- Níveis de log configuráveis
- Integração com serviços de monitoramento

### Utilitários
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **uuid** | 9.0+ | Geração de tokens únicos |
| **dotenv** | 16.4+ | Variáveis de ambiente |

---

## Infraestrutura

### Containerização
| Tecnologia | Uso |
|------------|-----|
| **Docker** | Containerização da aplicação |
| **Docker Compose** | Orquestração local (MongoDB + Redis + App) |

### Serviços Externos
| Serviço | Uso |
|---------|-----|
| **Telegram Bot API** | Canal de comunicação com leads |
| **OpenRouter** | Gateway de LLMs |
| **ngrok** | Túnel para webhook em desenvolvimento |

---

## Ferramentas de Desenvolvimento

### Build e Execução
| Ferramenta | Uso |
|------------|-----|
| **tsx** | Executar TypeScript sem compilação (dev) |
| **tsc** | Compilação TypeScript para produção |

### Qualidade de Código
| Ferramenta | Uso |
|------------|-----|
| **ESLint** | Linting de código |
| **@typescript-eslint** | Regras específicas para TypeScript |

---

## Estrutura de Pastas

```
backend/
├── src/
│   ├── api/                    # Camada HTTP
│   │   ├── middleware/         # Autenticação
│   │   ├── routes/             # Endpoints
│   │   └── server.ts           # Entry point
│   ├── config/                 # Configurações
│   │   ├── database.ts         # MongoDB
│   │   ├── env.ts              # Variáveis de ambiente
│   │   └── redis.ts            # Redis
│   ├── models/                 # Schemas MongoDB
│   │   ├── Broker.ts
│   │   ├── Lead.ts
│   │   ├── Message.ts
│   │   └── Property.ts
│   ├── services/               # Lógica de negócio
│   │   ├── telegram/           # Bot Telegram
│   │   ├── rag/                # Vector search
│   │   └── notification/       # SSE
│   ├── agents/                 # Configuração de agentes
│   │   ├── prompts/            # Prompts em markdown
│   │   └── config.ts
│   ├── graph/                  # LangGraph
│   │   ├── nodes/              # Nós do grafo
│   │   ├── state.ts            # Estado do grafo
│   │   └── index.ts            # Workflow
│   ├── types/                  # TypeScript types
│   └── utils/                  # Utilitários
│       ├── logger.ts
│       └── scoring.ts
├── scripts/                    # Scripts utilitários
│   ├── seed.ts
│   └── setup-webhook.ts
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## Variáveis de Ambiente

### Obrigatórias
| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `OPENROUTER_API_KEY` | Chave da API OpenRouter | `sk-or-v1-...` |
| `TELEGRAM_BOT_TOKEN` | Token do BotFather | `123456:ABC-DEF...` |
| `JWT_SECRET` | Segredo para JWT | `minimo-32-caracteres...` |

### Infraestrutura
| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `MONGODB_URI` | `mongodb://localhost:27017/linkgri` | URI do MongoDB |
| `REDIS_URL` | `redis://localhost:6379` | URL do Redis |
| `PORT` | `3000` | Porta do servidor |

### Configuração
| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `OPENROUTER_MODEL` | `openai/gpt-4o-mini` | Modelo padrão |
| `OPENROUTER_EMBEDDING_MODEL` | `openai/text-embedding-3-small` | Modelo de embeddings |
| `ENABLE_SSE` | `true` | Habilitar notificações SSE |
| `ENABLE_VECTOR_SEARCH` | `true` | Habilitar vector search |
| `LOG_LEVEL` | `info` | Nível de log |

---

## Dependências de Desenvolvimento

| Pacote | Versão | Uso |
|--------|--------|-----|
| `@types/node` | 20.12+ | Tipos Node.js |
| `@types/uuid` | 9.0+ | Tipos UUID |
| `eslint` | 8.57+ | Linter |
| `typescript` | 5.4+ | Compilador TypeScript |
| `tsx` | 4.11+ | Executor TypeScript |

---

## Scripts NPM

```bash
npm run dev          # Modo desenvolvimento (tsx watch)
npm run build        # Compila TypeScript
npm run start        # Inicia produção
npm run seed         # Popula dados de teste
npm run setup-webhook # Configura webhook Telegram
npm run lint         # ESLint
npm run typecheck    # Verificação de tipos
```

---

## Roadmap de Stack

### Curto Prazo
- [ ] Adicionar testes (Jest/Vitest)
- [ ] CI/CD (GitHub Actions)
- [ ] Monitoramento (Sentry)

### Médio Prazo
- [ ] PostgreSQL para dados relacionais (se necessário)
- [ ] Kafka/RabbitMQ para filas de mensagens
- [ ] Prometheus + Grafana para métricas

### Longo Prazo
- [ ] Kubernetes para orquestração
- [ ] CDN para assets
- [ ] Multi-region deployment

---

*Documento versionado. Última atualização: 24/05/2026*
