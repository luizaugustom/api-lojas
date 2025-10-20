const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAdminModule() {
  console.log('🧪 Testando módulo de administração...\n');

  let adminToken = '';

  try {
    // Primeiro, fazer login como admin para obter o token
    console.log('1️⃣ Fazendo login como admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      login: 'admin@example.com',
      password: 'admin123'
    });
    
    adminToken = loginResponse.data.access_token;
    console.log('✅ Login admin realizado com sucesso');

    // Teste 2: Listar todos os admins
    console.log('\n2️⃣ Testando listagem de admins...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/admin`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Listagem de admins funcionando');
      console.log('   - Quantidade de admins:', listResponse.data.length);
      console.log('   - Primeiro admin:', listResponse.data[0]?.login);
    } catch (error) {
      console.log('❌ Erro na listagem:', error.response?.data?.message || error.message);
    }

    // Teste 3: Buscar admin específico
    console.log('\n3️⃣ Testando busca de admin por ID...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/admin`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (listResponse.data.length > 0) {
        const adminId = listResponse.data[0].id;
        const findResponse = await axios.get(`${BASE_URL}/admin/${adminId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Busca de admin por ID funcionando');
        console.log('   - Admin encontrado:', findResponse.data.login);
        console.log('   - Empresas associadas:', findResponse.data.companies?.length || 0);
      } else {
        console.log('⚠️ Nenhum admin encontrado para testar busca por ID');
      }
    } catch (error) {
      console.log('❌ Erro na busca por ID:', error.response?.data?.message || error.message);
    }

    // Teste 4: Criar novo admin
    console.log('\n4️⃣ Testando criação de novo admin...');
    try {
      const newAdminData = {
        login: 'novo.admin@teste.com',
        password: 'senha123'
      };
      
      const createResponse = await axios.post(`${BASE_URL}/admin`, newAdminData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Criação de admin funcionando');
      console.log('   - Novo admin criado:', createResponse.data.login);
      console.log('   - ID:', createResponse.data.id);
      
      const newAdminId = createResponse.data.id;
      
      // Teste 5: Atualizar admin
      console.log('\n5️⃣ Testando atualização de admin...');
      try {
        const updateData = {
          login: 'admin.atualizado@teste.com',
          password: 'novasenha123'
        };
        
        const updateResponse = await axios.patch(`${BASE_URL}/admin/${newAdminId}`, updateData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Atualização de admin funcionando');
        console.log('   - Admin atualizado:', updateResponse.data.login);
      } catch (error) {
        console.log('❌ Erro na atualização:', error.response?.data?.message || error.message);
      }
      
      // Teste 6: Remover admin
      console.log('\n6️⃣ Testando remoção de admin...');
      try {
        const deleteResponse = await axios.delete(`${BASE_URL}/admin/${newAdminId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Remoção de admin funcionando');
        console.log('   - Mensagem:', deleteResponse.data.message);
      } catch (error) {
        console.log('❌ Erro na remoção:', error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('❌ Erro na criação:', error.response?.data?.message || error.message);
    }

    // Teste 7: Tentar criar admin com login duplicado
    console.log('\n7️⃣ Testando criação com login duplicado...');
    try {
      const duplicateData = {
        login: 'admin@example.com', // Login já existente
        password: 'senha123'
      };
      
      await axios.post(`${BASE_URL}/admin`, duplicateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ Criação com login duplicado deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Criação com login duplicado corretamente rejeitada');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    // Teste 8: Tentar acessar sem token
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

    // Teste 9: Tentar acessar com token de empresa (não admin)
    console.log('\n9️⃣ Testando acesso com token de empresa...');
    try {
      const companyLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'empresa@example.com',
        password: 'company123'
      });
      
      const companyToken = companyLoginResponse.data.access_token;
      
      await axios.get(`${BASE_URL}/admin`, {
        headers: { Authorization: `Bearer ${companyToken}` }
      });
      console.log('❌ Acesso com token de empresa deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Acesso com token de empresa corretamente rejeitado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Testes do módulo de administração concluídos!');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  testAdminModule();
}

module.exports = { testAdminModule };
