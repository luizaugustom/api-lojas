#!/usr/bin/env node

/**
 * Script para iniciar Evolution API como processo Node.js
 * Este script inicia a Evolution API usando o pacote npm evolution-api
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configurações
const EVOLUTION_PORT = process.env.EVOLUTION_API_PORT || 8080;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'default';
const EVOLUTION_DATA_DIR = path.join(__dirname, '..', 'evolution-data');

// Criar diretórios necessários
const dirs = [
  path.join(EVOLUTION_DATA_DIR, 'instances'),
  path.join(EVOLUTION_DATA_DIR, 'store'),
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Verificar se API Key está configurada
if (!EVOLUTION_API_KEY) {
  console.error('❌ ERRO: EVOLUTION_API_KEY não está definida!');
  console.error('Configure a variável de ambiente EVOLUTION_API_KEY');
  process.exit(1);
}

// Variáveis de ambiente para Evolution API
const env = {
  ...process.env,
  SERVER_URL: `http://0.0.0.0:${EVOLUTION_PORT}`,
  PORT: String(EVOLUTION_PORT),
  DATABASE_ENABLED: 'true',
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_NAME: 'evolution',
  AUTHENTICATION_API_KEY: EVOLUTION_API_KEY,
  AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES: 'true',
  QRCODE_LIMIT: '30',
  QRCODE_COLOR: '#198754',
  LOG_LEVEL: 'ERROR',
  LOG_COLOR: 'true',
  LOG_BAILEYS: 'error',
  INSTANCES_DIR: path.join(EVOLUTION_DATA_DIR, 'instances'),
  STORE_DIR: path.join(EVOLUTION_DATA_DIR, 'store'),
};

console.log('🚀 Iniciando Evolution API...');
console.log(`📡 Porta: ${EVOLUTION_PORT}`);
console.log(`🔑 API Key: ${EVOLUTION_API_KEY.substring(0, 10)}...`);
console.log(`📁 Data Dir: ${EVOLUTION_DATA_DIR}`);

// Tentar iniciar Evolution API usando npx
// Se evolution-api não estiver disponível globalmente, vamos usar uma abordagem alternativa
const evolutionApiPath = path.join(__dirname, '..', 'node_modules', '.bin', 'evolution-api');

let command;
let args;

if (fs.existsSync(evolutionApiPath)) {
  // Usar evolution-api do node_modules
  command = 'node';
  args = [evolutionApiPath, 'start'];
} else {
  // Tentar usar npx
  command = 'npx';
  args = ['-y', 'evolution-api@latest', 'start'];
}

console.log(`▶️  Executando: ${command} ${args.join(' ')}`);

const evolutionProcess = spawn(command, args, {
  env,
  stdio: 'inherit',
  shell: false,
});

evolutionProcess.on('error', (error) => {
  console.error('❌ Erro ao iniciar Evolution API:', error);
  process.exit(1);
});

evolutionProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Evolution API encerrou com código ${code}`);
    process.exit(code);
  }
});

// Aguardar sinal de término
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM. Encerrando Evolution API...');
  evolutionProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT. Encerrando Evolution API...');
  evolutionProcess.kill('SIGINT');
});

