# Guia de Desenvolvimento - LinkGRI

## Setup do Ambiente

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Conta no OpenRouter (https://openrouter.ai)
- Bot no Telegram (via @BotFather)

### 1. Clone e Instalação

```bash
git clone <repo-url>
cd hacka-link-gri/backend
npm install
```

### 2. Configuração de Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:

```env
# Obrigatórias
OPENROUTER_API_KEY=sk-or-v1-sua-chave
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234
JWT_SECRET=segredo-minimo-32-caracteres

# Opcionais (já têm padrões)
MONGODB_URI=mongodb://localhost:27017/linkgri
REDIS_URL=redis://localhost:6379
```

### 3. Infraestrutura Local

```bash
# Subir MongoDB e Redis
docker-compose up -d mongo redis

# Verificar status
docker-compose ps
```

### 4. Seed de Dados

```bash
npm run seed
```

Isso cria:
- 1 corretor de teste
- 5 imóveis de exemplo
- 3 leads de exemplo

### 5. Iniciar Desenvolvimento

```bash
npm run dev
```

Servidor inicia em `http://localhost:3000`

---

## Estrutura do Projeto

### Convenções de Código

- **TypeScript**: Tipagem estrita ativada
- **Async/Await**: Preferido sobre callbacks
- **Early Return**: Evitar nesting excessivo
- **Logs**: Usar `logger` do Winston, nunca `console.log`
- **Erros**: Sempre propagar erros, nunca silenciar

### Padrões de Arquivo

```typescript
// Models: PascalCase, singular
// Ex: Lead.ts, Property.ts

// Services: camelCase, descreve ação
// Ex: webhookHandler.ts, messageSender.ts

// Types: interfaces em types/index.ts
// Ex: interface LeadState { ... }

// Config: kebab-case
// Ex: database.ts, env.ts
```

---

## Fluxo de Desenvolvimento

### Adicionar um Novo Endpoint

1. Criar rota em `src/api/routes/`
2. Adicionar ao `server.ts`
3. Documentar em `docs/api/api-reference.md`
4. Testar via curl/Postman

### Adicionar um Novo Agente

1. Criar prompt em `src/agents/prompts/<nome>.md`
2. Adicionar config em `src/agents/config.ts`
3. Definir triggers (regras de ativação)
4. Testar com diferentes perfis de lead

### Modificar o Grafo

1. Editar nó em `src/graph/nodes/`
2. Atualizar `src/graph/index.ts` se necessário
3. Testar fluxo completo

---

## Testes Manuais

### Testar Webhook do Telegram

```bash
curl -X POST http://localhost:3000/webhook/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 1,
    "message": {
      "message_id": 1,
      "from": {"id":123,"first_name":"Test","is_bot":false},
      "chat": {"id":123,"type":"private"},
      "date": 1234567890,
      "text": "/start f0491c0e4075446b"
    }
  }'
```

### Testar API Autenticada

```bash
# Obter token do seed
TOKEN="2a98e3d4-899d-466b-9475-2b5128600afb"

# Listar leads
curl http://localhost:3000/api/leads \
  -H "Authorization: Bearer $TOKEN"

# Ver estatísticas
curl http://localhost:3000/api/stats \
  -H "Authorization: Bearer $TOKEN"

# Gerar deep link
curl http://localhost:3000/api/deep-link \
  -H "Authorization: Bearer $TOKEN"
```

### Testar SSE

```bash
# Com httpie
http --stream http://localhost:3000/api/events \
  Authorization:"Bearer $TOKEN"

# Ou com curl
curl -N http://localhost:3000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: text/event-stream"
```

---

## Debug

### Logs

```bash
# Ver logs do servidor
npm run dev

# Ver logs do MongoDB
docker-compose logs -f mongo

# Ver logs do Redis
docker-compose logs -f redis
```

### MongoDB

```bash
# Acessar shell
docker exec -it linkgri-mongo mongosh linkgri

# Comandos úteis
db.leads.find().pretty()
db.messages.find({leadId: ObjectId("...")}).sort({createdAt: -1})
db.brokers.findOne()
```

### Redis

```bash
# Acessar CLI
docker exec -it linkgri-redis redis-cli

# Comandos úteis
KEYS lead:state:*
GET lead:state:<id>
```

---

## Deploy

### Preparar para Produção

1. Atualizar `.env` com variáveis de produção
2. Build: `npm run build`
3. Testar build: `npm start`

### Docker

```bash
# Build completo
docker-compose build

# Subir tudo
docker-compose up -d

# Ver logs
docker-compose logs -f app
```

### Configurar Webhook do Telegram

```bash
# Com ngrok (desenvolvimento)
ngrok http 3000

# Atualizar .env com URL do ngrok
# TELEGRAM_WEBHOOK_URL=https://xxx.ngrok.io/webhook/telegram

# Aplicar webhook
npm run setup-webhook
```

---

## Troubleshooting

### Erro: "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "MongoDB connection refused"

```bash
# Verificar se containers estão rodando
docker-compose ps

# Reiniciar
docker-compose restart mongo redis
```

### Erro: "Webhook not set"

```bash
# Verificar URL no .env
# Deve terminar com /webhook/telegram

# Reconfigurar
npm run setup-webhook
```

### Erro: "Invalid API token"

```bash
# Verificar token no banco
docker exec -it linkgri-mongo mongosh linkgri --eval "db.brokers.findOne({}, {apiToken: 1})"
```

---

## Contribuição

### Commits

```
feat: adicionar novo agente de investidores
fix: corrigir timeout no webhook
docs: atualizar README
refactor: simplificar lógica de scoring
```

### Pull Requests

1. Criar branch: `git checkout -b feature/nome`
2. Commitar mudanças
3. Abrir PR com descrição clara
4. Aguardar review

---

*Documento versionado. Última atualização: 24/05/2026*
