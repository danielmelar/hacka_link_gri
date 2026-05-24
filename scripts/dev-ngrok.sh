#!/bin/bash
# Script para iniciar o ngrok (webhook do Telegram)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔗 Iniciando ngrok para webhook do Telegram..."
echo "   Encaminhando porta 3000 → URL pública"

# Verificar se ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok não encontrado!"
    echo "   Instale com: brew install ngrok"
    exit 1
fi

# Verificar se já existe ngrok rodando
if pgrep -f "ngrok http 3000" > /dev/null; then
    echo "⚠️  ngrok já está rodando!"
    echo "   URL atual:"
    curl -s http://localhost:4040/api/tunnels | python3 -c "import sys,json; t=json.load(sys.stdin)['tunnels']; print('   ' + t[0]['public_url'] if t else '   Não encontrado')" 2>/dev/null || echo "   (não foi possível obter URL)"
    exit 0
fi

echo "✅ ngrok iniciando..."
echo "   Dashboard local: http://localhost:4040"
ngrok http 3000 --log=stdout
