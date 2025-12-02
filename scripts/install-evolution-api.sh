#!/bin/bash

# Script de instalação da Evolution API sem Docker
# Para uso em produção na Digital Ocean

set -e

echo "🚀 Instalando Evolution API..."

# Diretório onde a Evolution API será instalada
EVOLUTION_DIR="$HOME/evolution-api"
EVOLUTION_API_KEY="${EVOLUTION_API_KEY:-EvoAPI-$(date +%s)-$(openssl rand -hex 8)}"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instalando Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verificar versão do Node.js (precisa ser 18+)
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessário. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) instalado"

# Criar diretório se não existir
mkdir -p "$EVOLUTION_DIR"
cd "$EVOLUTION_DIR"

# Verificar se já está instalado
if [ -d ".git" ]; then
    echo "📦 Evolution API já instalada. Atualizando..."
    git pull origin main
else
    echo "📦 Clonando Evolution API..."
    git clone https://github.com/EvolutionAPI/evolution-api.git .
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
# Evolution API Configuration
SERVER_URL=http://localhost:8080
PORT=8080

# Database
DATABASE_ENABLED=true
DATABASE_PROVIDER=sqlite
DATABASE_NAME=evolution

# Authentication
AUTHENTICATION_API_KEY=$EVOLUTION_API_KEY
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# QR Code
QRCODE_LIMIT=30
QRCODE_COLOR=#198754

# Logs
LOG_LEVEL=ERROR
LOG_COLOR=true
LOG_BAILEYS=error

# Webhook (opcional)
WEBHOOK_GLOBAL_URL=
WEBHOOK_GLOBAL_ENABLED=false

# Redis (opcional)
REDIS_ENABLED=false
EOF
    echo "✅ Arquivo .env criado com API Key: $EVOLUTION_API_KEY"
    echo "⚠️  IMPORTANTE: Anote esta API Key para usar no .env da API MontShop!"
else
    echo "✅ Arquivo .env já existe"
    # Extrair API Key do .env existente
    EVOLUTION_API_KEY=$(grep "^AUTHENTICATION_API_KEY=" .env | cut -d'=' -f2)
    echo "📋 API Key atual: $EVOLUTION_API_KEY"
fi

# Criar diretórios necessários
mkdir -p instances store logs

echo "✅ Evolution API instalada com sucesso!"
echo ""
echo "📋 Informações importantes:"
echo "   - Diretório: $EVOLUTION_DIR"
echo "   - API Key: $EVOLUTION_API_KEY"
echo "   - Porta: 8080"
echo ""
echo "🔧 Próximos passos:"
echo "   1. Configure a API Key no .env da API MontShop:"
echo "      EVOLUTION_API_KEY=$EVOLUTION_API_KEY"
echo "   2. Crie uma instância do WhatsApp na Evolution API"
echo "   3. Configure o PM2 para iniciar automaticamente"

