#!/bin/bash

# Script completo de setup para produção
# Instala e configura tudo automaticamente para iniciar no boot

set -e

echo "🚀 Configurando produção completa..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está rodando como root (não recomendado)
if [ "$EUID" -eq 0 ]; then 
    print_warning "Não é recomendado rodar este script como root"
    print_warning "Use um usuário com permissões sudo"
fi

# 1. Instalar PM2
echo "📦 Passo 1/5: Instalando PM2..."
if command -v pm2 &> /dev/null; then
    print_success "PM2 já está instalado"
else
    if [ -f "scripts/install-pm2.sh" ]; then
        chmod +x scripts/install-pm2.sh
        ./scripts/install-pm2.sh
    else
        print_warning "Script install-pm2.sh não encontrado, instalando manualmente..."
        sudo npm install -g pm2
        sudo pm2 startup
    fi
    print_success "PM2 instalado"
fi

# 2. Instalar Evolution API
echo ""
echo "📦 Passo 2/5: Instalando Evolution API..."
EVOLUTION_DIR="$HOME/evolution-api"

if [ -d "$EVOLUTION_DIR" ] && [ -f "$EVOLUTION_DIR/package.json" ]; then
    print_success "Evolution API já está instalada"
else
    if [ -f "scripts/install-evolution-api.sh" ]; then
        chmod +x scripts/install-evolution-api.sh
        echo "y" | ./scripts/install-evolution-api.sh || true
    else
        print_error "Script install-evolution-api.sh não encontrado"
        exit 1
    fi
    print_success "Evolution API instalada"
fi

# 3. Verificar configurações
echo ""
echo "📋 Passo 3/5: Verificando configurações..."

# Verificar se .env existe
if [ ! -f ".env" ]; then
    print_warning "Arquivo .env não encontrado. Criando a partir do env.example..."
    if [ -f "env.example" ]; then
        cp env.example .env
        print_warning "Arquivo .env criado. POR FAVOR, EDITE COM SUAS CONFIGURAÇÕES!"
    else
        print_error "env.example não encontrado"
        exit 1
    fi
fi

# Verificar se Evolution API .env existe
if [ ! -f "$EVOLUTION_DIR/.env" ]; then
    print_warning "Arquivo .env da Evolution API não encontrado"
    print_warning "Execute: nano $EVOLUTION_DIR/.env e configure AUTHENTICATION_API_KEY"
fi

# 4. Criar diretório de logs
echo ""
echo "📁 Passo 4/5: Criando diretórios necessários..."
mkdir -p logs
print_success "Diretório de logs criado"

# 5. Configurar PM2 para iniciar no boot
echo ""
echo "⚙️  Passo 5/5: Configurando PM2 para iniciar automaticamente..."

# Parar processos existentes (se houver)
pm2 delete all 2>/dev/null || true

# Iniciar aplicações
print_success "Iniciando aplicações com PM2..."
pm2 start ecosystem.config.js

# Salvar configuração
print_success "Salvando configuração do PM2..."
pm2 save

# Configurar startup
print_success "Configurando PM2 para iniciar no boot..."
STARTUP_CMD=$(pm2 startup | grep -v "PM2" | grep -v "To setup" | grep -v "copy/paste" | tail -1)
if [ ! -z "$STARTUP_CMD" ]; then
    print_warning "Execute este comando para configurar o startup:"
    echo "$STARTUP_CMD"
    echo ""
    read -p "Deseja executar agora? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        eval $STARTUP_CMD
        print_success "PM2 configurado para iniciar no boot!"
    else
        print_warning "Execute manualmente depois:"
        echo "$STARTUP_CMD"
    fi
else
    print_success "PM2 startup já configurado"
fi

# Mostrar status
echo ""
echo "📊 Status dos serviços:"
pm2 status

echo ""
print_success "✅ Setup completo!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure o arquivo .env com suas variáveis de ambiente"
echo "2. Configure o arquivo $EVOLUTION_DIR/.env com AUTHENTICATION_API_KEY"
echo "3. Certifique-se de que EVOLUTION_API_KEY no .env é igual ao AUTHENTICATION_API_KEY"
echo "4. Crie a instância do WhatsApp: curl -X POST http://localhost:8080/instance/create -H 'apikey: sua-key' -H 'Content-Type: application/json' -d '{\"instanceName\":\"montshop\",\"qrcode\":true}'"
echo ""
echo "🔍 Comandos úteis:"
echo "  - Ver status: pm2 status"
echo "  - Ver logs: pm2 logs"
echo "  - Reiniciar: pm2 restart all"
echo ""

