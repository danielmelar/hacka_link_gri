# Scripts de Desenvolvimento CLAVIS

## Scripts Individuais

### Backend
```bash
./scripts/dev-backend.sh
```
Inicia apenas o backend na porta 3000.

### Frontend
```bash
./scripts/dev-frontend.sh
```
Inicia apenas o frontend na porta 5173.

### ngrok (Webhook Telegram)
```bash
./scripts/dev-ngrok.sh
```
Inicia o túnel ngrok para receber webhooks do Telegram.

## Script Principal (Tudo em 1 comando)

### Iniciar tudo
```bash
./scripts/dev.sh
# ou
./scripts/dev.sh all
```

### Comandos disponíveis

| Comando | Descrição |
|---------|-----------|
| `all` | Inicia backend + frontend + ngrok (padrão) |
| `backend` | Apenas backend |
| `frontend` | Apenas frontend |
| `ngrok` | Apenas ngrok |
| `stop` | Para todos os serviços |
| `status` | Mostra status dos serviços |
| `help` | Mostra ajuda |

### Exemplos

```bash
# Iniciar tudo
./scripts/dev.sh

# Apenas backend
./scripts/dev.sh backend

# Apenas frontend
./scripts/dev.sh frontend

# Ver status
./scripts/dev.sh status

# Parar tudo
./scripts/dev.sh stop
```

## URLs após iniciar

- **Dashboard**: http://localhost:5173
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **ngrok Dashboard**: http://localhost:4040

## Requisitos

- Node.js 18+
- npm
- ngrok (para webhook do Telegram)
- MongoDB (local ou Docker)
- Redis (local ou Docker)
