# Modelo de Dados - LinkGRI v1.0

## Visão Geral

O banco de dados MongoDB contém 4 coleções principais, todas com isolamento multi-tenant via `brokerId`.

```
┌─────────────────────────────────────────────────────────────┐
│                        MongoDB                               │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   brokers   │◄───│    leads    │    │  properties │     │
│  │             │    │             │    │             │     │
│  │  Corretores │    │    Leads    │    │   Imóveis   │     │
│  └─────────────┘    └──────┬──────┘    └─────────────┘     │
│                            │                                 │
│                     ┌──────┴──────┐                        │
│                     │   messages  │                        │
│                     │             │                        │
│                     │  Mensagens  │                        │
│                     └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Coleção: `brokers`

Armazena os corretores (tenants) da plataforma.

### Schema

```typescript
interface IBroker {
  _id: ObjectId;              // ID único
  name: string;               // Nome do corretor
  email: string;              // Email (único)
  phone?: string;             // Telefone
  password: string;           // Senha hasheada
  deepLinkToken: string;      // Token para deep link (único)
  apiToken: string;           // Token para API (único)
  telegramBotToken?: string;  // Token do bot (futuro)
  plan: 'free' | 'pro' | 'enterprise';
  settings: {
    notificationEmail: boolean;
    notificationPush: boolean;
    autoQualification: boolean;
    workingHours: {
      start: string;          // HH:MM
      end: string;            // HH:MM
      timezone: string;       // Ex: America/Sao_Paulo
    };
  };
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Índices

```javascript
{ email: 1 }           // Login
{ deepLinkToken: 1 }   // Busca por token
{ apiToken: 1 }        // Autenticação API
{ isActive: 1, plan: 1 } // Listagens
```

### Exemplo

```json
{
  "_id": "6a12a139fe551b2d2d7f470f",
  "name": "João Corretor",
  "email": "joao@linkgri.com",
  "phone": "+55 11 99999-9999",
  "deepLinkToken": "f0491c0e4075446b",
  "apiToken": "2a98e3d4-899d-466b-9475-2b5128600afb",
  "plan": "pro",
  "settings": {
    "notificationEmail": true,
    "notificationPush": true,
    "autoQualification": true,
    "workingHours": {
      "start": "09:00",
      "end": "18:00",
      "timezone": "America/Sao_Paulo"
    }
  },
  "isActive": true,
  "createdAt": "2026-05-24T06:56:57.647Z"
}
```

---

## Coleção: `leads`

Armazena os leads (potenciais compradores) vinculados aos corretores.

### Schema

```typescript
interface ILead {
  _id: ObjectId;
  brokerId: ObjectId;         // FK → brokers
  telegramChatId: string;     // ID único do chat Telegram
  name?: string;              // Nome do lead
  phone?: string;
  email?: string;
  
  // Estado do agente (campo mais importante!)
  state: {
    perfilEstimado: 'MCMV' | 'MedioPadrao' | 'AltoPadrao' | 'Indefinido';
    temFilhos: boolean | null;
    quantosFilhos: number | null;
    dorPrincipal: string | null;
    orcamentoEstimado: string | null;
    regiaoInteresse: string | null;
    tipoImovel: 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'cobertura' | 'flat' | null;
    urgencia: 'baixa' | 'media' | 'alta' | null;
    agenteAtual: 'SDR_Geral' | 'Especialista_Familia' | 'Especialista_Alto_Padrao';
    prontoParaCorretor: boolean;
    etapa: 'inicio' | 'qualificacao' | 'apresentacao' | 'agendamento' | 'fechamento';
  };
  
  score: number;              // 0-100
  scoreHistory: Array<{
    score: number;
    reason: string;
    timestamp: Date;
  }>;
  
  lastInteractionAt: Date;
  firstInteractionAt: Date;
  totalMessages: number;
  
  isActive: boolean;
  claimedByBroker: boolean;
  claimedAt?: Date;
  
  tags: string[];
  notes?: string;
  
  scheduledAppointment?: {
    date: Date;
    location?: string;
    notes?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Índices

```javascript
{ telegramChatId: 1 }                    // Busca por chat
{ brokerId: 1, isActive: 1, lastInteractionAt: -1 } // Listagem
{ brokerId: 1, 'state.prontoParaCorretor': 1 }      // Leads prontos
{ brokerId: 1, score: -1 }               // Ranking
{ brokerId: 1, 'state.etapa': 1 }        // Filtrar por etapa
```

### Exemplo: Lead Inicial

```json
{
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
  "createdAt": "2026-05-24T06:56:57.655Z"
}
```

### Exemplo: Lead Qualificado

```json
{
  "_id": "6a12a139fe551b2d2d7f4722",
  "brokerId": "6a12a139fe551b2d2d7f470f",
  "telegramChatId": "123456789",
  "name": "Maria Silva",
  "phone": "+55 11 98888-8888",
  "state": {
    "perfilEstimado": "MedioPadrao",
    "temFilhos": true,
    "quantosFilhos": 2,
    "dorPrincipal": "Espaço para crianças",
    "orcamentoEstimado": "até 900 mil",
    "regiaoInteresse": "Moema",
    "tipoImovel": "apartamento",
    "urgencia": "media",
    "agenteAtual": "Especialista_Familia",
    "prontoParaCorretor": true,
    "etapa": "agendamento"
  },
  "score": 75,
  "lastInteractionAt": "2026-05-24T06:56:57.652Z",
  "firstInteractionAt": "2026-05-17T06:56:57.652Z",
  "totalMessages": 12,
  "isActive": true,
  "claimedByBroker": false,
  "tags": ["familia", "qualificado"]
}
```

---

## Coleção: `properties`

Armazena os imóveis do portfólio de cada corretor.

### Schema

```typescript
interface IProperty {
  _id: ObjectId;
  brokerId: ObjectId;         // FK → brokers (isolamento!)
  
  title: string;
  description: string;
  price: number;
  priceType: 'venda' | 'aluguel' | 'temporada';
  
  type: 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'cobertura' | 'flat';
  status: 'disponivel' | 'reservado' | 'vendido' | 'indisponivel';
  
  bedrooms: number;
  bathrooms: number;
  suites: number;
  parkingSpots: number;
  area: number;               // m²
  areaUtil?: number;
  areaTotal?: number;
  
  address: {
    street: string;
    number?: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  };
  
  features: string[];         // ['piscina', 'academia', 'playground']
  targetProfile: string[];    // ['familia', 'alto_padrao', 'investidor']
  
  images: Array<{
    url: string;
    caption?: string;
    isMain?: boolean;
  }>;
  videos?: string[];
  virtualTourUrl?: string;
  documents?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  
  active: boolean;
  featured: boolean;
  
  aiMetadata?: {
    embedding?: number[];     // Para vector search
    keywords: string[];
    sentiment: string;
    lastAnalyzedAt?: Date;
  };
  
  stats: {
    views: number;
    inquiries: number;
    shares: number;
    lastViewedAt?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Índices

```javascript
{ brokerId: 1, active: 1 }                    // Listagem básica
{ brokerId: 1, type: 1, active: 1 }           // Filtrar por tipo
{ brokerId: 1, price: 1, active: 1 }          // Ordenar por preço
{ brokerId: 1, 'address.city': 1, active: 1 } // Buscar por cidade
{ brokerId: 1, bedrooms: 1, active: 1 }       // Filtrar quartos
{ brokerId: 1, targetProfile: 1, active: 1 }  // Perfil alvo
{ title: 'text', description: 'text' }         // Text search
```

### Exemplo

```json
{
  "_id": "6a12a139fe551b2d2d7f471a",
  "brokerId": "6a12a139fe551b2d2d7f470f",
  "title": "Cobertura Duplex - Jardins",
  "description": "Cobertura duplex de luxo com vista espetacular...",
  "price": 5500000,
  "priceType": "venda",
  "type": "cobertura",
  "status": "disponivel",
  "bedrooms": 4,
  "bathrooms": 5,
  "suites": 4,
  "parkingSpots": 4,
  "area": 450,
  "address": {
    "street": "Rua Oscar Freire",
    "number": "1000",
    "neighborhood": "Jardins",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01426-001"
  },
  "features": ["piscina", "terraço", "vista_panoramica", "elevador_privativo", "seguranca_24h"],
  "targetProfile": ["alto_padrao", "investidor"],
  "images": [
    { "url": "https://example.com/cobertura1-1.jpg", "isMain": true }
  ],
  "active": true,
  "featured": true,
  "stats": {
    "views": 0,
    "inquiries": 0,
    "shares": 0
  },
  "createdAt": "2026-05-24T06:56:57.647Z"
}
```

---

## Coleção: `messages`

Armazena o histórico de mensagens entre leads e agentes.

### Schema

```typescript
interface IMessage {
  _id: ObjectId;
  leadId: ObjectId;           // FK → leads
  brokerId: ObjectId;         // FK → brokers
  
  direction: 'inbound' | 'outbound';
  type: 'text' | 'image' | 'video' | 'document' | 'location' | 'contact';
  
  content: string;
  contentRaw?: any;           // Dados brutos do Telegram
  
  mediaUrl?: string;
  mediaCaption?: string;
  
  metadata?: {
    agentName?: string;
    agentType?: 'sofia' | 'especialista_familia' | 'especialista_alto_padrao';
    intent?: string;
    entities?: Record<string, any>;
    sentiment?: 'positive' | 'neutral' | 'negative';
    confidence?: number;
    contextUsed?: boolean;
    propertiesSuggested?: string[];
    stateChanged?: boolean;
    processingTimeMs?: number;
    tokensUsed?: number;
    modelUsed?: string;
  };
  
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  telegramMessageId?: number;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  
  replyToMessageId?: ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Índices

```javascript
{ leadId: 1, createdAt: -1 }           // Conversa de um lead
{ brokerId: 1, createdAt: -1 }          // Todas mensagens do corretor
{ leadId: 1, direction: 1, createdAt: -1 } // Por direção
{ brokerId: 1, direction: 1, status: 1 }   // Pendentes
```

### Exemplo: Mensagem Inbound

```json
{
  "_id": "6a12a67f1ddf4b091257f5c1",
  "leadId": "6a12a6291ddf4b091257f5ba",
  "brokerId": "6a12a139fe551b2d2d7f470f",
  "direction": "inbound",
  "type": "text",
  "content": "é pra morar",
  "metadata": {
    "stateChanged": false,
    "propertiesSuggested": []
  },
  "status": "read",
  "createdAt": "2026-05-24T07:19:27.401Z"
}
```

### Exemplo: Mensagem Outbound (IA)

```json
{
  "_id": "6a12a6821ddf4b091257f5ca",
  "leadId": "6a12a6291ddf4b091257f5ba",
  "brokerId": "6a12a139fe551b2d2d7f470f",
  "direction": "outbound",
  "type": "text",
  "content": "Ótimo, Daniel! 😊\n\nMorar em um lugar...",
  "metadata": {
    "agentName": "sofia",
    "agentType": "sofia",
    "propertiesSuggested": [
      "6a12a139fe551b2d2d7f4716",
      "6a12a139fe551b2d2d7f4713",
      "6a12a139fe551b2d2d7f471a"
    ],
    "processingTimeMs": 1870,
    "modelUsed": "openai/gpt-4o-mini"
  },
  "status": "sent",
  "telegramMessageId": 10,
  "sentAt": "2026-05-24T07:19:30.982Z",
  "createdAt": "2026-05-24T07:19:30.984Z"
}
```

---

## Relacionamentos

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   brokers   │◄──────│    leads    │◄──────│  messages   │
│   (1)       │       │   (N)       │       │   (N)       │
└─────────────┘       └──────┬──────┘       └─────────────┘
                             │
                             │
                      ┌──────┴──────┐
                      │  properties │
                      │    (N)      │
                      └─────────────┘
```

**Regras:**
- Um broker tem N leads
- Um broker tem N properties
- Um lead tem N messages
- Um lead pertence a 1 broker
- Uma property pertence a 1 broker
- Uma message pertence a 1 lead e 1 broker

---

## Isolamento Multi-Tenant

**TODAS as queries devem incluir `brokerId`:**

```javascript
// ✅ Correto
Lead.find({ brokerId: '...', isActive: true })
Property.find({ brokerId: '...', active: true })
Message.find({ brokerId: '...', leadId: '...' })

// ❌ Errado (vaza dados de outros corretores)
Lead.find({ isActive: true })
```

---

## Cache (Redis)

### Estrutura de Chaves

```
lead:state:<leadId>     → Estado do lead (TTL: 1h)
broker:<brokerId>       → Dados do broker (TTL: 5min)
webhook:telegram:<ip>   → Rate limiting (TTL: 1min)
```

### Exemplo

```bash
# Estado de um lead
GET lead:state:6a12a6291ddf4b091257f5ba
# Retorna: {"leadId":"...","brokerId":"...","state":{...},"score":10}

# Dados do broker
GET broker:6a12a139fe551b2d2d7f470f
# Retorna: {"name":"João Corretor","plan":"pro",...}
```

---

## Migrações

MongoDB não requer migrações estruturais (schema-less), mas para mudanças de dados:

```javascript
// Exemplo: Adicionar campo novo a todos os leads
db.leads.updateMany(
  { "state.novoCampo": { $exists: false } },
  { $set: { "state.novoCampo": null } }
);
```

---

*Documento versionado. Última atualização: 24/05/2026*
