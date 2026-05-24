# Deploy no Render.com

## Visão Geral

O CLAVIS é deployado no Render como **3 serviços** a partir de um único repositório:

| Serviço | Tipo | Plano |
|---|---|---|
| `clavis-backend` | Web Service (Docker) | Starter (US$7/mês) |
| `clavis-frontend` | Web Service (Docker) | Starter (US$7/mês) |
| `clavis-redis` | Redis | Starter (25MB, US$3/mês) |

**MongoDB:** Use [MongoDB Atlas](https://cloud.mongodb.com) — tier gratuito M0 é suficiente para o MVP.

---

## Passo a Passo

### 1. Preparar o MongoDB Atlas

1. Acesse [cloud.mongodb.com](https://cloud.mongodb.com) → crie conta gratuita
2. Crie um cluster **M0 Free** na região US East (mais próxima do Render Oregon)
3. Em **Database Access** → crie um usuário com senha
4. Em **Network Access** → adicione `0.0.0.0/0` (permite o Render conectar)
5. Copie a **Connection String**: `mongodb+srv://usuario:senha@cluster.mongodb.net/linkgri`

### 2. Deploy via Blueprint (Recomendado)

1. Faça push do repositório no GitHub
2. No Render: **New** → **Blueprint**
3. Conecte o repositório → Render vai detectar o `render.yaml` automaticamente
4. Preencha as variáveis marcadas como **"sync: false"**:

| Variável | Onde obter |
|---|---|
| `MONGODB_URI` | Connection string do MongoDB Atlas (passo 1) |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `TELEGRAM_BOT_TOKEN` | @BotFather no Telegram |
| `VITE_API_URL` | URL do clavis-backend (copiar após primeiro deploy) |

5. Clique em **Apply** → aguarde o build (~5-10 min)

### 3. Pós-Deploy — Configurar VITE_API_URL

O `clavis-frontend` precisa saber a URL do backend. Após o primeiro deploy:

1. Copie a URL do `clavis-backend`: `https://clavis-backend.onrender.com`
2. No Render → `clavis-frontend` → **Environment** → adicione:
   ```
   VITE_API_URL = https://clavis-backend.onrender.com
   ```
3. Clique em **Save Changes** → o Render vai re-deployar automaticamente

> 💡 **Webhook do Telegram** é configurado automaticamente! O backend usa `RENDER_EXTERNAL_URL` (injetado pelo Render) para montar a URL do webhook.

---

## Estrutura de URLs após o Deploy

```
https://clavis-frontend.onrender.com    → Dashboard (frontend)
https://clavis-backend.onrender.com     → API
https://clavis-backend.onrender.com/health
https://clavis-backend.onrender.com/webhook/telegram  ← configurado automaticamente
```

---

## Comandos Úteis (Render Shell)

No Render, acesse o Shell de qualquer serviço em **clavis-backend** → **Shell**:

```bash
# Rodar seed inicial (criar corretor de teste)
node dist/server.js &  # já roda em produção, não precisa
npx tsx scripts/seed.ts

# Verificar webhook do Telegram
node -e "
const https = require('https');
const token = process.env.TELEGRAM_BOT_TOKEN;
https.get('https://api.telegram.org/bot' + token + '/getWebhookInfo', r => {
  let d = ''; r.on('data', c => d+=c);
  r.on('end', () => console.log(JSON.parse(d).result));
});
"
```

---

## Domínio Personalizado (Opcional)

1. No Render → `clavis-frontend` → **Custom Domains** → adicione seu domínio
2. Aponte o DNS do seu domínio para o Render (CNAME fornecido)
3. Atualize `VITE_API_URL` no frontend para a URL do backend
4. O HTTPS é automático (Render gerencia o certificado SSL)

---

## Monitoramento

- **Logs:** Render → serviço → **Logs** (tempo real)
- **Métricas:** Render → serviço → **Metrics**
- **Health:** `https://clavis-backend.onrender.com/health`

---

## Custos Estimados (MVP)

| Item | Custo/mês |
|---|---|
| clavis-backend (Starter) | US$ 7 |
| clavis-frontend (Starter) | US$ 7 |
| clavis-redis (Starter) | US$ 3 |
| MongoDB Atlas M0 | Gratuito |
| **Total** | **~US$ 17/mês** |

> Para desenvolvimento/demo, use o plano **Free** do Render (serviço dorme após 15min de inatividade).
