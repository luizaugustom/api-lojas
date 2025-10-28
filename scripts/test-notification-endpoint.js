/**
 * Script para testar o endpoint de notificações
 * Execute: node scripts/test-notification-endpoint.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Coloque um token válido aqui para testar
const TOKEN = 'SEU_TOKEN_AQUI';

async function testNotificationEndpoints() {
  console.log('🧪 Testando endpoints de notificação...\n');
  console.log(`API URL: ${API_URL}\n`);

  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Testar obter preferências
    console.log('1️⃣ Testando GET /notification/preferences/me');
    try {
      const response = await axios.get(`${API_URL}/notification/preferences/me`, { headers });
      console.log('✅ Sucesso!');
      console.log('Preferências:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.log(`❌ Erro ${error.response.status}: ${error.response.statusText}`);
        console.log('Resposta:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Erro:', error.message);
      }
    }
    console.log('\n---\n');

    // 2. Testar listar notificações
    console.log('2️⃣ Testando GET /notification');
    try {
      const response = await axios.get(`${API_URL}/notification`, { headers });
      console.log('✅ Sucesso!');
      console.log(`Total de notificações: ${response.data.length}`);
      if (response.data.length > 0) {
        console.log('Primeira notificação:', JSON.stringify(response.data[0], null, 2));
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ Erro ${error.response.status}: ${error.response.statusText}`);
        console.log('Resposta:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Erro:', error.message);
      }
    }
    console.log('\n---\n');

    // 3. Testar contador de não lidas
    console.log('3️⃣ Testando GET /notification/unread-count');
    try {
      const response = await axios.get(`${API_URL}/notification/unread-count`, { headers });
      console.log('✅ Sucesso!');
      console.log('Contador:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response) {
        console.log(`❌ Erro ${error.response.status}: ${error.response.statusText}`);
        console.log('Resposta:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Erro:', error.message);
      }
    }
    console.log('\n---\n');

  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
  }
}

// Verificar se token foi fornecido
if (!TOKEN || TOKEN === 'SEU_TOKEN_AQUI') {
  console.log('⚠️  ATENÇÃO: Configure um token válido no script antes de executar!');
  console.log('Para obter um token:');
  console.log('1. Faça login no sistema');
  console.log('2. Abra o DevTools do navegador (F12)');
  console.log('3. Vá em Application > Local Storage');
  console.log('4. Copie o valor de "token"');
  console.log('5. Cole no script na variável TOKEN\n');
  process.exit(1);
}

testNotificationEndpoints()
  .then(() => {
    console.log('\n✨ Testes concluídos!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

