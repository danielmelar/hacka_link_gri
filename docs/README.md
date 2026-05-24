# Documentação LinkGRI

Bem-vindo à documentação completa da LinkGRI. Esta pasta contém toda a informação estratégica, técnica e operacional do projeto.

## 📚 Índice de Documentos

### Visão Geral
| Documento | Descrição |
|-----------|-----------|
| [context.md](context.md) | Contexto do projeto: origem, problema, solução, mercado |
| [product-overview.md](product-overview.md) | Visão geral do produto, MVP, modelo de negócio |

### Arquitetura
| Documento | Descrição |
|-----------|-----------|
| [architecture/system-architecture.md](architecture/system-architecture.md) | Arquitetura completa do sistema, fluxos de dados, decisões |
| [architecture/tech-stack.md](architecture/tech-stack.md) | Stack tecnológico completo com justificativas |
| [architecture/data-model.md](architecture/data-model.md) | Modelo de dados MongoDB, schemas, relacionamentos |
| [architecture/multi-agent-engine.md](architecture/multi-agent-engine.md) | Engine de multi-agentes, grafo LangGraph, regras |

### API
| Documento | Descrição |
|-----------|-----------|
| [api/api-reference.md](api/api-reference.md) | Referência completa da API REST + SSE |

### Guias
| Documento | Descrição |
|-----------|-----------|
| [guides/development-guide.md](guides/development-guide.md) | Setup, desenvolvimento, debug, deploy |

---

## 🗺️ Mapa Mental do Projeto

```
LinkGRI/
├── 📋 Contexto
│   ├── Problema: Corretores perdem tempo qualificando leads
│   ├── Solução: SDR de IA 24/7 (Sofia)
│   ├── Diferencial: Multi-agentes dinâmicos
│   └── Mercado: Corretores experientes com tráfego pago
│
├── 🏗️ Arquitetura
│   ├── Multi-tenant via Deep Linking
│   ├── Engine LangGraph (5 nós)
│   ├── RAG com isolamento brokerId
│   └── Notificações SSE em tempo real
│
├── 🤖 Agentes
│   ├── Sofia (SDR Geral)
│   ├── Especialista Família
│   └── Especialista Alto Padrão
│
├── 💾 Dados
│   ├── brokers (corretores)
│   ├── leads (estado do agente)
│   ├── properties (imóveis)
│   └── messages (conversas)
│
└── 🔌 API
    ├── Webhook Telegram (público)
    ├── Dashboard (autenticado)
    └── SSE (tempo real)
```

---

## 🚀 Quick Start

1. **Entender o produto:**
   - Leia [context.md](context.md)
   - Leia [product-overview.md](product-overview.md)

2. **Entender a arquitetura:**
   - Leia [architecture/system-architecture.md](architecture/system-architecture.md)
   - Leia [architecture/multi-agent-engine.md](architecture/multi-agent-engine.md)

3. **Desenvolver:**
   - Leia [guides/development-guide.md](guides/development-guide.md)
   - Consulte [api/api-reference.md](api/api-reference.md)

---

## 📊 Status do Projeto

| Componente | Status |
|------------|--------|
| Backend API | ✅ Funcionando |
| Bot Telegram | ✅ Funcionando |
| Multi-Agentes | ✅ Funcionando |
| Banco de Dados | ✅ Populado |
| Documentação | ✅ Completa |
| Dashboard Frontend | ⏳ Pendente |

---

## 📝 Convenções

- Documentos são versionados com data
- Use `✅` para funcionalidades prontas
- Use `⏳` para funcionalidades pendentes
- Use `❌` para funcionalidades com problemas

---

*Última atualização: 24/05/2026*
