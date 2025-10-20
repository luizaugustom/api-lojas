const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Função para fazer login e obter token
async function login(login, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      login,
      password,
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Erro no login:', error.response?.data || error.message);
    throw error;
  }
}

// Função para criar uma venda com múltiplos métodos de pagamento
async function createSaleWithMultiplePayments(token, companyId) {
  try {
    const saleData = {
      sellerId: null, // Será definido pelo sistema baseado no token
      items: [
        {
          productId: 'cmgty5s880006ww3b8bup77v5', // ID de um produto existente
          quantity: 2
        }
      ],
      clientCpfCnpj: '123.456.789-00',
      clientName: 'João Silva',
      paymentMethods: [
        {
          method: 'cash',
          amount: 50.00,
          additionalInfo: 'Dinheiro'
        },
        {
          method: 'pix',
          amount: 30.00,
          additionalInfo: 'PIX instantâneo'
        }
      ]
    };

    const response = await axios.post(`${API_BASE_URL}/sale`, saleData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao criar venda:', error.response?.data || error.message);
    throw error;
  }
}

// Função para buscar uma venda específica
async function getSale(token, saleId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/sale/${saleId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao buscar venda:', error.response?.data || error.message);
    throw error;
  }
}

// Função principal de teste
async function testMultiplePaymentMethods() {
  try {
    console.log('🧪 Testando múltiplos métodos de pagamento...\n');

    // Login
    console.log('1. Fazendo login...');
    const token = await login('empresa1', 'senha123');
    console.log('✅ Login realizado com sucesso\n');

    // Criar venda com múltiplos métodos de pagamento
    console.log('2. Criando venda com múltiplos métodos de pagamento...');
    const sale = await createSaleWithMultiplePayments(token, 'empresa1');
    console.log('✅ Venda criada com sucesso');
    console.log('📋 Detalhes da venda:', JSON.stringify(sale, null, 2));
    console.log();

    // Buscar a venda criada
    console.log('3. Buscando venda criada...');
    const retrievedSale = await getSale(token, sale.id);
    console.log('✅ Venda encontrada');
    console.log('📋 Métodos de pagamento:');
    retrievedSale.paymentMethods.forEach((pm, index) => {
      console.log(`   ${index + 1}. ${pm.method}: R$ ${pm.amount}${pm.additionalInfo ? ` (${pm.additionalInfo})` : ''}`);
    });
    console.log();

    console.log('🎉 Teste concluído com sucesso!');
    console.log('✅ Sistema de múltiplos métodos de pagamento está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    process.exit(1);
  }
}

// Executar teste
if (require.main === module) {
  testMultiplePaymentMethods();
}

module.exports = {
  testMultiplePaymentMethods,
  createSaleWithMultiplePayments,
  getSale
};


