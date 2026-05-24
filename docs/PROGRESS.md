# CLAVIS - Documentação de Progresso

> **Data:** 24 de Maio de 2026
> **Status:** MVP Funcional — Backend e Frontend operacionais

---

## TL;DR

A plataforma **CLAVIS** (anteriormente LinkGRI) está com o MVP completo e funcional:
- ✅ Backend com APIs REST, autenticação JWT, multi-agente LangGraph, bot Telegram
- ✅ Frontend React com dashboard, leads, portfólio, agentes, analytics, configurações
- ✅ Bot Telegram `@clavisapp_bot` funcionando com deep links por corretor
- ✅ Fluxo end-to-end validado: lead clica link → conversa com bot → aparece no dashboard

---

## 1. Backend — APIs Implementadas

### 1.1 Autenticação (`backend/src/api/routes/auth.ts`)
- **POST /api/auth/login** — Login com email/senha, retorna JWT
- **GET /api/auth/me** — Perfil do corretor logado
- Senhas hashadas com bcrypt (salt 12)
- Suporte dual: JWT para frontend, API Token legacy para Telegram webhook

### 1.2 CRUD de Imóveis (`backend/src/api/routes/properties.ts`)
- **GET /api/properties** — Listar com filtros (tipo, status, preço, região) e paginação
- **POST /api/properties** — Criar imóvel
- **GET /api/properties/:id** — Detalhe do imóvel
- **PUT /api/properties/:id** — Atualizar imóvel
- **DELETE /api/properties/:id** — Desativar imóvel (soft delete)
- **GET /api/properties/filters/options** — Opções para filtros

### 1.3 Analytics (`backend/src/api/routes/analytics.ts`)
- **GET /api/analytics/overview** — Métricas do dashboard
- **GET /api/analytics/funnel** — Funil de leads por etapa
- **GET /api/analytics/agents** — Performance por agente
- **GET /api/analytics/messages** — Estatísticas de mensagens

### 1.4 Follow-ups (`backend/src/api/routes/followUps.ts`)
- **GET /api/leads/:id/follow-ups** — Listar follow-ups do lead
- **POST /api/leads/:id/follow-ups** — Criar follow-up
- **PUT /api/follow-ups/:id** — Atualizar follow-up
- **DELETE /api/follow-ups/:id** — Deletar follow-up
- **GET /api/calendar** — Calendário de agendamentos
- **POST /api/leads/:id/schedule** — Agendar visita/reunião

### 1.5 Configurações (`backend/src/api/routes/settings.ts`)
- **GET /api/settings** — Configurações do corretor
- **PUT /api/settings** — Atualizar perfil
- **PUT /api/settings/notifications** — Configurar notificações
- **PUT /api/settings/working-hours** — Horário de trabalho
- **POST /api/settings/regenerate-link** — Regenerar deep link

### 1.6 Dashboard Legacy (`backend/src/api/routes/dashboard.ts`)
- **GET /api/stats** — Estatísticas rápidas
- **GET /api/profile** — Perfil do corretor
- **GET /api/leads** — Listar leads com filtros
- **GET /api/leads/:id** — Detalhe do lead
- **GET /api/leads/:id/messages** — Histórico de mensagens
- **POST /api/leads/:id/claim** — Resgatar lead
- **POST /api/leads/:id/notes** — Adicionar anotação

### 1.7 Webhook Telegram (`backend/src/api/routes/webhook.ts`)
- **POST /webhook/telegram** — Recebe mensagens do Telegram
- Processa novos leads via deep link (`/start <token>`)
- Processa mensagens de leads existentes via LangGraph

### 1.8 SSE (`backend/src/api/routes/sse.ts`)
- **GET /api/events** — Server-Sent Events para notificações em tempo real
- Reconexão automática, heartbeat

---

## 2. Frontend — Páginas Implementadas

### 2.1 Setup
- **Stack:** React 19 + Vite 6 + TypeScript + Tailwind CSS v4 + React Router v7
- **State:** Zustand (auth store)
- **Charts:** Recharts
- **Icons:** Lucide React
- **HTTP:** Axios com interceptors
- **Proxy:** Vite proxy para `/api` → `localhost:3000`

### 2.2 Páginas

| Página | Arquivo | Status |
|--------|---------|--------|
| Login | `platform/src/pages/Login.tsx` | ✅ Funcional |
| Dashboard | `platform/src/pages/Dashboard.tsx` | ✅ Com dados reais |
| Leads | `platform/src/pages/Leads.tsx` | ✅ Com filtros e paginação |
| Lead Detail | `platform/src/pages/LeadDetail.tsx` | ✅ Chat, info, follow-ups |
| Portfólio | `platform/src/pages/Properties.tsx` | ✅ Grid com cards |
| Agentes | `platform/src/pages/Agents.tsx` | ✅ 3 agentes visíveis |
| Analytics | `platform/src/pages/Analytics.tsx` | ✅ Gráficos e métricas |
| Configurações | `platform/src/pages/Settings.tsx` | ✅ Perfil e notificações |

### 2.3 Componentes de Layout
- **Sidebar** — Navegação com ícones, colapsável
- **Header** — Busca, notificações, perfil
- **Layout** — Wrapper com sidebar + header + content

---

## 3. Bot Telegram — Fluxo Validado

### 3.1 Configuração
- **Bot:** `@clavisapp_bot`
- **Webhook:** ngrok → `https://untyrantlike-flintily-particia.ngrok-free.dev/webhook/telegram`
- **Deep Link:** `https://t.me/clavisapp_bot?start=<token>`

### 3.2 Fluxo Testado
1. ✅ Lead clica no deep link do corretor
2. ✅ Abre conversa com `@clavisapp_bot` no Telegram
3. ✅ Bot envia mensagem de boas-vindas (Sofia)
4. ✅ Lead é criado no MongoDB com `brokerId` correto
5. ✅ Lead aparece no dashboard do corretor
6. ✅ Bot responde mensagens do lead via LangGraph
7. ✅ Mensagens são salvas no banco

### 3.3 Agentes (Multi-Agente)
- **Sofia (SDR_Geral)** — Atendimento inicial e qualificação
- **Especialista Família** — Ativa quando detecta filhos
- **Especialista Alto Padrão** — Ativa quando detecta alto orçamento

---

## 4. Modelo de Dados

### 4.1 Coleções MongoDB
- **brokers** — Corretores (com senha hash bcrypt)
- **leads** — Leads (com estado de qualificação)
- **messages** — Mensagens do chat
- **properties** — Imóveis do portfólio

### 4.2 Seed Data
- 1 corretor: `joao@linkgri.com` / `senha123456`
- 3 leads com histórico de mensagens
- 5 imóveis no portfólio

---

## 5. Correções e Ajustes Realizados

### 5.1 Autenticação
- **Problema:** Middleware só suportava API Token
- **Solução:** Implementado suporte dual JWT + API Token
- **Arquivo:** `backend/src/api/middleware/auth.ts`

### 5.2 Hash de Senha
- **Problema:** Senhas salvas em plaintext
- **Solução:** Adicionado pre-save hook com bcrypt
- **Arquivo:** `backend/src/models/Broker.ts`

### 5.3 Prompt LangGraph
- **Problema:** Exemplo JSON no prompt de extração de entidades causava erro `INVALID_PROMPT_INPUT`
- **Solução:** Escapado chaves `{` `}` com `{{` `}}`
- **Arquivo:** `backend/src/graph/nodes/extractEntities.ts`

### 5.4 Rebranding LinkGRI → CLAVIS
- **Problema:** Nome antigo em documentação e mensagens
- **Solução:** Atualizado em:
  - `docs/context.md`
  - `docs/product-overview.md`
  - `docs/architecture/system-architecture.md`
  - `docs/architecture/data-model.md`
  - `docs/api/api-reference.md`
  - `docs/guides/development-guide.md`
  - `backend/src/services/telegram/messageSender.ts`
  - `backend/src/config/env.ts`

---

## 6. Pendências (Próximos Passos)

### 6.1 Frontend
- [ ] Página de formulário de imóvel (criar/editar)
- [ ] Página de detalhe do imóvel
- [ ] Página de mensagens (lista de conversas)
- [ ] Upload de imagens para imóveis
- [ ] Responsividade mobile (sidebar hamburger)
- [ ] Toast notifications
- [ ] Loading states e skeletons

### 6.2 Backend
- [ ] CRUD de corretores (admin)
- [ ] Upload de imagens (multer)
- [ ] RAG integrado ao portfólio do corretor
- [ ] WebSocket para chat em tempo real
- [ ] Rate limiting

### 6.3 Bot
- [ ] Melhorar extração de entidades (few-shot prompting)
- [ ] Integrar vector store para busca de imóveis
- [ ] Handoff automático para corretor

---

## 7. Como Rodar

### Backend
```bash
cd backend
npm install
npm run dev  # roda em localhost:3000
```

### Frontend
```bash
cd platform
npm install
npm run dev  # roda em localhost:5173
```

### Docker (MongoDB + Redis)
```bash
cd backend
docker-compose up -d
```

### Seed
```bash
cd backend
npx tsx scripts/seed.ts
```

---

## 8. Credenciais de Teste

| Campo | Valor |
|-------|-------|
| Email | `joao@linkgri.com` |
| Senha | `senha123456` |
| Bot Telegram | `@clavisapp_bot` |
| Deep Link | `https://t.me/clavisapp_bot?start=9a260230f2834bed` |

---

## 9. Arquitetura de Deploy

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Telegram      │────▶│   ngrok/webhook │────▶│  Backend API    │
│   @clavisapp_bot│     │   (dev) / VPS   │     │  localhost:3000 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                              ┌──────────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │   Frontend SPA  │
                    │  localhost:5173 │
                    └─────────────────┘
```

---

*Documento atualizado em: 24 de Maio de 2026*
