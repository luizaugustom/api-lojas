#!/bin/bash

# ============================================
# Script de Setup Completo para Produção
# Versão sem sudo (executar como root)
# Digital Ocean - Instala tudo automaticamente
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Setup Automático - MontShop API + Evolution API     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Este script precisa ser executado como root${NC}"
    echo -e "${YELLOW}   Execute como root: bash scripts/setup-production-no-sudo.sh${NC}"
    echo -e "${YELLOW}   Ou faça login como root: su -${NC}"
    exit 1
fi

# Diretório atual
CURRENT_DIR=$(pwd)
API_DIR="$CURRENT_DIR"

echo -e "${GREEN}📁 Diretório da API: $API_DIR${NC}"

# ============================================
# 1. Atualizar sistema
# ============================================
echo ""
echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
apt update && apt upgrade -y

# ============================================
# 2. Instalar Node.js
# ============================================
echo ""
echo -e "${YELLOW}📦 Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}   Instalando Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}   ✅ Node.js já instalado: $NODE_VERSION${NC}"
fi

# ============================================
# 3. Instalar PM2
# ============================================
echo ""
echo -e "${YELLOW}📦 Verificando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}   Instalando PM2...${NC}"
    npm install -g pm2
else
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}   ✅ PM2 já instalado: $PM2_VERSION${NC}"
fi

# ============================================
# 4. Instalar dependências da API
# ============================================
echo ""
echo -e "${YELLOW}📦 Instalando dependências da API...${NC}"
cd "$API_DIR"
npm install --production

# ============================================
# 5. Build da API
# ============================================
echo ""
echo -e "${YELLOW}🔨 Fazendo build da API...${NC}"
npm run build

# ============================================
# 6. Criar diretório de logs
# ============================================
echo ""
echo -e "${YELLOW}📁 Criando diretório de logs...${NC}"
mkdir -p "$API_DIR/logs"

# ============================================
# 7. Instalar Evolution API
# ============================================
echo ""
echo -e "${YELLOW}📦 Instalando Evolution API...${NC}"
if [ -f "$API_DIR/scripts/install-evolution-api.sh" ]; then
    bash "$API_DIR/scripts/install-evolution-api.sh"
else
    echo -e "${RED}   ❌ Script de instalação da Evolution API não encontrado${NC}"
    exit 1
fi

# Ler chave API gerada
EVOLUTION_API_KEY=$(cat /opt/evolution-api/api-key.txt 2>/dev/null || echo "")

# ============================================
# 8. Configurar .env
# ============================================
echo ""
echo -e "${YELLOW}⚙️ Configurando arquivo .env...${NC}"

if [ ! -f "$API_DIR/.env" ]; then
    if [ -f "$API_DIR/env.example" ]; then
        cp "$API_DIR/env.example" "$API_DIR/.env"
        echo -e "${GREEN}   ✅ Arquivo .env criado a partir do env.example${NC}"
    else
        echo -e "${RED}   ❌ Arquivo env.example não encontrado${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}   ⚠️ Arquivo .env já existe. Verificando configurações...${NC}"
fi

# Atualizar variáveis da Evolution API no .env
if [ -n "$EVOLUTION_API_KEY" ]; then
    # Adicionar seção de comentário se não existir
    if ! grep -q "# Evolution API" "$API_DIR/.env"; then
        echo "" >> "$API_DIR/.env"
        echo "# Evolution API (configurado automaticamente)" >> "$API_DIR/.env"
    fi
    
    # Atualizar ou adicionar EVOLUTION_API_KEY
    if grep -q "^EVOLUTION_API_KEY=" "$API_DIR/.env"; then
        sed -i "s|^EVOLUTION_API_KEY=.*|EVOLUTION_API_KEY=$EVOLUTION_API_KEY|" "$API_DIR/.env"
        echo -e "${GREEN}   ✅ EVOLUTION_API_KEY atualizada no .env${NC}"
    else
        echo "EVOLUTION_API_KEY=$EVOLUTION_API_KEY" >> "$API_DIR/.env"
        echo -e "${GREEN}   ✅ EVOLUTION_API_KEY adicionada ao .env${NC}"
    fi
    
    # Atualizar ou adicionar EVOLUTION_API_URL
    if grep -q "^EVOLUTION_API_URL=" "$API_DIR/.env"; then
        sed -i "s|^EVOLUTION_API_URL=.*|EVOLUTION_API_URL=http://localhost:8080|" "$API_DIR/.env"
        echo -e "${GREEN}   ✅ EVOLUTION_API_URL atualizada no .env${NC}"
    else
        echo "EVOLUTION_API_URL=http://localhost:8080" >> "$API_DIR/.env"
        echo -e "${GREEN}   ✅ EVOLUTION_API_URL adicionada ao .env${NC}"
    fi
    
    # Atualizar ou adicionar EVOLUTION_INSTANCE (só se não existir)
    if ! grep -q "^EVOLUTION_INSTANCE=" "$API_DIR/.env"; then
        echo "EVOLUTION_INSTANCE=montshop" >> "$API_DIR/.env"
        echo -e "${GREEN}   ✅ EVOLUTION_INSTANCE adicionada ao .env (padrão: montshop)${NC}"
    else
        echo -e "${YELLOW}   ⚠️ EVOLUTION_INSTANCE já existe. Mantendo valor atual.${NC}"
    fi
fi

# ============================================
# 9. Executar migrações do banco
# ============================================
echo ""
echo -e "${YELLOW}🗄️ Executando migrações do banco de dados...${NC}"
read -p "   Deseja executar as migrações agora? (S/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    npm run db:migrate:deploy || echo -e "${YELLOW}   ⚠️ Erro ao executar migrações. Execute manualmente depois.${NC}"
fi

# ============================================
# 10. Iniciar aplicações com PM2
# ============================================
echo ""
echo -e "${YELLOW}🚀 Iniciando aplicações com PM2...${NC}"

# Parar aplicações existentes
pm2 delete all 2>/dev/null || true

# Iniciar com ecosystem.config.js
if [ -f "$API_DIR/ecosystem.config.js" ]; then
    cd "$API_DIR"
    pm2 start ecosystem.config.js
    echo -e "${GREEN}   ✅ Aplicações iniciadas${NC}"
else
    echo -e "${RED}   ❌ Arquivo ecosystem.config.js não encontrado${NC}"
    exit 1
fi

# ============================================
# 11. Salvar configuração do PM2
# ============================================
echo ""
echo -e "${YELLOW}💾 Salvando configuração do PM2...${NC}"
pm2 save

# ============================================
# 12. Configurar PM2 para iniciar no boot
# ============================================
echo ""
echo -e "${YELLOW}⚙️ Configurando PM2 para iniciar no boot...${NC}"
pm2 startup | grep -v "PM2" | bash || true

# ============================================
# 13. Mostrar status
# ============================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✅ Setup Concluído com Sucesso!          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 Status das aplicações:${NC}"
pm2 status
echo ""
echo -e "${BLUE}📋 Informações importantes:${NC}"
echo -e "   ${GREEN}API MontShop:${NC} http://localhost:3000"
echo -e "   ${GREEN}Evolution API:${NC} http://localhost:8080"
if [ -n "$EVOLUTION_API_KEY" ]; then
    echo -e "   ${GREEN}Evolution API Key:${NC} $EVOLUTION_API_KEY"
    echo -e "   ${YELLOW}   (Salva em: /opt/evolution-api/api-key.txt)${NC}"
fi
echo ""
echo -e "${BLUE}📝 Próximos passos:${NC}"
echo -e "   1. Configure o arquivo .env com suas credenciais"
echo -e "   2. Acesse http://localhost:8080 para criar uma instância do WhatsApp"
echo -e "   3. Escaneie o QR Code com seu WhatsApp"
echo -e "   4. Configure EVOLUTION_INSTANCE no .env com o nome da instância criada"
echo -e "   5. Reinicie a API: ${YELLOW}pm2 restart api-lojas${NC}"
echo ""
echo -e "${BLUE}🔧 Comandos úteis:${NC}"
echo -e "   Ver logs: ${YELLOW}pm2 logs${NC}"
echo -e "   Status: ${YELLOW}pm2 status${NC}"
echo -e "   Reiniciar: ${YELLOW}pm2 restart all${NC}"
echo -e "   Parar: ${YELLOW}pm2 stop all${NC}"
echo ""

