#!/usr/bin/env node

/**
 * Script simplificado para iniciar Evolution API
 * Usa npx para rodar evolution-api em tempo de execução
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const EVOLUTION_PORT = process.env.EVOLUTION_API_PORT || 8080;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_DATA_DIR = path.join(process.cwd(), 'evolution-data');

// Criar diretórios
[path.join(EVOLUTION_DATA_DIR, 'instances'), path.join(EVOLUTION_DATA_DIR, 'store')].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

if (!EVOLUTION_API_KEY) {
  console.error('❌ ERRO: EVOLUTION_API_KEY não está definida!');
  process.exit(1);
}

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
};

console.log('🚀 Iniciando Evolution API...');
console.log(`📡 Porta: ${EVOLUTION_PORT}`);

// Verificar se Evolution API está instalada
const evolutionApiPath = path.join(process.cwd(), 'evolution-api');
const evolutionApiPackageJson = path.join(evolutionApiPath, 'package.json');

if (!fs.existsSync(evolutionApiPackageJson)) {
  console.log('📦 Evolution API não encontrada. Instalando...');
  const { execSync } = require('child_process');
  try {
    execSync('bash scripts/setup-evolution-api.sh', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Falha ao instalar Evolution API:', error.message);
    process.exit(1);
  }
}

// Iniciar Evolution API
const evolutionProcess = spawn('npm', ['start'], {
  cwd: evolutionApiPath,
  env,
  stdio: 'inherit',
  shell: false,
});

evolutionProcess.on('error', (error) => {
  console.error('❌ Erro ao iniciar Evolution API:', error.message);
  console.error('💡 Dica: Certifique-se de que npx está disponível e tem acesso à internet');
  process.exit(1);
});

evolutionProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Evolution API encerrou com código ${code}`);
    process.exit(code);
  }
});

process.on('SIGTERM', () => {
  console.log('🛑 Encerrando Evolution API...');
  evolutionProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Encerrando Evolution API...');
  evolutionProcess.kill('SIGINT');
});

