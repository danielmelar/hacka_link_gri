#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# CLAVIS — Script de Deploy Completo
# Uso: ./scripts/deploy.sh [--seed] [--no-cache]
#
#   --seed      Executa o seed do banco após subir os containers
#   --no-cache  Força rebuild sem cache do Docker
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

SEED=false
NO_CACHE=""

for arg in "$@"; do
  case $arg in
    --seed)    SEED=true ;;
    --no-cache) NO_CACHE="--no-cache" ;;
  esac
done

cd "$PROJECT_ROOT"

echo -e "${CYAN}"
echo "  ██████╗██╗      █████╗ ██╗   ██╗██╗███████╗"
echo " ██╔════╝██║     ██╔══██╗██║   ██║██║██╔════╝"
echo " ██║     ██║     ███████║██║   ██║██║███████╗"
echo " ██║     ██║     ██╔══██║╚██╗ ██╔╝██║╚════██║"
echo " ╚██████╗███████╗██║  ██║ ╚████╔╝ ██║███████║"
echo "  ╚═════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝"
echo -e "${NC}"
echo -e "${BLUE}CLAVIS — Deploy Docker${NC}"
echo ""

# ── Verificar .env ────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
  echo -e "   Execute: ${YELLOW}cp .env.example .env${NC} e preencha os valores."
  exit 1
fi

# Validar variáveis obrigatórias
source .env 2>/dev/null || true
MISSING=""
[ -z "$TELEGRAM_BOT_TOKEN" ]  && MISSING="$MISSING TELEGRAM_BOT_TOKEN"
[ -z "$OPENROUTER_API_KEY" ]  && MISSING="$MISSING OPENROUTER_API_KEY"
[ -z "$JWT_SECRET" ]          && MISSING="$MISSING JWT_SECRET"

if [ -n "$MISSING" ]; then
  echo -e "${RED}❌ Variáveis obrigatórias não definidas no .env:${NC}"
  for v in $MISSING; do echo "   - $v"; done
  exit 1
fi

echo -e "${GREEN}✅ .env válido${NC}"
echo -e "   PUBLIC_URL: ${YELLOW}${PUBLIC_URL:-http://localhost}${NC}"
echo ""

# ── Build e subida ────────────────────────────────────────────────────────────
echo -e "${BLUE}🔨 Buildando e subindo containers...${NC}"
docker compose up -d --build $NO_CACHE

echo ""
echo -e "${BLUE}⏳ Aguardando backend ficar saudável...${NC}"
ATTEMPTS=0
MAX_ATTEMPTS=30
until docker compose exec -T backend node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))" 2>/dev/null; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    echo -e "${RED}❌ Backend não respondeu após ${MAX_ATTEMPTS} tentativas.${NC}"
    echo "   Verifique os logs: docker compose logs backend"
    exit 1
  fi
  printf "."
  sleep 3
done
echo -e " ${GREEN}OK${NC}"

# ── Seed ──────────────────────────────────────────────────────────────────────
if [ "$SEED" = true ]; then
  echo ""
  echo -e "${BLUE}🌱 Executando seed do banco de dados...${NC}"
  docker compose exec -T backend node -e "
    const { execSync } = require('child_process');
    execSync('node dist/scripts/seed.js', { stdio: 'inherit' });
  " 2>/dev/null || \
  docker compose exec -T backend sh -c "cd /app && node -r ./dist/server.js 2>/dev/null || echo 'Seed manual: acesse o container'" || \
  echo -e "${YELLOW}⚠️  Seed automático falhou. Execute manualmente:${NC}"
  echo -e "   ${CYAN}docker compose exec backend npx tsx scripts/seed.ts${NC}"
fi

# ── Status final ──────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ CLAVIS está no ar!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 Dashboard:  ${CYAN}${PUBLIC_URL:-http://localhost}${NC}"
echo -e "  🔧 API Health: ${CYAN}${PUBLIC_URL:-http://localhost}/health${NC}"
echo -e "  🤖 Bot:        ${CYAN}https://t.me/${TELEGRAM_BOT_USERNAME:-clavisapp_bot}${NC}"
echo ""
echo -e "Comandos úteis:"
echo -e "  ${YELLOW}docker compose logs -f backend${NC}   → logs do backend"
echo -e "  ${YELLOW}docker compose logs -f frontend${NC}  → logs do frontend"
echo -e "  ${YELLOW}docker compose down${NC}              → parar tudo"
echo -e "  ${YELLOW}docker compose ps${NC}                → status dos containers"
echo ""
