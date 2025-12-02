#!/bin/bash

# Script de inicialização para rodar Evolution API e API principal juntos
# Este script inicia ambos os serviços em paralelo e monitora seus processos

set -e

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $1"
}

# Verificar variáveis de ambiente necessárias
if [ -z "$EVOLUTION_API_KEY" ]; then
    error "EVOLUTION_API_KEY não está definida. Configure no .env ou variáveis de ambiente."
    exit 1
fi

if [ -z "$EVOLUTION_INSTANCE" ]; then
    warn "EVOLUTION_INSTANCE não está definida. Usando 'default' como padrão."
    export EVOLUTION_INSTANCE="default"
fi

# Configurações padrão da Evolution API
EVOLUTION_PORT=${EVOLUTION_API_PORT:-8080}
EVOLUTION_DIR="/app/evolution-api"
EVOLUTION_DATA_DIR="/app/evolution-data"

# Criar diretórios necessários
mkdir -p "$EVOLUTION_DATA_DIR/instances"
mkdir -p "$EVOLUTION_DATA_DIR/store"

log "Iniciando serviços..."

# Função para iniciar Evolution API
start_evolution_api() {
    log "Iniciando Evolution API na porta $EVOLUTION_PORT..."
    
    # Verificar se a Evolution API já está instalada
    if [ ! -d "$EVOLUTION_DIR" ]; then
        log "Evolution API não encontrada. Instalando..."
        
        # Criar diretório
        mkdir -p "$EVOLUTION_DIR"
        cd "$EVOLUTION_DIR"
        
        # Baixar e instalar Evolution API usando npx (mais leve que clonar repositório)
        # Usaremos uma abordagem mais simples: rodar via npx evolution-api
        log "Instalando Evolution API via npm..."
        
        # Alternativa: usar a imagem Docker da Evolution API via docker-in-docker ou
        # instalar via npm globalmente
        # Por enquanto, vamos usar uma abordagem mais simples com npx
        
        # Se npx evolution-api não funcionar, vamos usar uma solução alternativa
        # que é rodar a Evolution API como um serviço Node.js separado
    fi
    
    # Configurar variáveis de ambiente da Evolution API
    export SERVER_URL="http://0.0.0.0:$EVOLUTION_PORT"
    export PORT="$EVOLUTION_PORT"
    export DATABASE_ENABLED="true"
    export DATABASE_PROVIDER="sqlite"
    export DATABASE_NAME="evolution"
    export AUTHENTICATION_API_KEY="$EVOLUTION_API_KEY"
    export AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES="true"
    export QRCODE_LIMIT="30"
    export QRCODE_COLOR="#198754"
    export LOG_LEVEL="ERROR"
    export LOG_COLOR="true"
    export LOG_BAILEYS="error"
    
    # Iniciar Evolution API usando npx (se disponível) ou node
    # Nota: A Evolution API precisa ser instalada primeiro
    # Vamos usar uma abordagem diferente: instalar via npm e rodar
    
    cd "$EVOLUTION_DIR" || exit 1
    
    # Tentar iniciar Evolution API
    # Se não estiver instalada, vamos usar uma solução alternativa
    if command -v npx &> /dev/null; then
        log "Iniciando Evolution API via npx..."
        npx -y evolution-api@latest start &
        EVOLUTION_PID=$!
    else
        error "npx não encontrado. Evolution API não pode ser iniciada."
        exit 1
    fi
    
    # Aguardar Evolution API iniciar
    log "Aguardando Evolution API iniciar..."
    sleep 5
    
    # Verificar se está rodando
    for i in {1..30}; do
        if curl -s -f "http://localhost:$EVOLUTION_PORT" > /dev/null 2>&1; then
            log "Evolution API iniciada com sucesso na porta $EVOLUTION_PORT"
            return 0
        fi
        sleep 1
    done
    
    error "Evolution API não iniciou após 30 segundos"
    return 1
}

# Função para iniciar API principal
start_main_api() {
    log "Iniciando API principal..."
    node dist/src/main.js &
    MAIN_API_PID=$!
    log "API principal iniciada (PID: $MAIN_API_PID)"
}

# Função para monitorar processos
monitor_processes() {
    while true; do
        # Verificar Evolution API
        if ! kill -0 $EVOLUTION_PID 2>/dev/null; then
            error "Evolution API parou. Reiniciando..."
            start_evolution_api
        fi
        
        # Verificar API principal
        if ! kill -0 $MAIN_API_PID 2>/dev/null; then
            error "API principal parou. Reiniciando..."
            start_main_api
        fi
        
        sleep 5
    done
}

# Trap para limpar processos ao sair
cleanup() {
    log "Encerrando serviços..."
    kill $EVOLUTION_PID 2>/dev/null || true
    kill $MAIN_API_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Iniciar ambos os serviços
start_evolution_api
start_main_api

# Monitorar processos
log "Serviços iniciados. Monitorando..."
monitor_processes

