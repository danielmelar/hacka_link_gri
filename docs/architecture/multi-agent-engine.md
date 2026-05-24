# Engine de Multi-Agentes - LinkGRI

## Visão Geral

A LinkGRI utiliza uma arquitetura de **multi-agentes orquestrados por grafo** para atender leads de forma personalizada e dinâmica.

```
┌─────────────────────────────────────────────────────────────┐
│                    ENGINE DE AGENTES                        │
│                                                             │
│   Lead envia mensagem                                       │
│        ↓                                                    │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │   Sofia     │───→│  Especial.  │───→│  Especial.  │    │
│   │  (SDR Geral)│    │   Família   │    │ Alto Padrão │    │
│   │             │    │             │    │             │    │
│   │ • Acolhida  │    │ • Segurança │    │ • Luxo      │    │
│   │ • Qualifica │    │ • Escolas   │    │ • Exclusiv. │    │
│   │ • Descobre  │    │ • Lazer     │    │ • Investim. │    │
│   └─────────────┘    └─────────────┘    └─────────────┘    │
│                                                             │
│   Transição automática baseada em regras                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Por Que Multi-Agentes?

### Problema: Abordagem Única

Um único agente tentando atender todos os perfis:
- ❌ Fala de escolas para investidores
- ❌ Fala de luxo para famílias com orçamento apertado
- ❌ Tom genérico, sem personalização

### Solução: Especialistas

Cada agente é especialista em um perfil:
- ✅ **Sofia** → Descobre o perfil do lead
- ✅ **Especialista Família** → Foca no que importa para pais
- ✅ **Especialista Alto Padrão** → Fala a linguagem do luxo

---

## Os Agentes

### 1. Sofia — SDR de Elite (Agente Padrão)

**Função:** Primeiro contato e qualificação

**Quando atua:**
- Todo lead novo começa com Sofia
- Lead ainda não tem perfil definido
- Etapa: `inicio` ou `qualificacao`

**Personalidade:**
- Profissional mas próxima
- Empática e sutil
- Faz perguntas progressivas
- Usa negrito e emojis moderados

**Objetivos:**
1. Acolher o lead
2. Entender motivação de compra
3. Extrair dados financeiros e familiares
4. Qualificar para o corretor

**Prompt System:**
```
Você é Sofia, SDR de elite no mercado imobiliário brasileiro.
Sua missão é acolher o lead, entender sua motivação de compra,
extrair dados essenciais e encaminhar o lead qualificado.

ESTILO:
- Mensagens curtas (máx 2-3 parágrafos)
- Profissional mas próxima
- Use **negrito** para destaque
- Emojis moderados 🏠 💼 ✨

REGRAS:
- NUNCA invente dados de imóveis
- Só sugira imóveis da lista fornecida
- Objetivo final: agendamento
```

**Modelo:** `openai/gpt-4o-mini`

---

### 2. Especialista em Famílias

**Função:** Atender leads com filhos

**Quando atua:**
- `temFilhos === true`
- `quantosFilhos > 0`
- Perfil estimado: família

**Personalidade:**
- Empática e acolhedora
- Entende preocupações de pais
- Detalhista sobre segurança e infraestrutura

**Foco:**
- 🔒 Segurança do condomínio
- 🏫 Proximidade de escolas
- 🎠 Infraestrutura de lazer
- 🏠 Espaço e conforto
- 👶 Segurança para crianças

**Prompt System:**
```
Você é a Especialista em Famílias da LinkGRI.
Foi acionada porque o lead tem filhos.

FOCO:
- Segurança do condomínio
- Metragem maior
- Infraestrutura de lazer
- Proximidade de escolas
- Áreas comuns seguras

ABORDAGEM:
- Demonstre entender as preocupações de pais
- Pergunte sobre idade dos filhos
- Destaque aspectos familiares dos imóveis
```

**Modelo:** `openai/gpt-4o-mini`

---

### 3. Especialista em Alto Padrão

**Função:** Atender leads de alto poder aquisitivo

**Quando atua:**
- `perfilEstimado === 'AltoPadrao'`
- `orcamento > 1.000.000`
- Tipo: cobertura, flat

**Personalidade:**
- Elegante e refinado
- Discreto e confiante
- Conhecedor de arquitetura e design

**Foco:**
- 💎 Exclusividade
- 🏛️ Sofisticação e design
- 🥂 Lifestyle de alto nível
- 🌟 Serviços e conveniência
- 📈 Investimento inteligente

**Prompt System:**
```
Você é o Especialista em Alto Padrão da LinkGRI.
Foi acionado porque o lead demonstra perfil de luxo.

FOCO:
- Exclusividade e raridade
- Projetos de arquitetos renomados
- Acabamentos premium
- Serviços de concierge
- Potencial de valorização

ABORDAGEM:
- Elegante e refinado
- Discreto sobre privacidade
- Confiante sobre investimento
- Foque em exclusividade
```

**Modelo:** `anthropic/claude-3.5-sonnet`

> Por que Claude 3.5? Melhor em contexto longo e nuances sofisticadas.

---

## Grafo de Orquestração (LangGraph)

### Nós do Grafo

```
┌─────────────────────────────────────────────────────────────┐
│                      WORKFLOW                                │
│                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │ Extract │──→│ Update  │──→│ Select  │──→│ Generate│    │
│  │Entities │   │  State  │   │ Agent   │   │Response │    │
│  └─────────┘   └─────────┘   └─────────┘   └────┬────┘    │
│                                                  │         │
│                                             ┌────┴────┐    │
│                                             │  Send   │    │
│                                             │Response │    │
│                                             └─────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 1. Extract Entities

**Função:** Extrair informações da mensagem do lead

**Processo:**
```typescript
// Input: "tenho 2 filhos e quero um apartamento em Moema"
// Output:
{
  temFilhos: true,
  quantosFilhos: 2,
  tipoImovel: 'apartamento',
  regiaoInteresse: 'Moema'
}
```

**Modelo:** `openai/gpt-4o-mini` (temperatura 0)

---

### 2. Update State

**Função:** Atualizar estado do lead no banco

**Processo:**
```typescript
// 1. Atualizar campos do estado
lead.state.temFilhos = extracted.temFilhos
lead.state.tipoImovel = extracted.tipoImovel

// 2. Recalcular perfil
lead.state.perfilEstimado = calculateProfile(lead.state)

// 3. Recalcular score
lead.score = calculateScore(lead.state)

// 4. Verificar se pronto para corretor
if (lead.score >= 70) {
  lead.state.prontoParaCorretor = true
}

// 5. Salvar no MongoDB + Redis
```

---

### 3. Select Agent

**Função:** Escolher qual agente deve responder

**Regras de Prioridade:**

| Condição | Agente | Prioridade |
|----------|--------|------------|
| `temFilhos === true` | Especialista Família | 100 |
| `quantosFilhos > 0` | Especialista Família | 100 |
| `perfilEstimado === 'AltoPadrao'` | Especialista Alto Padrão | 100 |
| `orcamento > 1000000` | Especialista Alto Padrão | 90 |
| `tipoImovel === 'cobertura'` | Especialista Alto Padrão | 80 |
| Default | Sofia | 0 |

**Exemplo:**
```typescript
// Lead: Maria Silva
// temFilhos: true, perfilEstimado: 'MedioPadrao'

// Scores:
// Sofia: 10 (default)
// Família: 100 + 100 = 200
// Alto Padrão: 0

// Selecionado: Especialista Família
```

---

### 4. Generate Response

**Função:** Gerar resposta com o agente selecionado

**Processo:**
```typescript
// 1. Buscar config do agente
const agent = getAgentConfig('especialista_familia')

// 2. Buscar imóveis relevantes (RAG)
const properties = searchProperties(brokerId, lead.state)

// 3. Construir prompt
const prompt = `
  ${agent.systemPrompt}
  
  Contexto do lead: ${JSON.stringify(lead.state)}
  
  Imóveis disponíveis: ${JSON.stringify(properties)}
  
  Histórico: ${JSON.stringify(lastMessages)}
`

// 4. Gerar resposta
const response = await llm.generate(prompt)
```

---

### 5. Send Response

**Função:** Enviar resposta e notificar

**Processo:**
```typescript
// 1. Enviar para Telegram
await sendTelegramMessage(lead.telegramChatId, response)

// 2. Salvar mensagem no banco
await Message.create({...})

// 3. Notificar corretor via SSE
await notifyBroker(brokerId, {
  type: 'message_received',
  data: { leadId, content: response }
})

// 4. Se agente mudou, notificar
if (agentChanged) {
  await notifyBroker(brokerId, {
    type: 'agent_changed',
    data: { leadId, previousAgent, newAgent }
  })
}

// 5. Se lead pronto, notificar
if (lead.score >= 70) {
  await notifyBroker(brokerId, {
    type: 'lead_ready',
    data: { leadId, score: lead.score }
  })
}
```

---

## Transições de Agente

### Exemplo 1: Lead com Filhos

```
Lead: "Oi, estou procurando imóvel"
Sofia: "Olá! Para morar ou investir?"

Lead: "pra morar com minha família"
Sofia: "Que legal! Quantos filhos você tem?"

Lead: "tenho 2 filhos, de 5 e 8 anos"
[Extract: temFilhos=true, quantosFilhos=2]
[Update: score=45]
[Select: Especialista Família (score 200)]

Especialista Família: "Oi! Entendo perfeitamente! 
Com crianças pequenas, segurança é fundamental..."
```

### Exemplo 2: Lead de Alto Padrão

```
Lead: "quero uma cobertura de luxo"
Sofia: "Ótimo! Qual seria seu orçamento?"

Lead: "até 3 milhões"
[Extract: tipoImovel='cobertura', orcamento='3 milhões']
[Update: perfilEstimado='AltoPadrao', score=60]
[Select: Especialista Alto Padrão (score 180)]

Especialista Alto Padrão: "Bom dia. Entendo que busca 
algo verdadeiramente excepcional..."
```

---

## Scoring de Leads

### Regras de Pontuação

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

### Níveis de Qualificação

| Score | Nível | Ação |
|-------|-------|------|
| 0-20 | Muito Frio | Continuar qualificação |
| 20-40 | Frio | Explorar necessidades |
| 40-60 | Morno | Aprofundar interesse |
| 60-80 | Warm | Qualificado, acompanhar |
| 80-100 | Hot | Pronto para contato! |

### Auto-Qualificação

```typescript
if (score >= 70) {
  lead.state.prontoParaCorretor = true
  lead.state.etapa = 'agendamento'
  notifyBroker('lead_ready')
}
```

---

## RAG (Retrieval Augmented Generation)

### Busca de Imóveis

O agente só sugere imóveis do portfólio do corretor:

```typescript
// SEMPRE filtrar por brokerId
const properties = await Property.find({
  brokerId: lead.brokerId,  // Isolamento!
  active: true,
  // Filtros adicionais baseados no lead:
  ...(lead.state.tipoImovel && { type: lead.state.tipoImovel }),
  ...(lead.state.temFilhos && { bedrooms: { $gte: 2 } }),
})
```

### Personalização

- Lead com filhos → Sugere imóveis com playground, segurança
- Lead alto padrão → Sugere coberturas, projetos assinados
- Lead com orçamento → Filtra por faixa de preço

---

## Monitoramento

### Métricas por Agente

| Métrica | Descrição |
|---------|-----------|
| Conversas atendidas | Quantidade de interações |
| Taxa de qualificação | % de leads que avançam |
| Tempo médio de resposta | MS para gerar resposta |
| Satisfação do lead | Taxa de continuidade |

### Logs

```typescript
logger.info('Agent transition', {
  leadId: lead._id,
  from: 'sofia',
  to: 'especialista_familia',
  reason: 'temFilhos=true',
  score: lead.score
})
```

---

## Evolução Futura

### Novos Agentes Planejados

| Agente | Gatilho | Foco |
|--------|---------|------|
| Especialista Investidor | `motivacao === 'investimento'` | ROI, valorização |
| Especialista Primeiro Imóvel | `perfil === 'primeiro_imovel'` | Financiamento, documentação |
| Especialista Idosos | `idade > 60` | Acessibilidade, saúde |
| Especialista Pet | `temPets === true` | Pet-friendly, espaço |

### Melhorias

- [ ] Fine-tuning de modelos por agente
- [ ] Memória de longo prazo (conversas passadas)
- [ ] Feedback do corretor para ajustar prompts
- [ ] A/B testing entre versões de prompts

---

*Documento versionado. Última atualização: 24/05/2026*
