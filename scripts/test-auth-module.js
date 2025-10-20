const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuthModule() {
  console.log('🧪 Testando módulo de autenticação...\n');

  try {
    // Teste 1: Login com credenciais válidas de admin
    console.log('1️⃣ Testando login de admin...');
    try {
      const adminResponse = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'admin@example.com',
        password: 'admin123'
      });
      
      console.log('✅ Login admin bem-sucedido');
      console.log('   - Token recebido:', adminResponse.data.access_token ? 'Sim' : 'Não');
      console.log('   - Usuário:', adminResponse.data.user);
      
      const adminToken = adminResponse.data.access_token;
      
      // Teste 2: Verificar se o token funciona em uma rota protegida
      console.log('\n2️⃣ Testando acesso com token de admin...');
      try {
        const protectedResponse = await axios.get(`${BASE_URL}/admin`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Acesso protegido com token admin funcionando');
      } catch (error) {
        console.log('❌ Erro no acesso protegido:', error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('❌ Erro no login admin:', error.response?.data?.message || error.message);
    }

    // Teste 3: Login com credenciais válidas de empresa
    console.log('\n3️⃣ Testando login de empresa...');
    try {
      const companyResponse = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'empresa@example.com',
        password: 'company123'
      });
      
      console.log('✅ Login empresa bem-sucedido');
      console.log('   - Token recebido:', companyResponse.data.access_token ? 'Sim' : 'Não');
      console.log('   - Usuário:', companyResponse.data.user);
      
      const companyToken = companyResponse.data.access_token;
      
      // Teste 4: Verificar se o token funciona em uma rota protegida
      console.log('\n4️⃣ Testando acesso com token de empresa...');
      try {
        const protectedResponse = await axios.get(`${BASE_URL}/company`, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Acesso protegido com token empresa funcionando');
      } catch (error) {
        console.log('❌ Erro no acesso protegido:', error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('❌ Erro no login empresa:', error.response?.data?.message || error.message);
    }

    // Teste 5: Login com credenciais válidas de vendedor
    console.log('\n5️⃣ Testando login de vendedor...');
    try {
      const sellerResponse = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'vendedor@example.com',
        password: 'seller123'
      });
      
      console.log('✅ Login vendedor bem-sucedido');
      console.log('   - Token recebido:', sellerResponse.data.access_token ? 'Sim' : 'Não');
      console.log('   - Usuário:', sellerResponse.data.user);
      
      const sellerToken = sellerResponse.data.access_token;
      
      // Teste 6: Verificar se o token funciona em uma rota protegida
      console.log('\n6️⃣ Testando acesso com token de vendedor...');
      try {
        const protectedResponse = await axios.get(`${BASE_URL}/seller`, {
          headers: { Authorization: `Bearer ${sellerToken}` }
        });
        console.log('✅ Acesso protegido com token vendedor funcionando');
      } catch (error) {
        console.log('❌ Erro no acesso protegido:', error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('❌ Erro no login vendedor:', error.response?.data?.message || error.message);
    }

    // Teste 7: Login com credenciais inválidas
    console.log('\n7️⃣ Testando login com credenciais inválidas...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        login: 'invalid@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ Login com credenciais inválidas deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Login com credenciais inválidas corretamente rejeitado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    // Teste 8: Acesso sem token
    console.log('\n8️⃣ Testando acesso sem token...');
    try {
      await axios.get(`${BASE_URL}/admin`);
      console.log('❌ Acesso sem token deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Acesso sem token corretamente rejeitado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    // Teste 9: Token inválido
    console.log('\n9️⃣ Testando acesso com token inválido...');
    try {
      await axios.get(`${BASE_URL}/admin`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ Acesso com token inválido deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Acesso com token inválido corretamente rejeitado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Testes do módulo de autenticação concluídos!');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  testAuthModule();
}

module.exports = { testAuthModule };
