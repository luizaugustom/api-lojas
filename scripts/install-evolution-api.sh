#!/bin/bash

# Script de instalação da Evolution API sem Docker
# Para produção na Digital Ocean

set -e

echo "🚀 Instalando Evolution API..."

# Diretório onde será instalada
EVOLUTION_DIR="$HOME/evolution-api"

# Verificar se já existe
if [ -d "$EVOLUTION_DIR" ]; then
    echo "⚠️  Diretório $EVOLUTION_DIR já existe. Deseja continuar? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        echo "❌ Instalação cancelada."
        exit 1
    fi
fi

# Criar diretório
mkdir -p "$EVOLUTION_DIR"
cd "$EVOLUTION_DIR"

# Clonar repositório
echo "📦 Clonando repositório da Evolution API..."
if [ -d ".git" ]; then
    echo "📥 Atualizando repositório existente..."
    git pull
else
    git clone https://github.com/EvolutionAPI/evolution-api.git .
fi

# Instalar dependências
echo "📥 Instalando dependências..."
npm install

# Criar arquivo .env
echo "⚙️  Configurando variáveis de ambiente..."
cat > .env << EOF
# Evolution API Configuration
SERVER_URL=http://localhost:8080
PORT=8080

# Database
DATABASE_ENABLED=true
DATABASE_PROVIDER=sqlite
DATABASE_NAME=evolution

# Authentication
# IMPORTANTE: Altere esta chave para uma chave forte e segura!
AUTHENTICATION_API_KEY=evolution-api-key-change-me
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# QR Code
QRCODE_LIMIT=30
QRCODE_COLOR=#198754

# Webhook (opcional)
WEBHOOK_GLOBAL_URL=
WEBHOOK_GLOBAL_ENABLED=false

# Redis (opcional)
REDIS_ENABLED=false

# Logs
LOG_LEVEL=ERROR
LOG_COLOR=true
LOG_BAILEYS=error
EOF

echo "✅ Evolution API instalada em: $EVOLUTION_DIR"
echo ""
echo "⚠️  IMPORTANTE:"
echo "1. Edite o arquivo $EVOLUTION_DIR/.env"
echo "2. Altere AUTHENTICATION_API_KEY para uma chave forte e segura"
echo "3. Configure a mesma chave no arquivo .env do projeto api-lojas como EVOLUTION_API_KEY"
echo ""
echo "Para iniciar, use: pm2 start ecosystem.config.js --only evolution-api"

