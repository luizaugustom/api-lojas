#!/bin/bash

# Script simplificado para iniciar Evolution API e API principal
# Este script usa processos Node.js separados para cada serviço

set -e

# Cores para logs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

# Verificar variáveis de ambiente
if [ -z "$EVOLUTION_API_KEY" ]; then
    error "EVOLUTION_API_KEY não está definida!"
    exit 1
fi

# Configurações
EVOLUTION_PORT=${EVOLUTION_API_PORT:-8080}
EVOLUTION_DATA_DIR="/app/evolution-data"

# Criar diretórios
mkdir -p "$EVOLUTION_DATA_DIR/instances"
mkdir -p "$EVOLUTION_DATA_DIR/store"

log "🚀 Iniciando serviços..."

# Função para limpar processos ao sair
cleanup() {
    log "🛑 Encerrando serviços..."
    kill $EVOLUTION_PID 2>/dev/null || true
    kill $MAIN_API_PID 2>/dev/null || true
    wait
    exit 0
}

trap cleanup SIGTERM SIGINT

# Iniciar Evolution API em background
log "📱 Iniciando Evolution API na porta $EVOLUTION_PORT..."
node scripts/start-evolution-api-simple.js &
EVOLUTION_PID=$!

# Aguardar Evolution API iniciar
log "⏳ Aguardando Evolution API iniciar..."
sleep 10

# Verificar se Evolution API está rodando
if ! kill -0 $EVOLUTION_PID 2>/dev/null; then
    error "Evolution API não iniciou corretamente"
    exit 1
fi

log "✅ Evolution API iniciada (PID: $EVOLUTION_PID)"

# Iniciar API principal em background
log "🌐 Iniciando API principal..."
node dist/src/main.js &
MAIN_API_PID=$!

log "✅ API principal iniciada (PID: $MAIN_API_PID)"

# Aguardar ambos os processos
log "✅ Ambos os serviços estão rodando"
log "📱 Evolution API: http://localhost:$EVOLUTION_PORT"
log "🌐 API Principal: http://localhost:${PORT:-3000}"

# Monitorar processos e reiniciar se necessário
while true; do
    # Verificar Evolution API
    if ! kill -0 $EVOLUTION_PID 2>/dev/null; then
        error "Evolution API parou. Reiniciando..."
        node scripts/start-evolution-api.js &
        EVOLUTION_PID=$!
        sleep 5
    fi
    
    # Verificar API principal
    if ! kill -0 $MAIN_API_PID 2>/dev/null; then
        error "API principal parou. Reiniciando..."
        node dist/src/main.js &
        MAIN_API_PID=$!
        sleep 5
    fi
    
    sleep 10
done

