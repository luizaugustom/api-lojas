/**
 * Script para testar envio de mensagem WhatsApp
 * 
 * Uso:
 *   npm run test:whatsapp
 * 
 * Ou com credenciais customizadas:
 *   LOGIN=seu-email@exemplo.com PASSWORD=sua-senha npm run test:whatsapp
 */

const axios = require('axios');

// Tentar carregar dotenv se estiver disponível (opcional)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv não instalado, usar variáveis de ambiente do sistema
}

// Configurações
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_PHONE = '48998482590';
const TEST_MESSAGE = '🚀 Teste de mensagem WhatsApp do MontShop!\n\nEsta é uma mensagem de teste automática.';

// Credenciais (podem ser passadas via variáveis de ambiente)
const LOGIN = process.env.LOGIN || process.env.ADMIN_EMAIL || 'empresa@montshop.com';
const PASSWORD = process.env.PASSWORD || process.env.ADMIN_PASSWORD || '123456';

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login() {
  logInfo('Fazendo login...');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      login: LOGIN,
      password: PASSWORD,
    });

    if (response.data && response.data.access_token) {
      logSuccess('Login realizado com sucesso!');
      return response.data.access_token;
    }

    throw new Error('Token não encontrado na resposta');
  } catch (error) {
    if (error.response) {
      logError(`Erro ao fazer login: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Erro ao fazer login: ${error.message}`);
    }
    throw error;
  }
}

async function validatePhone(token, phone) {
  logInfo(`Validando número de telefone: ${phone}...`);
  
  try {
    const response = await axios.post(
      `${API_URL}/whatsapp/validate-phone`,
      { phone },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.isValid) {
      logSuccess('Número de telefone válido!');
      return true;
    } else {
      logWarning('Número de telefone inválido!');
      return false;
    }
  } catch (error) {
    if (error.response) {
      logError(`Erro ao validar telefone: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Erro ao validar telefone: ${error.message}`);
    }
    return false;
  }
}

async function formatPhone(token, phone) {
  logInfo(`Formatando número de telefone: ${phone}...`);
  
  try {
    const response = await axios.post(
      `${API_URL}/whatsapp/format-phone`,
      { phone },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.success) {
      logSuccess(`Número formatado: ${response.data.formattedPhone}`);
      return response.data.formattedPhone;
    }

    throw new Error('Erro ao formatar número');
  } catch (error) {
    if (error.response) {
      logError(`Erro ao formatar telefone: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      logError(`Erro ao formatar telefone: ${error.message}`);
    }
    return phone; // Retorna o número original em caso de erro
  }
}

async function sendMessage(token, phone, message) {
  logInfo(`Enviando mensagem para ${phone}...`);
  log(`📤 Mensagem: "${message}"`, 'blue');
  
  try {
    const response = await axios.post(
      `${API_URL}/whatsapp/send-message`,
      {
        to: phone,
        message: message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data && response.data.success) {
      logSuccess('Mensagem enviada com sucesso!');
      log(`📱 Verifique o WhatsApp do número ${phone}`, 'cyan');
      return true;
    } else {
      logError(`Falha ao enviar mensagem: ${response.data.message || 'Erro desconhecido'}`);
      return false;
    }
  } catch (error) {
    if (error.response) {
      logError(`Erro ao enviar mensagem: ${error.response.status}`);
      if (error.response.data) {
        logError(`Detalhes: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    } else if (error.request) {
      logError(`Erro de conexão: Não foi possível conectar à API em ${API_URL}`);
      logError('Verifique se a API está rodando');
    } else {
      logError(`Erro: ${error.message}`);
    }
    return false;
  }
}

async function checkZApiConfig() {
  logInfo('Verificando configuração da Z-API...');
  
  const instanceId = process.env.Z_API_INSTANCE_ID;
  const token = process.env.Z_API_TOKEN;
  
  if (!instanceId || !token) {
    logError('Z-API não configurada!');
    logWarning('Configure as variáveis no .env:');
    log('  Z_API_INSTANCE_ID=seu-instance-id', 'yellow');
    log('  Z_API_TOKEN=seu-token', 'yellow');
    return false;
  }
  
  logSuccess('Z-API configurada');
  log(`  Instance ID: ${instanceId.substring(0, 8)}...`, 'cyan');
  log(`  Token: ${token.substring(0, 8)}...`, 'cyan');
  return true;
}

async function main() {
  log('\n🚀 Teste de Envio de Mensagem WhatsApp\n', 'bright');
  
  // Verificar configuração
  const configOk = await checkZApiConfig();
  if (!configOk) {
    process.exit(1);
  }
  
  log(`\n📋 Configurações:`, 'bright');
  log(`  API URL: ${API_URL}`, 'cyan');
  log(`  Telefone: ${TEST_PHONE}`, 'cyan');
  log(`  Login: ${LOGIN}`, 'cyan');
  log('', 'reset');
  
  try {
    // 1. Fazer login
    const token = await login();
    if (!token) {
      logError('Não foi possível obter o token de autenticação');
      process.exit(1);
    }
    
    await sleep(500);
    
    // 2. Validar telefone
    const isValid = await validatePhone(token, TEST_PHONE);
    if (!isValid) {
      logWarning('Continuando mesmo com número inválido...');
    }
    
    await sleep(500);
    
    // 3. Formatar telefone
    const formattedPhone = await formatPhone(token, TEST_PHONE);
    
    await sleep(500);
    
    // 4. Enviar mensagem
    log('\n📨 Enviando mensagem de teste...\n', 'bright');
    const success = await sendMessage(token, TEST_PHONE, TEST_MESSAGE);
    
    if (success) {
      log('\n✅ Teste concluído com sucesso!', 'green');
      log(`📱 Verifique o WhatsApp do número ${formattedPhone}`, 'cyan');
      process.exit(0);
    } else {
      log('\n❌ Teste falhou!', 'red');
      process.exit(1);
    }
  } catch (error) {
    logError(`\nErro fatal: ${error.message}`);
    if (error.stack) {
      logError(`Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Executar
main().catch(error => {
  logError(`Erro não tratado: ${error.message}`);
  process.exit(1);
});

