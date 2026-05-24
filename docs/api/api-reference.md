# API Reference - CLAVIS v1.0

## Base URL

```
Desenvolvimento: http://localhost:3000
Produção: https://api.clavis.immo
```

## Autenticação

Todas as rotas do dashboard requerem autenticação via **Bearer Token** no header `Authorization`.

```http
Authorization: Bearer <api_token>
```

O token é gerado automaticamente na criação do corretor e pode ser obtido via endpoint `/api/deep-link`.

---

## Endpoints

### Health Check

#### GET /health
Verifica o status do sistema.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-05-24T07:05:54.394Z",
    "version": "1.0.0",
    "environment": "development",
    "services": {
      "mongodb": "connected",
      "redis": "connected"
    },
    "connections": {
      "totalConnections": 0,
      "connectionsByBroker": {}
    }
  }
}
```

---

### Webhook Telegram

#### POST /webhook/telegram
Recebe updates do Telegram Bot API.

> ⚠️ **Atenção:** Este endpoint é público e chamado pelo Telegram. Não requer autenticação.

**Body (exemplo):**
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "João"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "date": 1716537600,
    "text": "/start abc123def456"
  }
}
```

**Resposta:**
```json
{ "ok": true }
```

---

### Dashboard API

#### GET /api/profile
Retorna o perfil do corretor autenticado.

**Headers:**
```http
Authorization: Bearer <api_token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "_id": "6a12a139fe551b2d2d7f470f",
    "name": "João Corretor",
    "email": "joao@linkgri.com",
    "phone": "+55 11 99999-9999",
    "plan": "pro",
    "deepLinkToken": "f0491c0e4075446b",
    "isActive": true,
    "createdAt": "2026-05-24T06:56:57.647Z"
  }
}
```

---

#### GET /api/stats
Retorna estatísticas do corretor.

**Headers:**
```http
Authorization: Bearer <api_token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "leads": {
      "total": 4,
      "active": 3,
      "qualified": 2,
      "readyForContact": 1
    },
    "messages": {
      "inbound": 15,
      "outbound": 18,
      "total": 33
    },
    "properties": 5
  }
}
```

---

#### GET /api/leads
Lista todos os leads do corretor.

**Headers:**
```http
Authorization: Bearer <api_token>
```

**Query Parameters:**
| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|--------|
| `page` | number | Página atual | 1 |
| `limit` | number | Itens por página | 20 |
| `etapa` | string | Filtrar por etapa | - |
| `prontoParaCorretor` | boolean | Leads prontos | - |
| `sortBy` | string | Campo de ordenação | `lastInteractionAt` |
| `order` | string | `asc` ou `desc` | `desc` |

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6a12a6291ddf4b091257f5ba",
      "name": "Daniel",
      "telegramChatId": "1293752445",
      "state": {
        "perfilEstimado": "Indefinido",
        "temFilhos": null,
        "agenteAtual": "SDR_Geral",
        "etapa": "inicio",
        "prontoParaCorretor": false
      },
      "score": 10,
      "lastInteractionAt": "2026-05-24T07:19:27.389Z",
      "totalMessages": 1,
      "tags": [],
      "claimedByBroker": false
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "hasMore": false
  }
}
```

---

#### GET /api/leads/:id
Retorna detalhes de um lead específico.

**Headers:**
```http
Authorization: Bearer <api_token>
```

**Parâmetros:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | ID do lead |

**Resposta:**
```json
{
  "success": true,
  "data": {
    "_id": "6a12a6291ddf4b091257f5ba",
    "brokerId": "6a12a139fe551b2d2d7f470f",
    "telegramChatId": "1293752445",
    "name": "Daniel",
    "state": {
      "perfilEstimado": "Indefinido",
      "temFilhos": null,
      "quantosFilhos": null,
      "dorPrincipal": null,
      "orcamentoEstimado": null,
      "regiaoInteresse": null,
      "tipoImovel": null,
      "urgencia": null,
      "agenteAtual": "SDR_Geral",
      "prontoParaCorretor": false,
      "etapa": "inicio"
    },
    "score": 10,
    "scoreHistory": [
      {
        "score": 10,
        "reason": "Atualização automática baseada em novas informações",
        "timestamp": "2026-05-24T07:19:27.388Z"
      }
    ],
    "lastInteractionAt": "2026-05-24T07:19:27.389Z",
    "firstInteractionAt": "2026-05-24T07:18:01.487Z",
    "totalMessages": 1,
    "isActive": true,
    "claimedByBroker": false,
    "tags": [],
    "createdAt": "2026-05-24T06:56:57.655Z",
    "updatedAt": "2026-05-24T07:19:27.390Z"
  }
}
```

---

#### GET /api/leads/:id/messages
Retorna o histórico de mensagens de um lead.

**Headers:**
```http
Authorization: Bearer <api_token>
```

**Query Parameters:**
| Parâmetro | Tipo | Descrição | Padrão |
|-----------|------|-----------|--------|
| `limit` | number | Máximo de mensagens | 50 |

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6a12a67f1ddf4b091257f5c1",
      "leadId": "6a12a6291ddf4b091257f5ba",
      "direction": "inbound",
      "type": "text",
      "content": "é pra morar",
      "metadata": {
        "stateChanged": false,
        "propertiesSuggested": []
      },
      "status": "read",
      "createdAt": "2026-05-24T07:19:27.401Z"
    },
    {
      "_id": "6a12a6821ddf4b091257f5ca",
      "leadId": "6a12a6291ddf4b091257f5ba",
      "direction": "outbound",
      "type": "text",
      "content": "Ótimo, Daniel! 😊\n\nMorar em um lugar...",
      "metadata": {
        "agentName": "sofia",
        "agentType": "sofia",
        "propertiesSuggested": ["6a12a139fe551b2d2d7f4716", "6a12a139fe551b2d2d7f4713"],
        "processingTimeMs": 1870,
        "modelUsed": "openai/gpt-4o-mini"
      },
      "status": "sent",
      "telegramMessageId": 10,
      "sentAt": "2026-05-24T07:19:30.982Z",
      "createdAt": "2026-05-24T07:19:30.984Z"
    }
  ]
}
```

---

#### POST /api/leads/:id/claim
Marca um lead como "resgatado" pelo corretor.

**Headers:**
```http
Authorization: Bearer <api_token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "claimed": true
  }
}
```

---

#### GET /api/properties
Lista os imóveis do corretor.

**Headers:**
```http
Authorization: Bearer <api_token>
```

**Query Parameters:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página |
| `limit` | number | Itens por página |
| `type` | string | Tipo do imóvel |
| `minPrice` | number | Preço mínimo |
| `maxPrice` | number | Preço máximo |
| `bedrooms` | number | Mínimo de quartos |
| `city` | string | Cidade |
| `featured` | boolean | Apenas destaques |

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6a12a139fe551b2d2d7f471a",
      "title": "Cobertura Duplex - Jardins",
      "description": "Cobertura duplex de luxo...",
      "price": 5500000,
      "priceType": "venda",
      "type": "cobertura",
      "bedrooms": 4,
      "bathrooms": 5,
      "area": 450,
      "address": {
        "street": "Rua Oscar Freire",
        "neighborhood": "Jardins",
        "city": "São Paulo",
        "state": "SP"
      },
      "features": ["piscina", "terraço", "vista_panoramica"],
      "targetProfile": ["alto_padrao", "investidor"],
      "active": true,
      "featured": true,
      "createdAt": "2026-05-24T06:56:57.647Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "hasMore": false
  }
}
```

---

#### POST /api/properties
Cria um novo imóvel.

**Headers:**
```http
Authorization: Bearer <api_token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Apartamento Novo",
  "description": "Descrição do imóvel",
  "price": 850000,
  "priceType": "venda",
  "type": "apartamento",
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 95,
  "address": {
    "street": "Rua Exemplo",
    "neighborhood": "Moema",
    "city": "São Paulo",
    "state": "SP"
  },
  "features": ["piscina", "academia"],
  "targetProfile": ["familia"]
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Apartamento Novo",
    ...
  }
}
```

---

#### GET /api/deep-link
Retorna o link do Telegram para o corretor.

**Headers:**
```http
Authorization: Bearer <api_token>
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "deepLink": "https://t.me/clavisapp_bot?start=f0491c0e4075446b",
    "token": "f0491c0e4075446b"
  }
}
```

---

### Server-Sent Events (SSE)

#### GET /api/events
Conexão persistente para notificações em tempo real.

**Headers:**
```http
Authorization: Bearer <api_token>
Accept: text/event-stream
```

**Eventos:**

| Tipo | Descrição | Payload |
|------|-----------|---------|
| `connected` | Conexão estabelecida | `{ connectionId }` |
| `new_lead` | Novo lead iniciou conversa | `{ leadId, leadName, score }` |
| `lead_update` | Lead teve informações atualizadas | `{ leadId, score, state }` |
| `lead_ready` | Lead atingiu score de qualificação | `{ leadId, leadName, score }` |
| `message_received` | Nova mensagem do lead | `{ leadId, direction, content }` |
| `agent_changed` | Agente foi alterado | `{ leadId, previousAgent, newAgent }` |

**Exemplo de evento:**
```
data: {"type":"new_lead","timestamp":"2026-05-24T07:18:01.498Z","data":{"leadId":"...","leadName":"Daniel","score":0}}

```

---

## Códigos de Erro

| Código | HTTP | Descrição |
|--------|------|-----------|
| `UNAUTHORIZED` | 401 | Token ausente ou inválido |
| `INVALID_TOKEN` | 401 | API token não encontrado |
| `ACCOUNT_INACTIVE` | 403 | Conta do corretor desativada |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `STATS_ERROR` | 500 | Erro ao buscar estatísticas |
| `LEADS_ERROR` | 500 | Erro ao buscar leads |
| `MESSAGES_ERROR` | 500 | Erro ao buscar mensagens |
| `PROPERTIES_ERROR` | 500 | Erro ao buscar imóveis |
| `CREATE_ERROR` | 500 | Erro ao criar recurso |
| `CLAIM_ERROR` | 500 | Erro ao resgatar lead |
| `SSE_ERROR` | 500 | Erro na conexão SSE |

---

## Exemplos de Uso

### cURL

```bash
# Health check
curl http://localhost:3000/health

# Listar leads
curl http://localhost:3000/api/leads \
  -H "Authorization: Bearer 2a98e3d4-899d-466b-9475-2b5128600afb"

# Ver mensagens de um lead
curl http://localhost:3000/api/leads/6a12a6291ddf4b091257f5ba/messages \
  -H "Authorization: Bearer 2a98e3d4-899d-466b-9475-2b5128600afb"

# Resgatar lead
curl -X POST http://localhost:3000/api/leads/6a12a6291ddf4b091257f5ba/claim \
  -H "Authorization: Bearer 2a98e3d4-899d-466b-9475-2b5128600afb"

# SSE (com httpie)
http --stream http://localhost:3000/api/events \
  Authorization:"Bearer 2a98e3d4-899d-466b-9475-2b5128600afb"
```

### JavaScript (Fetch)

```javascript
const API_URL = 'http://localhost:3000';
const TOKEN = '2a98e3d4-899d-466b-9475-2b5128600afb';

// Listar leads
async function getLeads() {
  const response = await fetch(`${API_URL}/api/leads`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  return response.json();
}

// SSE
const eventSource = new EventSource(`${API_URL}/api/events`, {
  headers: { 'Authorization': `Bearer ${TOKEN}` }
});

eventSource.addEventListener('new_lead', (event) => {
  const data = JSON.parse(event.data);
  console.log('Novo lead:', data);
});
```

---

*Documento versionado. Última atualização: 24/05/2026*
