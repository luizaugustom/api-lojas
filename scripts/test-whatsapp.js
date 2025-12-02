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
const path = require('path');
const fs = require('fs');

// Tentar carregar dotenv se estiver disponível (opcional)
try {
  // Tentar carregar .env do diretório raiz do projeto (api-lojas)
  const projectRoot = path.resolve(__dirname, '..');
  const envPath = path.join(projectRoot, '.env');
  
  // Verificar se dotenv está instalado
  try {
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
    } else {
      // Tentar carregar do diretório atual
      require('dotenv').config();
    }
  } catch (dotenvError) {
    // dotenv não instalado, usar variáveis de ambiente do sistema
    // Isso é normal, não é um erro
  }
} catch (e) {
  // Erro ao tentar carregar .env, continuar sem ele
  // As variáveis de ambiente do sistema ainda funcionarão
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
        timeout: 10000, // 10 segundos de timeout
      }
    );

    if (response.data && response.data.success && response.data.formattedPhone) {
      logSuccess(`Número formatado: ${response.data.formattedPhone}`);
      return response.data.formattedPhone;
    }

    logWarning('Formatação retornou sem sucesso, usando número original');
    return phone;
  } catch (error) {
    if (error.response) {
      logWarning(`Erro ao formatar telefone: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      logWarning('Continuando com número original...');
    } else {
      logWarning(`Erro ao formatar telefone: ${error.message}`);
      logWarning('Continuando com número original...');
    }
    // Retorna o número original em caso de erro, mas tenta formatar manualmente
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      const formatted = `55${digits}`;
      logInfo(`Formatando manualmente: ${formatted}`);
      return formatted;
    }
    return phone;
  }
}

async function sendMessage(token, phone, message) {
  logInfo(`Enviando mensagem para ${phone}...`);
  log(`📤 Mensagem: "${message.replace(/\n/g, ' ')}"`, 'blue');
  
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
        timeout: 30000, // 30 segundos de timeout
      }
    );

    if (response.data && response.data.success) {
      logSuccess('Mensagem enviada com sucesso!');
      log(`📱 Verifique o WhatsApp do número ${phone}`, 'cyan');
      return true;
    } else {
      logError(`Falha ao enviar mensagem: ${response.data.message || 'Erro desconhecido'}`);
      if (response.data) {
        logError(`Resposta completa: ${JSON.stringify(response.data, null, 2)}`);
      }
      return false;
    }
  } catch (error) {
    if (error.response) {
      logError(`Erro ao enviar mensagem: ${error.response.status}`);
      if (error.response.data) {
        logError(`Detalhes: ${JSON.stringify(error.response.data, null, 2)}`);
        
        // Mensagens de erro mais amigáveis
        if (error.response.status === 401) {
          logError('🔐 Erro de autenticação. Verifique se o token JWT é válido.');
        } else if (error.response.status === 403) {
          logError('🚫 Acesso negado. Verifique se o usuário tem permissão para enviar mensagens.');
        } else if (error.response.status === 404) {
          logError('🔍 Endpoint não encontrado. Verifique se a API está rodando corretamente.');
        } else if (error.response.status === 500) {
          logError('⚠️ Erro interno do servidor. Verifique os logs da aplicação.');
        }
      }
    } else if (error.request) {
      logError(`Erro de conexão: Não foi possível conectar à API em ${API_URL}`);
      logError('Verifique se a API está rodando');
      logError(`Tente: curl ${API_URL}/health`);
    } else {
      logError(`Erro: ${error.message}`);
    }
    
    // Se for erro de timeout
    if (error.code === 'ECONNABORTED') {
      logError('⏱️ Timeout ao enviar mensagem. A API pode estar lenta ou sobrecarregada.');
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
    logWarning('Configure as variáveis no arquivo .env:');
    log('  Z_API_INSTANCE_ID=seu-instance-id', 'yellow');
    log('  Z_API_TOKEN=seu-token', 'yellow');
    log('', 'reset');
    logWarning('Ou exporte as variáveis antes de executar:');
    log('  export Z_API_INSTANCE_ID=seu-instance-id', 'yellow');
    log('  export Z_API_TOKEN=seu-token', 'yellow');
    return false;
  }
  
  logSuccess('Z-API configurada');
  log(`  Instance ID: ${instanceId.substring(0, 8)}...${instanceId.substring(instanceId.length - 4)}`, 'cyan');
  log(`  Token: ${token.substring(0, 8)}...${token.substring(token.length - 4)}`, 'cyan');
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
  log(`  Telefone de teste: ${TEST_PHONE}`, 'cyan');
  log(`  Login: ${LOGIN}`, 'cyan');
  log(`  Senha: ${'*'.repeat(PASSWORD.length)}`, 'cyan');
  log('', 'reset');
  
  // Verificar se a API está acessível
  logInfo('Verificando se a API está acessível...');
  try {
    await axios.get(`${API_URL}/health`, { timeout: 5000 });
    logSuccess('API está acessível');
  } catch (error) {
    logWarning('Não foi possível verificar o health da API (pode estar normal)');
    logWarning('Continuando mesmo assim...');
  }
  log('', 'reset');
  
  try {
    // 1. Fazer login
    const token = await login();
    if (!token) {
      logError('Não foi possível obter o token de autenticação');
      process.exit(1);
    }
    
    await sleep(500);
    
    // 2. Validar telefone (opcional, mas recomendado)
    const isValid = await validatePhone(token, TEST_PHONE);
    if (!isValid) {
      logWarning('Número pode ser inválido, mas continuando...');
      logWarning('O sistema tentará formatar automaticamente');
    }
    
    await sleep(500);
    
    // 3. Formatar telefone (importante para garantir formato correto)
    let formattedPhone = await formatPhone(token, TEST_PHONE);
    
    // Se não conseguiu formatar, tenta formatar manualmente
    if (!formattedPhone || formattedPhone === TEST_PHONE) {
      const digits = TEST_PHONE.replace(/\D/g, '');
      if (digits.length === 11) {
        formattedPhone = `55${digits}`;
        logInfo(`Número formatado manualmente: ${formattedPhone}`);
      } else {
        formattedPhone = TEST_PHONE;
        logWarning('Usando número original (formato pode estar incorreto)');
      }
    }
    
    await sleep(500);
    
    // 4. Enviar mensagem (usar número formatado)
    log('\n📨 Enviando mensagem de teste...\n', 'bright');
    const success = await sendMessage(token, formattedPhone || TEST_PHONE, TEST_MESSAGE);
    
    if (success) {
      log('\n✅ Teste concluído com sucesso!', 'green');
      log(`📱 Verifique o WhatsApp do número ${formattedPhone || TEST_PHONE}`, 'cyan');
      process.exit(0);
    } else {
      log('\n❌ Teste falhou!', 'red');
      logWarning('Verifique:');
      log('  1. Se a Z-API está configurada corretamente', 'yellow');
      log('  2. Se o WhatsApp está conectado na plataforma Z-API', 'yellow');
      log('  3. Se o número tem WhatsApp ativo', 'yellow');
      log('  4. Os logs da aplicação para mais detalhes', 'yellow');
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

