const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSaleModule() {
  console.log('🧪 Testando módulo de vendas...\n');

  let adminToken = '';
  let companyToken = '';
  let sellerToken = '';

  try {
    // Primeiro, fazer login como admin para obter o token
    console.log('1️⃣ Fazendo login como admin...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      login: 'admin@example.com',
      password: 'admin123'
    });
    
    adminToken = adminLoginResponse.data.access_token;
    console.log('✅ Login admin realizado com sucesso');

    // Teste 2: Listar vendas (como admin)
    console.log('\n2️⃣ Testando listagem de vendas (admin)...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/sale`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Listagem de vendas funcionando');
      console.log('   - Quantidade de vendas:', listResponse.data.length);
      if (listResponse.data.length > 0) {
        console.log('   - Primeira venda:', listResponse.data[0]?.id);
        console.log('   - Total:', listResponse.data[0]?.total);
      }
    } catch (error) {
      console.log('❌ Erro na listagem:', error.response?.data?.message || error.message);
    }

    // Teste 3: Login como empresa
    console.log('\n3️⃣ Testando login como empresa...');
    try {
      const companyLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'empresa@example.com',
        password: 'company123'
      });
      
      companyToken = companyLoginResponse.data.access_token;
      console.log('✅ Login empresa realizado com sucesso');
      
      // Teste 4: Listar vendas da empresa
      console.log('\n4️⃣ Testando listagem de vendas da empresa...');
      try {
        const companySalesResponse = await axios.get(`${BASE_URL}/sale`, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Listagem de vendas da empresa funcionando');
        console.log('   - Quantidade de vendas:', companySalesResponse.data.length);
      } catch (error) {
        console.log('❌ Erro na listagem de vendas da empresa:', error.response?.data?.message || error.message);
      }
      
      // Teste 5: Obter estatísticas de vendas
      console.log('\n5️⃣ Testando obtenção de estatísticas de vendas...');
      try {
        const statsResponse = await axios.get(`${BASE_URL}/sale/stats`, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Obtenção de estatísticas funcionando');
        console.log('   - Total de vendas:', statsResponse.data.totalSales);
        console.log('   - Valor total:', statsResponse.data.totalValue);
      } catch (error) {
        console.log('❌ Erro na obtenção de estatísticas:', error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('❌ Erro no login empresa:', error.response?.data?.message || error.message);
    }

    // Teste 6: Login como vendedor
    console.log('\n6️⃣ Testando login como vendedor...');
    try {
      const sellerLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'vendedor@example.com',
        password: 'seller123'
      });
      
      sellerToken = sellerLoginResponse.data.access_token;
      console.log('✅ Login vendedor realizado com sucesso');
      
      // Teste 7: Criar nova venda
      console.log('\n7️⃣ Testando criação de nova venda...');
      try {
        // Primeiro, buscar produtos disponíveis
        const productsResponse = await axios.get(`${BASE_URL}/product`, {
          headers: { Authorization: `Bearer ${sellerToken}` }
        });
        
        if (productsResponse.data.products.length > 0) {
          const product = productsResponse.data.products[0];
          
          const newSaleData = {
            items: [
              {
                productId: product.id,
                quantity: 2,
                unitPrice: product.price
              }
            ],
            paymentMethods: [
              {
                method: 'cash',
                amount: product.price * 2
              }
            ],
            clientName: 'Cliente Teste',
            clientCpfCnpj: '123.456.789-00',
            change: 0
          };
          
          const createResponse = await axios.post(`${BASE_URL}/sale`, newSaleData, {
            headers: { Authorization: `Bearer ${sellerToken}` }
          });
          console.log('✅ Criação de venda funcionando');
          console.log('   - Venda criada:', createResponse.data.id);
          console.log('   - Total:', createResponse.data.total);
          
          const newSaleId = createResponse.data.id;
          
          // Teste 8: Buscar venda por ID
          console.log('\n8️⃣ Testando busca de venda por ID...');
          try {
            const findResponse = await axios.get(`${BASE_URL}/sale/${newSaleId}`, {
              headers: { Authorization: `Bearer ${sellerToken}` }
            });
            console.log('✅ Busca de venda por ID funcionando');
            console.log('   - Venda encontrada:', findResponse.data.id);
            console.log('   - Cliente:', findResponse.data.clientName);
          } catch (error) {
            console.log('❌ Erro na busca por ID:', error.response?.data?.message || error.message);
          }
          
        } else {
          console.log('⚠️ Nenhum produto encontrado para criar venda');
        }
        
      } catch (error) {
        console.log('❌ Erro na criação:', error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('❌ Erro no login vendedor:', error.response?.data?.message || error.message);
    }

    // Teste 9: Busca com filtro por data
    console.log('\n9️⃣ Testando busca com filtro por data...');
    try {
      const today = new Date().toISOString().split('T')[0];
      const searchResponse = await axios.get(`${BASE_URL}/sale?startDate=${today}&endDate=${today}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Busca com filtro por data funcionando');
      console.log('   - Vendas encontradas:', searchResponse.data.length);
    } catch (error) {
      console.log('❌ Erro na busca com filtro por data:', error.response?.data?.message || error.message);
    }

    // Teste 10: Tentar acessar sem token
    console.log('\n🔟 Testando acesso sem token...');
    try {
      await axios.get(`${BASE_URL}/sale`);
      console.log('❌ Acesso sem token deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Acesso sem token corretamente rejeitado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Testes do módulo de vendas concluídos!');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  testSaleModule();
}

module.exports = { testSaleModule };
