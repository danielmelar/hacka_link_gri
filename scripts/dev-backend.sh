#!/bin/bash
# Script para iniciar o backend do CLAVIS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🚀 Iniciando backend CLAVIS..."
echo "📁 Diretório: $BACKEND_DIR"

cd "$BACKEND_DIR"

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências do backend..."
    npm install
fi

echo "✅ Backend iniciando em http://localhost:3000"
npm run dev
