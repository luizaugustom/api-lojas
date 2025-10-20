const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testFiscalModule() {
  console.log('🧪 Testando módulo fiscal...\n');

  let adminToken = '';
  let companyToken = '';

  try {
    // Primeiro, fazer login como admin para obter o token
    console.log('1️⃣ Fazendo login como admin...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      login: 'admin@example.com',
      password: 'admin123'
    });
    
    adminToken = adminLoginResponse.data.access_token;
    console.log('✅ Login admin realizado com sucesso');

    // Teste 2: Listar documentos fiscais (como admin)
    console.log('\n2️⃣ Testando listagem de documentos fiscais (admin)...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/fiscal`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Listagem de documentos fiscais funcionando');
      console.log('   - Quantidade de documentos:', listResponse.data.length);
      if (listResponse.data.length > 0) {
        console.log('   - Primeiro documento:', listResponse.data[0]?.documentNumber);
        console.log('   - Tipo:', listResponse.data[0]?.documentType);
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
      
      // Teste 4: Listar documentos fiscais da empresa
      console.log('\n4️⃣ Testando listagem de documentos fiscais da empresa...');
      try {
        const companyFiscalResponse = await axios.get(`${BASE_URL}/fiscal`, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Listagem de documentos fiscais da empresa funcionando');
        console.log('   - Quantidade de documentos:', companyFiscalResponse.data.length);
      } catch (error) {
        console.log('❌ Erro na listagem de documentos fiscais da empresa:', error.response?.data?.message || error.message);
      }
      
      // Teste 5: Obter estatísticas fiscais
      console.log('\n5️⃣ Testando obtenção de estatísticas fiscais...');
      try {
        const statsResponse = await axios.get(`${BASE_URL}/fiscal/stats`, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Obtenção de estatísticas funcionando');
        console.log('   - Total de documentos:', statsResponse.data.totalDocuments);
        console.log('   - Documentos emitidos:', statsResponse.data.issuedDocuments);
      } catch (error) {
        console.log('❌ Erro na obtenção de estatísticas:', error.response?.data?.message || error.message);
      }
      
      // Teste 6: Gerar NFCe (simulação)
      console.log('\n6️⃣ Testando geração de NFCe...');
      try {
        const nfceData = {
          saleId: 'test-sale-id',
          customerCpfCnpj: '123.456.789-00',
          customerName: 'Cliente Teste',
          items: [
            {
              productId: 'test-product-id',
              quantity: 1,
              unitPrice: 100.00,
              totalPrice: 100.00
            }
          ],
          total: 100.00,
          paymentMethod: 'cash'
        };
        
        const nfceResponse = await axios.post(`${BASE_URL}/fiscal/nfce`, nfceData, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Geração de NFCe funcionando');
        console.log('   - NFCe gerada:', nfceResponse.data.documentNumber);
        console.log('   - Status:', nfceResponse.data.status);
      } catch (error) {
        console.log('❌ Erro na geração de NFCe:', error.response?.data?.message || error.message);
      }
      
      // Teste 7: Gerar NFe (simulação)
      console.log('\n7️⃣ Testando geração de NFe...');
      try {
        const nfeData = {
          customerCpfCnpj: '123.456.789-00',
          customerName: 'Cliente Teste',
          customerEmail: 'cliente@teste.com',
          items: [
            {
              productId: 'test-product-id',
              quantity: 1,
              unitPrice: 100.00,
              totalPrice: 100.00
            }
          ],
          total: 100.00,
          paymentMethod: 'cash'
        };
        
        const nfeResponse = await axios.post(`${BASE_URL}/fiscal/nfe`, nfeData, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Geração de NFe funcionando');
        console.log('   - NFe gerada:', nfeResponse.data.documentNumber);
        console.log('   - Status:', nfeResponse.data.status);
      } catch (error) {
        console.log('❌ Erro na geração de NFe:', error.response?.data?.message || error.message);
      }
      
      // Teste 8: Gerar NFSe (simulação)
      console.log('\n8️⃣ Testando geração de NFSe...');
      try {
        const nfseData = {
          customerCpfCnpj: '123.456.789-00',
          customerName: 'Cliente Teste',
          serviceDescription: 'Serviço de teste',
          serviceValue: 100.00,
          total: 100.00
        };
        
        const nfseResponse = await axios.post(`${BASE_URL}/fiscal/nfse`, nfseData, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Geração de NFSe funcionando');
        console.log('   - NFSe gerada:', nfseResponse.data.documentNumber);
        console.log('   - Status:', nfseResponse.data.status);
      } catch (error) {
        console.log('❌ Erro na geração de NFSe:', error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('❌ Erro no login empresa:', error.response?.data?.message || error.message);
    }

    // Teste 9: Busca com filtro por tipo de documento
    console.log('\n9️⃣ Testando busca com filtro por tipo...');
    try {
      const searchResponse = await axios.get(`${BASE_URL}/fiscal?type=NFCe`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Busca com filtro por tipo funcionando');
      console.log('   - Documentos encontrados:', searchResponse.data.length);
    } catch (error) {
      console.log('❌ Erro na busca com filtro por tipo:', error.response?.data?.message || error.message);
    }

    // Teste 10: Tentar acessar sem token
    console.log('\n🔟 Testando acesso sem token...');
    try {
      await axios.get(`${BASE_URL}/fiscal`);
      console.log('❌ Acesso sem token deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Acesso sem token corretamente rejeitado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Testes do módulo fiscal concluídos!');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  testFiscalModule();
}

module.exports = { testFiscalModule };
