# Contexto do Projeto - LinkGRI

## Origem

A LinkGRI nasceu da observação de um problema recorrente no mercado imobiliário brasileiro: **corretores experientes perdem horas qualificando leads que muitas vezes não têm intenção real de compra**.

### O Cenário

Corretores que investem em tráfego pago (Facebook Ads, Google Ads) geram dezenas de leads por dia. Porém:
- 60-70% são "curiosos" ou não têm perfil compatível
- O atendimento inicial é manual e demorado
- Leads esfriam quando não são respondidos em minutos
- O corretor chega na reunião sem contexto sobre o cliente

### A Oportunidade

Com a democratização dos LLMs (Large Language Models) em 2023-2024, tornou-se viável criar agentes de IA que:
- Conversem de forma natural e empática
- Extraiam informações estruturadas de conversas livres
- Personalizem o atendimento em tempo real
- Trabalhem 24/7 sem custo adicional

---

## Por Que "LinkGRI"?

**Link** = Conexão entre corretor e lead
**GRI** = Global Real Estate (referência ao mercado imobiliário global)

A missão é **conectar corretores aos leads certos, no momento certo, com o contexto certo**.

---

## O Que é a API

A API LinkGRI é o **cérebro da plataforma**. Ela:

1. **Recebe mensagens** do Telegram via webhook
2. **Processa conversas** através de agentes de IA
3. **Gerencia dados** de corretores, leads, imóveis e mensagens
4. **Notifica em tempo real** via Server-Sent Events
5. **Fornece endpoints** para o dashboard do corretor

### Públicos da API

| Público | Uso |
|---------|-----|
| **Leads** | Interagem via Telegram (indiretamente) |
| **Corretores** | Acessam dashboard e recebem notificações |
| **Telegram** | Envia webhooks com mensagens |
| **Futuro: Integradores** | API pública para CRMs externos |

---

## Por Que Foi Criada

### Problema Específico

> "Eu gasto R$ 5.000/mês em tráfego pago e recebo 100 leads. Passo 3 horas por dia respondendo 'oi' e 'quanto custa'. Quando finalmente sento com um lead qualificado, não sei nada sobre ele além do nome."
> — Corretor de imóveis, São Paulo

### Solução Proposta

1. **SDR de IA 24/7** (Sofia) atende todos os leads instantaneamente
2. **Qualificação automática** extrai perfil, orçamento, urgência
3. **Agentes especializados** adaptam o tom e foco da conversa
4. **Dossiê completo** entregue ao corretor antes da reunião
5. **Notificações em tempo real** quando um lead está pronto

### Resultado Esperado

| Antes | Depois |
|-------|--------|
| 3h/dia respondendo leads | 30min revisando dossies |
| 30% de leads qualificados | 70% de leads qualificados |
| Reuniões sem contexto | Reuniões com perfil completo |
| Leads esfriando | Resposta em < 30 segundos |

---

## Diferenciais da Abordagem

### 1. Multi-Agentes Dinâmicos

Não é um chatbot com roteiro fixo. É um **sistema de agentes especializados** que se alternam conforme o perfil do lead:

- Lead com filhos → Especialista em Famílias
- Lead com orçamento alto → Especialista em Alto Padrão
- Lead no início → Sofia (SDR Geral)

### 2. RAG com Portfólio Real

O agente só sugere imóveis que **realmente existem** no portfólio do corretor. Não inventa dados.

### 3. Deep Linking Multi-Tenant

Um único bot serve **N corretores** com isolamento completo de dados. Cada corretor tem seu link exclusivo.

### 4. Notificações em Tempo Real

O corretor recebe alertas instantâneos quando:
- Novo lead entra
- Lead muda de perfil
- Lead atinge score de qualificação
- Nova mensagem chega

---

## Mercado-Alvo

### Segmento Primário
**Corretores independentes** que:
- Faturam R$ 50k-500k/ano em comissões
- Investem em marketing digital
- Atuam em nichos (alto padrão, famílias, investidores)
- Valorizam tempo e eficiência

### Segmento Secundário
**Imobiliárias pequenas/médias** que:
- Têm 5-20 corretores
- Querem padronizar o atendimento inicial
- Precisam de métricas de qualificação

### Segmento Terciário (Futuro)
**Incorporadoras** que:
- Lançam empreendimentos regularmente
- Precisam qualificar milhares de leads
- Querem integração com sistemas existentes

---

## Modelo de Monetização

### Fase 1: MVP (Gratuito)
- Uso gratuito para 10 corretores beta
- Coleta de feedback intensivo
- Ajuste de produto

### Fase 2: SaaS
- Plano Pro: R$ 197/mês por corretor
- Plano Enterprise: sob consulta
- Comissão sobre leads qualificados (futuro)

### Fase 3: Plataforma
- Marketplace de corretores
- Integrações pagas
- API pública

---

## Métricas de Negócio

### North Star Metric
**Leads qualificados por corretor por mês**

### Métricas de Input
- Leads atendidos pela IA
- Taxa de qualificação (score >= 50)
- Tempo médio de resposta
- Satisfação do corretor (NPS)

### Métricas de Output
- Leads entregues ao corretor
- Taxa de conversão (lead → visita)
- Taxa de conversão (visita → venda)
- Receita gerada para o corretor

---

## Concorrência

### Direta
- **Chatbots de imobiliárias** (geralmente rígidos e pouco inteligentes)
- **CRMs com automação** (HubSpot, Pipedrive - não têm IA nativa)

### Indireta
- **Assistentes virtuais genéricos** (não entendem de imóveis)
- **Portais de imóveis** (captam leads mas não qualificam)

### Vantagem Competitiva
A LinkGRI é a **única solução** que combina:
- IA conversacional avançada (multi-agente)
- Qualificação contextual (não formulários)
- Integração com portfólio real (RAG)
- Multi-tenancy via Telegram (sem instalação)

---

## Visão de Longo Prazo

> "Tornar-se o padrão de qualificação de leads imobiliários no Brasil, expandindo para outros mercados da América Latina e eventualmente globalmente."

### 3 Anos
- 1.000 corretores ativos
- R$ 1M ARR
- Presença em 5 estados brasileiros

### 5 Anos
- 10.000 corretores
- R$ 10M ARR
- Expansão para México e Colômbia
- API white-label para grandes imobiliárias

---

*Documento versionado. Última atualização: 24/05/2026*
