#!/bin/bash
# Script para iniciar o frontend do CLAVIS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/platform"

echo "🎨 Iniciando frontend CLAVIS..."
echo "📁 Diretório: $FRONTEND_DIR"

cd "$FRONTEND_DIR"

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    npm install
fi

echo "✅ Frontend iniciando em http://localhost:5173"
npm run dev
