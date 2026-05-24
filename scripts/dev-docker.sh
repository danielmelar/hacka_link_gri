#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# CLAVIS — Sobe todo o projeto em Docker + ngrok
#
# Uso:
#   ./scripts/dev-docker.sh           # sobe tudo
#   ./scripts/dev-docker.sh --build   # força rebuild dos containers
#   ./scripts/dev-docker.sh --stop    # para tudo
#   ./scripts/dev-docker.sh --logs    # mostra logs ao vivo
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

BUILD_FLAG=""
ACTION="up"

for arg in "$@"; do
  case $arg in
    --build)  BUILD_FLAG="--build" ;;
    --stop)   ACTION="stop" ;;
    --logs)   ACTION="logs" ;;
    --down)   ACTION="down" ;;
  esac
done

cd "$PROJECT_ROOT"

# ── Parar tudo ────────────────────────────────────────────────────────────────
if [ "$ACTION" = "stop" ] || [ "$ACTION" = "down" ]; then
  echo -e "${YELLOW}🛑 Parando todos os containers CLAVIS...${NC}"
  docker compose down
  pkill -f "ngrok http" 2>/dev/null || true
  echo -e "${GREEN}✅ Tudo parado.${NC}"
  exit 0
fi

# ── Logs ──────────────────────────────────────────────────────────────────────
if [ "$ACTION" = "logs" ]; then
  docker compose logs -f --tail=50
  exit 0
fi

# ── Verificar dependências ────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo -e "${RED}❌ Docker não encontrado. Instale em: https://docs.docker.com/get-docker/${NC}"
  exit 1
fi

if ! command -v ngrok &>/dev/null; then
  echo -e "${RED}❌ ngrok não encontrado. Instale com:${NC}"
  echo "   brew install ngrok"
  echo "   ou: https://ngrok.com/download"
  exit 1
fi

# ── Verificar .env do backend ─────────────────────────────────────────────────
if [ ! -f "backend/.env" ]; then
  echo -e "${RED}❌ backend/.env não encontrado!${NC}"
  echo -e "   Crie o arquivo com as variáveis necessárias."
  exit 1
fi

echo -e "${CYAN}"
echo "  ██████╗██╗      █████╗ ██╗   ██╗██╗███████╗"
echo " ██╔════╝██║     ██╔══██╗██║   ██║██║██╔════╝"
echo " ██║     ██║     ███████║██║   ██║██║███████╗"
echo " ╚██████╗███████╗██║  ██║ ╚████╔╝ ██║███████║"
echo -e "${NC}"
echo -e "${BLUE}CLAVIS — Docker + ngrok${NC}"
echo ""

# ── Verificar se ngrok já está rodando ───────────────────────────────────────
NGROK_URL=""
if pgrep -f "ngrok http" > /dev/null 2>&1; then
  echo -e "${YELLOW}⚡ ngrok já está rodando. Obtendo URL...${NC}"
  NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | \
    python3 -c "import sys,json; t=json.load(sys.stdin).get('tunnels',[]); print(next((x['public_url'] for x in t if x['public_url'].startswith('https')), ''))" 2>/dev/null)
fi

# Se não tem URL do ngrok, inicia o ngrok apontando para porta 80 (nginx)
if [ -z "$NGROK_URL" ]; then
  echo -e "${BLUE}🔗 Iniciando ngrok na porta 80...${NC}"
  pkill -f "ngrok http" 2>/dev/null || true
  sleep 1
  nohup ngrok http 80 --log=stdout > /tmp/clavis-ngrok.log 2>&1 &
  echo -e "⏳ Aguardando ngrok iniciar..."
  for i in $(seq 1 15); do
    sleep 1
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | \
      python3 -c "import sys,json; t=json.load(sys.stdin).get('tunnels',[]); print(next((x['public_url'] for x in t if x['public_url'].startswith('https')), ''))" 2>/dev/null)
    [ -n "$NGROK_URL" ] && break
    printf "."
  done
  echo ""
fi

if [ -z "$NGROK_URL" ]; then
  echo -e "${RED}❌ Falha ao obter URL do ngrok. Verifique se o ngrok está autenticado:${NC}"
  echo "   ngrok config add-authtoken SEU_TOKEN"
  exit 1
fi

echo -e "${GREEN}🌐 URL pública: ${CYAN}$NGROK_URL${NC}"

# ── Atualizar TELEGRAM_WEBHOOK_URL no backend/.env ───────────────────────────
WEBHOOK_URL="$NGROK_URL/webhook/telegram"
if grep -q "TELEGRAM_WEBHOOK_URL=" backend/.env; then
  # Substitui a linha existente
  sed -i.bak "s|TELEGRAM_WEBHOOK_URL=.*|TELEGRAM_WEBHOOK_URL=$WEBHOOK_URL|" backend/.env
  rm -f backend/.env.bak
else
  echo "TELEGRAM_WEBHOOK_URL=$WEBHOOK_URL" >> backend/.env
fi
echo -e "${GREEN}✅ Webhook atualizado: ${CYAN}$WEBHOOK_URL${NC}"

# ── Subir Docker Compose ──────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}🐳 Subindo containers...${NC}"
PUBLIC_URL="$NGROK_URL" docker compose up -d $BUILD_FLAG

# ── Aguardar backend ficar saudável ──────────────────────────────────────────
echo ""
echo -e "${BLUE}⏳ Aguardando serviços ficarem saudáveis...${NC}"
ATTEMPTS=0
until docker compose exec -T backend node -e \
  "require('http').get('http://localhost:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" \
  2>/dev/null; do
  ATTEMPTS=$((ATTEMPTS+1))
  [ $ATTEMPTS -ge 40 ] && echo -e "${RED}❌ Timeout.${NC}" && docker compose logs backend | tail -20 && exit 1
  printf "."
  sleep 3
done
echo -e " ${GREEN}OK${NC}"

# ── Configurar webhook do Telegram ───────────────────────────────────────────
echo ""
echo -e "${BLUE}🤖 Configurando webhook do Telegram...${NC}"
docker compose exec -T backend node -e "
const https = require('https');
const token = process.env.TELEGRAM_BOT_TOKEN;
const url = '$WEBHOOK_URL';
const data = JSON.stringify({ url });
const req = https.request('https://api.telegram.org/bot' + token + '/setWebhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    const r = JSON.parse(body);
    console.log(r.ok ? '✅ Webhook configurado!' : '❌ Erro: ' + r.description);
  });
});
req.write(data);
req.end();
" 2>/dev/null || echo -e "${YELLOW}⚠️  Configure o webhook manualmente se necessário${NC}"

# ── Status final ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ CLAVIS está no ar e acessível publicamente!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 Dashboard: ${CYAN}$NGROK_URL${NC}"
echo -e "  🔧 API Health: ${CYAN}$NGROK_URL/health${NC}"
echo -e "  🤖 Webhook:   ${CYAN}$WEBHOOK_URL${NC}"
echo -e "  📱 Bot:       ${CYAN}https://t.me/$(grep TELEGRAM_BOT_USERNAME backend/.env | cut -d'=' -f2 | tr -d ' ')${NC}"
echo ""
echo -e "  🖥️  Local (sem ngrok):"
echo -e "  Dashboard: ${CYAN}http://localhost${NC}"
echo -e "  API:       ${CYAN}http://localhost/api${NC}"
echo ""
echo -e "Comandos úteis:"
echo -e "  ${YELLOW}./scripts/dev-docker.sh --logs${NC}   → ver logs ao vivo"
echo -e "  ${YELLOW}./scripts/dev-docker.sh --stop${NC}   → parar tudo"
echo -e "  ${YELLOW}docker compose ps${NC}                → status dos containers"
echo -e "  ${YELLOW}docker compose logs -f backend${NC}   → logs do backend"
echo ""
