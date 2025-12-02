#!/bin/bash

# Script para iniciar serviços em produção
# Verifica e inicia automaticamente se necessário

set -e

echo "🚀 Iniciando serviços de produção..."

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 não está instalado. Execute: ./scripts/install-pm2.sh"
    exit 1
fi

# Verificar se ecosystem.config.js existe
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ ecosystem.config.js não encontrado!"
    exit 1
fi

# Verificar se Evolution API está instalada
EVOLUTION_DIR="$HOME/evolution-api"
if [ ! -d "$EVOLUTION_DIR" ]; then
    echo "⚠️  Evolution API não está instalada. Execute: ./scripts/install-evolution-api.sh"
    exit 1
fi

# Criar diretório de logs se não existir
mkdir -p logs

# Verificar se os serviços já estão rodando
API_RUNNING=$(pm2 list | grep -c "api-lojas" || true)
EVOLUTION_RUNNING=$(pm2 list | grep -c "evolution-api" || true)

if [ "$API_RUNNING" -gt 0 ] && [ "$EVOLUTION_RUNNING" -gt 0 ]; then
    echo "✅ Serviços já estão rodando"
    pm2 status
else
    echo "📦 Iniciando serviços..."
    
    # Parar processos antigos se existirem
    pm2 delete all 2>/dev/null || true
    
    # Iniciar serviços
    pm2 start ecosystem.config.js
    
    # Salvar configuração
    pm2 save
    
    echo "✅ Serviços iniciados!"
    pm2 status
fi

echo ""
echo "📊 Status:"
pm2 status

echo ""
echo "📝 Comandos úteis:"
echo "  - Ver logs: pm2 logs"
echo "  - Reiniciar: pm2 restart all"
echo "  - Parar: pm2 stop all"
echo ""

