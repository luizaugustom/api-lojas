#!/bin/bash

# ============================================
# Script de Instalação da Evolution API
# Para produção na Digital Ocean (sem Docker)
# ============================================

set -e

echo "🚀 Iniciando instalação da Evolution API..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório base
BASE_DIR="/opt/evolution-api"
EVOLUTION_DIR="$BASE_DIR/evolution-api"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Este script precisa ser executado como root${NC}"
    echo -e "${YELLOW}   Execute como root: bash scripts/install-evolution-api.sh${NC}"
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado. Instalando Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt update
    apt install -y nodejs
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js instalado: $NODE_VERSION${NC}"

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️ PM2 não está instalado. Instalando...${NC}"
    npm install -g pm2
fi

PM2_VERSION=$(pm2 -v)
echo -e "${GREEN}✅ PM2 instalado: $PM2_VERSION${NC}"

# Criar diretório base
echo -e "${YELLOW}📁 Criando diretório base...${NC}"
mkdir -p "$BASE_DIR"
cd "$BASE_DIR"

# Verificar se já existe instalação
if [ -d "$EVOLUTION_DIR" ]; then
    echo -e "${YELLOW}⚠️ Evolution API já está instalada em $EVOLUTION_DIR${NC}"
    read -p "Deseja reinstalar? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}🗑️ Removendo instalação anterior...${NC}"
        pm2 delete evolution-api 2>/dev/null || true
        rm -rf "$EVOLUTION_DIR"
    else
        echo -e "${GREEN}✅ Mantendo instalação existente${NC}"
        exit 0
    fi
fi

# Clonar repositório
echo -e "${YELLOW}📥 Clonando repositório da Evolution API...${NC}"
if [ -d "evolution-api" ]; then
    cd evolution-api
    git pull
else
    git clone https://github.com/EvolutionAPI/evolution-api.git
    cd evolution-api
fi

# Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm install

# Gerar chave API aleatória segura
API_KEY=$(openssl rand -hex 32)
echo -e "${GREEN}✅ Chave API gerada: $API_KEY${NC}"

# Criar arquivo .env
echo -e "${YELLOW}⚙️ Configurando variáveis de ambiente...${NC}"
cat > .env << EOF
# Evolution API Configuration
SERVER_URL=http://localhost:8080
PORT=8080

# Database
DATABASE_ENABLED=true
DATABASE_PROVIDER=sqlite
DATABASE_NAME=evolution

# Authentication
AUTHENTICATION_API_KEY=$API_KEY
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

# QR Code
QRCODE_LIMIT=30
QRCODE_COLOR=#198754

# Webhooks (opcional)
WEBHOOK_GLOBAL_URL=
WEBHOOK_GLOBAL_ENABLED=false

# Redis (opcional)
REDIS_ENABLED=false

# Logs
LOG_LEVEL=ERROR
LOG_COLOR=true
LOG_BAILEYS=error

# Performance
CONFIG_SESSION_PHONE_CLIENT=WHATSAPP-BAILEYS
CONFIG_SESSION_PHONE_NAME=Evolution API
EOF

echo -e "${GREEN}✅ Arquivo .env criado${NC}"

# Criar diretórios necessários
mkdir -p instances store logs

# Salvar chave API em arquivo para referência
echo "$API_KEY" > "$BASE_DIR/api-key.txt"
chmod 600 "$BASE_DIR/api-key.txt"
echo -e "${GREEN}✅ Chave API salva em $BASE_DIR/api-key.txt${NC}"

# Criar usuário para rodar a Evolution API (opcional, mas recomendado)
if ! id "evolution" &>/dev/null; then
    echo -e "${YELLOW}👤 Criando usuário 'evolution'...${NC}"
    useradd -r -s /bin/false -d "$EVOLUTION_DIR" evolution || true
    chown -R evolution:evolution "$EVOLUTION_DIR"
fi

echo -e "${GREEN}✅ Instalação concluída!${NC}"
echo ""
echo -e "${GREEN}📋 Informações importantes:${NC}"
echo -e "   Diretório: $EVOLUTION_DIR"
echo -e "   Porta: 8080"
echo -e "   Chave API: $API_KEY"
echo -e "   Chave salva em: $BASE_DIR/api-key.txt"
echo ""
echo -e "${YELLOW}⚠️ IMPORTANTE:${NC}"
echo -e "   1. Configure no .env do MontShop:"
echo -e "      EVOLUTION_API_URL=http://localhost:8080"
echo -e "      EVOLUTION_API_KEY=$API_KEY"
echo -e "      EVOLUTION_INSTANCE=montshop (ou o nome que você escolher)"
echo ""
echo -e "   2. Para iniciar a Evolution API, use o PM2:"
echo -e "      pm2 start ecosystem.config.js"
echo ""

