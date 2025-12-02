#!/bin/bash

# Script de instalação do PM2
# Para produção na Digital Ocean

set -e

echo "🚀 Instalando PM2..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado!"
    echo "📥 Instalando Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js instalado!"
fi

# Verificar versão do Node.js
NODE_VERSION=$(node --version)
echo "✅ Node.js versão: $NODE_VERSION"

# Instalar PM2 globalmente
echo "📦 Instalando PM2 globalmente..."
sudo npm install -g pm2

# Verificar instalação
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    echo "✅ PM2 instalado com sucesso! Versão: $PM2_VERSION"
    
    # Configurar PM2 para iniciar no boot
    echo "⚙️  Configurando PM2 para iniciar no boot..."
    STARTUP_OUTPUT=$(sudo pm2 startup 2>&1)
    STARTUP_CMD=$(echo "$STARTUP_OUTPUT" | grep -E "sudo.*pm2 startup" | tail -1)
    
    if [ ! -z "$STARTUP_CMD" ]; then
        echo ""
        echo "⚠️  Execute este comando para configurar o startup automático:"
        echo "$STARTUP_CMD"
        echo ""
        echo "Ou execute o script completo: ./scripts/setup-production.sh"
    else
        echo "✅ PM2 startup já configurado"
    fi
    
    echo ""
    echo "✅ PM2 instalado!"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Configure sua aplicação no ecosystem.config.js"
    echo "2. Execute: ./scripts/setup-production.sh (configuração completa)"
    echo "   Ou manualmente:"
    echo "   - pm2 start ecosystem.config.js"
    echo "   - pm2 save"
    echo "   - Execute o comando do 'pm2 startup' mostrado acima"
    echo ""
else
    echo "❌ Erro ao instalar PM2"
    exit 1
fi

