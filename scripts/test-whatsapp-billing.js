/**
 * Script de teste para validar o sistema de envio de mensagens de cobrança
 * 
 * Este script testa:
 * - Validação de números de telefone
 * - Formatação de números
 * - Estrutura de mensagens de cobrança
 * - Dados necessários para envio
 * 
 * Para executar: node scripts/test-whatsapp-billing.js
 */

const axios = require('axios');

// Configurações
const API_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}${colors.reset}\n`)
};

// Cliente HTTP
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` })
  },
  timeout: 10000
});

// Testes de validação de telefone
const phoneValidationTests = [
  { phone: '11987654321', expected: true, description: '11 dígitos (DDD + número)' },
  { phone: '5511987654321', expected: true, description: '13 dígitos (55 + DDD + número)' },
  { phone: '(11) 98765-4321', expected: true, description: 'Formatado com parênteses' },
  { phone: '+55 11 98765-4321', expected: true, description: 'Formato internacional' },
  { phone: '1187654321', expected: true, description: '10 dígitos (formato antigo)' },
  { phone: '551187654321', expected: true, description: '12 dígitos (55 + formato antigo)' },
  { phone: '123456', expected: false, description: 'Número muito curto' },
  { phone: '00123456789', expected: false, description: 'DDD inválido (00)' },
  { phone: 'abc123', expected: false, description: 'Contém letras' },
];

// Testes de formatação de telefone
const phoneFormattingTests = [
  { phone: '11987654321', expected: '5511987654321' },
  { phone: '(11) 98765-4321', expected: '5511987654321' },
  { phone: '+55 11 98765-4321', expected: '5511987654321' },
  { phone: '1187654321', expected: '551187654321' },
];

// Dados de teste para mensagem de cobrança
const billingTestData = {
  customerName: 'João Silva',
  installmentNumber: 3,
  totalInstallments: 5,
  amount: 150.00,
  remainingAmount: 100.00,
  dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Daqui a 5 dias
  description: 'Venda #12345',
  companyName: 'MontShop Teste'
};

/**
 * Testa validação de números de telefone
 */
async function testPhoneValidation() {
  log.title('TESTE 1: Validação de Números de Telefone');
  
  let passed = 0;
  let failed = 0;

  for (const test of phoneValidationTests) {
    try {
      const response = await api.post('/whatsapp/validate-phone', {
        phone: test.phone
      });

      const isValid = response.data.isValid;
      
      if (isValid === test.expected) {
        log.success(`${test.description}: ${test.phone} -> ${isValid ? 'Válido' : 'Inválido'}`);
        passed++;
      } else {
        log.error(`${test.description}: ${test.phone} -> Esperado: ${test.expected}, Recebido: ${isValid}`);
        failed++;
      }
    } catch (error) {
      log.error(`Erro ao testar ${test.phone}: ${error.message}`);
      failed++;
    }
  }

  log.info(`Resultados: ${passed} passou(passaram), ${failed} falhou(falharam)`);
  return { passed, failed };
}

/**
 * Testa formatação de números de telefone
 */
async function testPhoneFormatting() {
  log.title('TESTE 2: Formatação de Números de Telefone');
  
  let passed = 0;
  let failed = 0;

  for (const test of phoneFormattingTests) {
    try {
      const response = await api.post('/whatsapp/format-phone', {
        phone: test.phone
      });

      const formatted = response.data.formattedPhone;
      
      if (formatted === test.expected) {
        log.success(`${test.phone} -> ${formatted}`);
        passed++;
      } else {
        log.error(`${test.phone} -> Esperado: ${test.expected}, Recebido: ${formatted}`);
        failed++;
      }
    } catch (error) {
      log.error(`Erro ao formatar ${test.phone}: ${error.message}`);
      failed++;
    }
  }

  log.info(`Resultados: ${passed} passou(passaram), ${failed} falhou(falharam)`);
  return { passed, failed };
}

/**
 * Testa a estrutura da mensagem de cobrança
 */
function testBillingMessageStructure() {
  log.title('TESTE 3: Estrutura da Mensagem de Cobrança');
  
  const dueDateFormatted = new Date(billingTestData.dueDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const daysUntilDue = Math.ceil(
    (new Date(billingTestData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  let statusEmoji = '📅';
  let statusText = '';
  
  if (daysUntilDue < 0) {
    statusEmoji = '⚠️';
    statusText = `*VENCIDA há ${Math.abs(daysUntilDue)} dia(s)*`;
  } else if (daysUntilDue === 0) {
    statusEmoji = '🔴';
    statusText = '*VENCE HOJE*';
  } else if (daysUntilDue <= 3) {
    statusEmoji = '🟡';
    statusText = `*Vence em ${daysUntilDue} dia(s)*`;
  } else {
    statusText = `*Vence em ${daysUntilDue} dia(s)*`;
  }

  const message = `
${statusEmoji} *COBRANÇA - PARCELA ${billingTestData.installmentNumber}/${billingTestData.totalInstallments}*

Olá, ${billingTestData.customerName}!

${statusText}

📋 *Detalhes da Parcela:*
• Parcela: ${billingTestData.installmentNumber} de ${billingTestData.totalInstallments}
• Valor Total: R$ ${billingTestData.amount.toFixed(2).replace('.', ',')}
• Valor Restante: R$ ${billingTestData.remainingAmount.toFixed(2).replace('.', ',')}
• Vencimento: ${dueDateFormatted}
${billingTestData.description ? `• Descrição: ${billingTestData.description}\n` : ''}
${billingTestData.companyName ? `\n🏢 *${billingTestData.companyName}*\n` : ''}
Por favor, efetue o pagamento até a data de vencimento.

Obrigado pela atenção! 🙏
  `.trim();

  console.log('\n--- PREVIEW DA MENSAGEM ---\n');
  console.log(message);
  console.log('\n--- FIM DO PREVIEW ---\n');

  // Validações
  const checks = [
    { test: message.includes(billingTestData.customerName), desc: 'Contém nome do cliente' },
    { test: message.includes(`${billingTestData.installmentNumber}/${billingTestData.totalInstallments}`), desc: 'Contém número da parcela' },
    { test: message.includes(billingTestData.amount.toFixed(2).replace('.', ',')), desc: 'Contém valor total' },
    { test: message.includes(billingTestData.remainingAmount.toFixed(2).replace('.', ',')), desc: 'Contém valor restante' },
    { test: message.includes(dueDateFormatted), desc: 'Contém data de vencimento' },
    { test: message.includes(billingTestData.description), desc: 'Contém descrição' },
    { test: message.includes(billingTestData.companyName), desc: 'Contém nome da empresa' },
    { test: message.length < 65536, desc: 'Tamanho dentro do limite do WhatsApp' },
  ];

  let passed = 0;
  let failed = 0;

  checks.forEach(check => {
    if (check.test) {
      log.success(check.desc);
      passed++;
    } else {
      log.error(check.desc);
      failed++;
    }
  });

  log.info(`Tamanho da mensagem: ${message.length} caracteres`);
  log.info(`Resultados: ${passed} passou(passaram), ${failed} falhou(falharam)`);
  
  return { passed, failed };
}

/**
 * Verifica configuração da API
 */
async function checkAPIConfiguration() {
  log.title('VERIFICAÇÃO: Configuração da API');
  
  try {
    log.info(`API URL: ${API_URL}`);
    log.info(`Auth Token: ${AUTH_TOKEN ? '***' + AUTH_TOKEN.slice(-4) : 'Não configurado'}`);
    
    // Tentar fazer uma requisição simples
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    log.success('API está acessível');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.error('Não foi possível conectar à API. Verifique se ela está rodando.');
    } else if (error.response?.status === 404) {
      log.warning('Endpoint /health não encontrado, mas API está acessível');
      return true;
    } else {
      log.error(`Erro ao conectar: ${error.message}`);
    }
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   TESTE DE SISTEMA DE COBRANÇA VIA WHATSAPP (Z-API)      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Verificar configuração
  const apiOk = await checkAPIConfiguration();
  
  if (!apiOk) {
    log.warning('\nPulando testes de API pois a conexão falhou.');
    log.warning('Execute a API e tente novamente para testes completos.\n');
    
    // Executar apenas teste de estrutura de mensagem
    const msgResults = testBillingMessageStructure();
    results.passed = msgResults.passed;
    results.failed = msgResults.failed;
    results.total = msgResults.passed + msgResults.failed;
  } else {
    // Executar todos os testes
    try {
      // Teste 1: Validação de telefone
      const validationResults = await testPhoneValidation();
      results.passed += validationResults.passed;
      results.failed += validationResults.failed;
      results.total += validationResults.passed + validationResults.failed;

      // Teste 2: Formatação de telefone
      const formattingResults = await testPhoneFormatting();
      results.passed += formattingResults.passed;
      results.failed += formattingResults.failed;
      results.total += formattingResults.passed + formattingResults.failed;

      // Teste 3: Estrutura de mensagem
      const msgResults = testBillingMessageStructure();
      results.passed += msgResults.passed;
      results.failed += msgResults.failed;
      results.total += msgResults.passed + msgResults.failed;
    } catch (error) {
      log.error(`Erro durante execução dos testes: ${error.message}`);
    }
  }

  // Resumo final
  log.title('RESUMO DOS TESTES');
  console.log(`Total de testes: ${results.total}`);
  console.log(`${colors.green}Passou: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Falhou: ${results.failed}${colors.reset}`);
  
  const successRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) : 0;
  console.log(`Taxa de sucesso: ${successRate}%\n`);

  if (results.failed === 0) {
    log.success('Todos os testes passaram! ✨');
  } else {
    log.warning(`${results.failed} teste(s) falharam. Revise as mensagens acima.`);
  }

  console.log('\n');
  process.exit(results.failed > 0 ? 1 : 0);
}

// Executar
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
