#!/bin/bash

# Script de setup completo para produção na Digital Ocean
# Configura API MontShop + Evolution API com PM2

set -e

echo "🚀 Configurando produção na Digital Ocean..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está rodando como root (não recomendado, mas verificar)
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Não execute este script como root. Use um usuário normal.${NC}"
   exit 1
fi

# Diretório atual (onde está a API)
API_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$API_DIR"

echo -e "${GREEN}📁 Diretório da API: $API_DIR${NC}"

# 1. Verificar Node.js
echo -e "\n${YELLOW}1. Verificando Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instalando...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✅ Node.js $(node -v) instalado${NC}"

# 2. Verificar PM2
echo -e "\n${YELLOW}2. Verificando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando PM2...${NC}"
    sudo npm install -g pm2
    echo -e "${GREEN}✅ PM2 instalado${NC}"
else
    echo -e "${GREEN}✅ PM2 já instalado${NC}"
fi

# 3. Instalar Evolution API
echo -e "\n${YELLOW}3. Instalando Evolution API...${NC}"
if [ -f "scripts/install-evolution-api.sh" ]; then
    chmod +x scripts/install-evolution-api.sh
    ./scripts/install-evolution-api.sh
else
    echo -e "${RED}❌ Script de instalação da Evolution API não encontrado${NC}"
    exit 1
fi

# 4. Ler API Key da Evolution API
EVOLUTION_DIR="$HOME/evolution-api"
if [ -f "$EVOLUTION_DIR/.env" ]; then
    EVOLUTION_API_KEY=$(grep "^AUTHENTICATION_API_KEY=" "$EVOLUTION_DIR/.env" | cut -d'=' -f2)
    echo -e "${GREEN}✅ API Key da Evolution API: $EVOLUTION_API_KEY${NC}"
else
    echo -e "${RED}❌ Arquivo .env da Evolution API não encontrado${NC}"
    exit 1
fi

# 5. Configurar .env da API
echo -e "\n${YELLOW}4. Configurando .env da API...${NC}"
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${GREEN}✅ Arquivo .env criado a partir de env.example${NC}"
    else
        echo -e "${RED}❌ Arquivo env.example não encontrado${NC}"
        exit 1
    fi
fi

# Atualizar variáveis da Evolution API no .env
if grep -q "^EVOLUTION_API_KEY=" .env; then
    sed -i "s|^EVOLUTION_API_KEY=.*|EVOLUTION_API_KEY=$EVOLUTION_API_KEY|" .env
else
    echo "" >> .env
    echo "# Evolution API" >> .env
    echo "EVOLUTION_API_KEY=$EVOLUTION_API_KEY" >> .env
fi

if grep -q "^EVOLUTION_API_URL=" .env; then
    sed -i "s|^EVOLUTION_API_URL=.*|EVOLUTION_API_URL=http://localhost:8080|" .env
else
    echo "EVOLUTION_API_URL=http://localhost:8080" >> .env
fi

if ! grep -q "^EVOLUTION_INSTANCE=" .env; then
    echo "EVOLUTION_INSTANCE=montshop" >> .env
    echo -e "${YELLOW}⚠️  Configure EVOLUTION_INSTANCE no .env com o nome da sua instância${NC}"
fi

echo -e "${GREEN}✅ Variáveis da Evolution API configuradas no .env${NC}"

# 6. Instalar dependências da API
echo -e "\n${YELLOW}5. Instalando dependências da API...${NC}"
npm install

# 7. Executar migrações
echo -e "\n${YELLOW}6. Executando migrações do banco de dados...${NC}"
npm run db:migrate:deploy || echo -e "${YELLOW}⚠️  Erro ao executar migrações. Verifique a conexão com o banco de dados.${NC}"

# 8. Build da aplicação
echo -e "\n${YELLOW}7. Fazendo build da aplicação...${NC}"
npm run build

# 9. Criar diretório de logs
echo -e "\n${YELLOW}8. Criando diretório de logs...${NC}"
mkdir -p logs

# 10. Configurar PM2
echo -e "\n${YELLOW}9. Configurando PM2...${NC}"

# Definir variável de ambiente para o PM2
export EVOLUTION_API_DIR="$EVOLUTION_DIR"

# Parar processos existentes se houver
pm2 delete all 2>/dev/null || true

# Iniciar aplicações
echo -e "${GREEN}🚀 Iniciando aplicações com PM2...${NC}"
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
echo -e "\n${YELLOW}10. Configurando PM2 para iniciar no boot...${NC}"
pm2 startup | tail -1 | sudo bash || echo -e "${YELLOW}⚠️  Execute o comando acima manualmente para configurar o startup${NC}"

# 11. Mostrar status
echo -e "\n${GREEN}✅ Setup concluído!${NC}"
echo -e "\n${YELLOW}📊 Status das aplicações:${NC}"
pm2 status

echo -e "\n${YELLOW}📋 Próximos passos:${NC}"
echo -e "   1. Configure EVOLUTION_INSTANCE no .env com o nome da sua instância"
echo -e "   2. Crie uma instância do WhatsApp na Evolution API:"
echo -e "      - Acesse: http://localhost:8080"
echo -e "      - Crie uma nova instância"
echo -e "      - Escaneie o QR Code com seu WhatsApp"
echo -e "   3. Verifique os logs:"
echo -e "      - API: pm2 logs api-lojas"
echo -e "      - Evolution API: pm2 logs evolution-api"
echo -e "   4. Verifique o status:"
echo -e "      - pm2 status"
echo -e "      - pm2 monit"

echo -e "\n${GREEN}🎉 Tudo configurado!${NC}"

