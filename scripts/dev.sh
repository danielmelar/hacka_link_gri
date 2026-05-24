#!/bin/bash
# Script principal para iniciar todo o projeto CLAVIS
# Uso: ./scripts/dev.sh [backend|frontend|ngrok|all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${BLUE}CLAVIS - Script de Desenvolvimento${NC}"
    echo ""
    echo "Uso: ./scripts/dev.sh [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  backend   - Inicia apenas o backend (porta 3000)"
    echo "  frontend  - Inicia apenas o frontend (porta 5173)"
    echo "  ngrok     - Inicia apenas o ngrok (webhook Telegram)"
    echo "  all       - Inicia backend, frontend e ngrok (padrão)"
    echo "  stop      - Para todos os processos do projeto"
    echo "  status    - Mostra status dos serviços"
    echo "  logs      - Mostra logs em tempo real (requer tmux)"
    echo ""
    echo "Exemplos:"
    echo "  ./scripts/dev.sh           # Inicia tudo"
    echo "  ./scripts/dev.sh backend   # Apenas backend"
    echo "  ./scripts/dev.sh stop      # Para tudo"
}

start_backend() {
    echo -e "${GREEN}🚀 Iniciando backend...${NC}"
    cd "$PROJECT_ROOT/backend"
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
        npm install
    fi
    
    # Verificar se .env existe
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  Arquivo .env não encontrado em backend/${NC}"
        echo "   Crie a partir do .env.example"
    fi
    
    npm run dev &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/clavis-backend.pid
    echo -e "${GREEN}✅ Backend iniciado (PID: $BACKEND_PID)${NC}"
    sleep 2
}

start_frontend() {
    echo -e "${GREEN}🎨 Iniciando frontend (new-front)...${NC}"
    cd "$PROJECT_ROOT/new-front/lead-whisperer-190"
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Instalando dependências do frontend...${NC}"
        npm install
    fi
    
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/clavis-frontend.pid
    echo -e "${GREEN}✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
    sleep 2
}

start_ngrok() {
    echo -e "${GREEN}🔗 Iniciando ngrok...${NC}"
    
    if ! command -v ngrok &> /dev/null; then
        echo -e "${RED}❌ ngrok não encontrado!${NC}"
        echo "   Instale com: brew install ngrok"
        echo "   Ou acesse: https://ngrok.com/download"
        return 1
    fi
    
    # Verificar se já existe ngrok rodando
    if pgrep -f "ngrok http 3000" > /dev/null; then
        echo -e "${YELLOW}⚠️  ngrok já está rodando!${NC}"
        show_ngrok_url
        return 0
    fi
    
    ngrok http 3000 --log=stdout > /tmp/ngrok.log 2>&1 &
    NGROK_PID=$!
    echo $NGROK_PID > /tmp/clavis-ngrok.pid
    echo -e "${GREEN}✅ ngrok iniciado (PID: $NGROK_PID)${NC}"
    
    # Aguardar ngrok iniciar
    sleep 3
    show_ngrok_url
    
    # Atualizar webhook do Telegram
    echo -e "${BLUE}🔄 Atualizando webhook do Telegram...${NC}"
    cd "$PROJECT_ROOT/backend"
    npx tsx scripts/setup-webhook.ts 2>/dev/null || echo -e "${YELLOW}⚠️  Não foi possível atualizar webhook automaticamente${NC}"
}

show_ngrok_url() {
    local url=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json; t=json.load(sys.stdin)['tunnels']; print(t[0]['public_url'] if t else '')" 2>/dev/null)
    if [ -n "$url" ]; then
        echo -e "${GREEN}🌐 URL pública: $url${NC}"
        echo -e "${GREEN}📱 Webhook Telegram: $url/webhook/telegram${NC}"
    fi
}

stop_all() {
    echo -e "${YELLOW}🛑 Parando todos os serviços CLAVIS...${NC}"
    
    # Parar pelo PID
    for pid_file in /tmp/clavis-*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            if kill -0 "$pid" 2>/dev/null; then
                echo "   Parando processo $pid..."
                kill "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
        fi
    done
    
    # Parar processos conhecidos
    pkill -f "tsx watch src/server.ts" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "ngrok http 3000" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Todos os serviços parados${NC}"
}

show_status() {
    echo -e "${BLUE}📊 Status dos Serviços CLAVIS${NC}"
    echo ""
    
    # Backend
    if lsof -i :3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend: Rodando em http://localhost:3000${NC}"
    else
        echo -e "${RED}❌ Backend: Parado${NC}"
    fi
    
    # Frontend
    if lsof -i :5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend: Rodando em http://localhost:5173${NC}"
    else
        echo -e "${RED}❌ Frontend: Parado${NC}"
    fi
    
    # ngrok
    if pgrep -f "ngrok http 3000" > /dev/null; then
        echo -e "${GREEN}✅ ngrok: Rodando${NC}"
        show_ngrok_url
    else
        echo -e "${RED}❌ ngrok: Parado${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🔗 URLs:${NC}"
    echo "   Dashboard: http://localhost:5173"
    echo "   API: http://localhost:3000"
    echo "   Health: http://localhost:3000/health"
}

start_all() {
    echo -e "${BLUE}🚀 Iniciando CLAVIS completo...${NC}"
    echo ""
    
    # Verificar dependências
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js não encontrado!${NC}"
        exit 1
    fi
    
    # Iniciar serviços
    start_backend
    start_frontend
    start_ngrok
    
    echo ""
    echo -e "${GREEN}🎉 CLAVIS iniciado com sucesso!${NC}"
    echo ""
    echo -e "${BLUE}📱 Acesse:${NC}"
    echo "   Dashboard: http://localhost:5173"
    echo "   API: http://localhost:3000"
    echo "   ngrok Dashboard: http://localhost:4040"
    echo ""
    echo -e "${YELLOW}⚠️  Para parar todos os serviços, execute:${NC}"
    echo "   ./scripts/dev.sh stop"
    echo ""
    
    # Manter script rodando
    wait
}

# Main
case "${1:-all}" in
    backend)
        start_backend
        wait
        ;;
    frontend)
        start_frontend
        wait
        ;;
    ngrok)
        start_ngrok
        wait
        ;;
    all)
        start_all
        ;;
    stop)
        stop_all
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando desconhecido: $1${NC}"
        show_help
        exit 1
        ;;
esac
