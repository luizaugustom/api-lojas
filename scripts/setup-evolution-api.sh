#!/bin/bash

# Script para configurar Evolution API
# Este script instala a Evolution API do repositório oficial

set -e

EVOLUTION_DIR="/app/evolution-api"
EVOLUTION_DATA_DIR="/app/evolution-data"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# Verificar se já está instalado
if [ -d "$EVOLUTION_DIR" ] && [ -f "$EVOLUTION_DIR/package.json" ]; then
    log "Evolution API já está instalada"
    exit 0
fi

log "Instalando Evolution API..."

# Criar diretórios
mkdir -p "$EVOLUTION_DIR"
mkdir -p "$EVOLUTION_DATA_DIR/instances"
mkdir -p "$EVOLUTION_DATA_DIR/store"

cd "$EVOLUTION_DIR"

# Verificar se git está disponível
if ! command -v git &> /dev/null; then
    error "git não está disponível. Instalando..."
    apt-get update && apt-get install -y git
fi

# Clonar repositório da Evolution API
log "Clonando repositório Evolution API..."
if [ ! -d ".git" ]; then
    git clone --depth 1 https://github.com/EvolutionAPI/evolution-api.git . || {
        error "Falha ao clonar repositório"
        exit 1
    }
fi

# Instalar dependências
log "Instalando dependências..."
if [ -f "package.json" ]; then
    npm install --production || {
        error "Falha ao instalar dependências"
        exit 1
    }
else
    error "package.json não encontrado"
    exit 1
fi

log "✅ Evolution API instalada com sucesso"

