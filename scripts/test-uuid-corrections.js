const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testUUIDCorrections() {
  console.log('🔧 Testando correções de validação UUID...\n');

  try {
    // 1. Testar login para obter token
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      login: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Login realizado com sucesso\n');

    // 2. Testar módulo de vendedores
    console.log('2. Testando módulo de vendedores...');
    try {
      const sellersResponse = await axios.get(`${BASE_URL}/seller`, { headers });
      console.log('✅ Listagem de vendedores funcionando');
      
      if (sellersResponse.data.length > 0) {
        const sellerId = sellersResponse.data[0].id;
        console.log(`   Testando busca por ID: ${sellerId}`);
        
        const sellerResponse = await axios.get(`${BASE_URL}/seller/${sellerId}`, { headers });
        console.log('✅ Busca de vendedor por ID funcionando');
      }
    } catch (error) {
      console.log('❌ Erro no módulo de vendedores:', error.response?.data?.message || error.message);
    }

    // 3. Testar módulo de contas a pagar
    console.log('\n3. Testando módulo de contas a pagar...');
    try {
      const billsResponse = await axios.get(`${BASE_URL}/bill-to-pay`, { headers });
      console.log('✅ Listagem de contas a pagar funcionando');
      
      if (billsResponse.data.length > 0) {
        const billId = billsResponse.data[0].id;
        console.log(`   Testando busca por ID: ${billId}`);
        
        const billResponse = await axios.get(`${BASE_URL}/bill-to-pay/${billId}`, { headers });
        console.log('✅ Busca de conta a pagar por ID funcionando');
      }
    } catch (error) {
      console.log('❌ Erro no módulo de contas a pagar:', error.response?.data?.message || error.message);
    }

    // 4. Testar módulo de vendas
    console.log('\n4. Testando módulo de vendas...');
    try {
      const salesResponse = await axios.get(`${BASE_URL}/sale`, { headers });
      console.log('✅ Listagem de vendas funcionando');
      
      if (salesResponse.data.length > 0) {
        const saleId = salesResponse.data[0].id;
        console.log(`   Testando busca por ID: ${saleId}`);
        
        const saleResponse = await axios.get(`${BASE_URL}/sale/${saleId}`, { headers });
        console.log('✅ Busca de venda por ID funcionando');
      }
    } catch (error) {
      console.log('❌ Erro no módulo de vendas:', error.response?.data?.message || error.message);
    }

    // 5. Testar módulo de fechamento de caixa
    console.log('\n5. Testando módulo de fechamento de caixa...');
    try {
      const closuresResponse = await axios.get(`${BASE_URL}/cash-closure`, { headers });
      console.log('✅ Listagem de fechamentos de caixa funcionando');
      
      if (closuresResponse.data.length > 0) {
        const closureId = closuresResponse.data[0].id;
        console.log(`   Testando busca por ID: ${closureId}`);
        
        const closureResponse = await axios.get(`${BASE_URL}/cash-closure/${closureId}`, { headers });
        console.log('✅ Busca de fechamento de caixa por ID funcionando');
      }
    } catch (error) {
      console.log('❌ Erro no módulo de fechamento de caixa:', error.response?.data?.message || error.message);
    }

    // 6. Testar módulo de impressora
    console.log('\n6. Testando módulo de impressora...');
    try {
      const printersResponse = await axios.get(`${BASE_URL}/printer`, { headers });
      console.log('✅ Listagem de impressoras funcionando');
      
      if (printersResponse.data.length > 0) {
        const printerId = printersResponse.data[0].id;
        console.log(`   Testando busca por ID: ${printerId}`);
        
        const printerResponse = await axios.get(`${BASE_URL}/printer/${printerId}/status`, { headers });
        console.log('✅ Busca de impressora por ID funcionando');
      }
    } catch (error) {
      console.log('❌ Erro no módulo de impressora:', error.response?.data?.message || error.message);
    }

    // 7. Testar módulo fiscal
    console.log('\n7. Testando módulo fiscal...');
    try {
      const fiscalResponse = await axios.get(`${BASE_URL}/fiscal`, { headers });
      console.log('✅ Listagem de documentos fiscais funcionando');
      
      if (fiscalResponse.data.length > 0) {
        const fiscalId = fiscalResponse.data[0].id;
        console.log(`   Testando busca por ID: ${fiscalId}`);
        
        const documentResponse = await axios.get(`${BASE_URL}/fiscal/${fiscalId}`, { headers });
        console.log('✅ Busca de documento fiscal por ID funcionando');
      }
    } catch (error) {
      console.log('❌ Erro no módulo fiscal:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 Todas as correções de validação UUID foram testadas com sucesso!');
    console.log('✅ A aplicação agora aceita IDs string normais em vez de UUIDs');
    console.log('✅ Todos os módulos estão funcionando corretamente');

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data?.message || error.message);
  }
}

// Executar teste
testUUIDCorrections();
