const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testCompanyModule() {
  console.log('🧪 Testando módulo de empresas...\n');

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

    // Teste 2: Listar todas as empresas (como admin)
    console.log('\n2️⃣ Testando listagem de empresas (admin)...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/company`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Listagem de empresas funcionando');
      console.log('   - Quantidade de empresas:', listResponse.data.length);
      console.log('   - Primeira empresa:', listResponse.data[0]?.name);
    } catch (error) {
      console.log('❌ Erro na listagem:', error.response?.data?.message || error.message);
    }

    // Teste 3: Buscar empresa específica
    console.log('\n3️⃣ Testando busca de empresa por ID...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/company`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (listResponse.data.length > 0) {
        const companyId = listResponse.data[0].id;
        const findResponse = await axios.get(`${BASE_URL}/company/${companyId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Busca de empresa por ID funcionando');
        console.log('   - Empresa encontrada:', findResponse.data.name);
        console.log('   - CNPJ:', findResponse.data.cnpj);
        console.log('   - Vendedores:', findResponse.data._count?.sellers || 0);
      } else {
        console.log('⚠️ Nenhuma empresa encontrada para testar busca por ID');
      }
    } catch (error) {
      console.log('❌ Erro na busca por ID:', error.response?.data?.message || error.message);
    }

    // Teste 4: Criar nova empresa
    console.log('\n4️⃣ Testando criação de nova empresa...');
    try {
      const newCompanyData = {
        name: 'Nova Loja Teste LTDA',
        login: 'nova.loja@teste.com',
        password: 'senha123',
        phone: '(11) 99999-8888',
        cnpj: '98.765.432/0001-10',
        email: 'contato@novaloja.com',
        brandColor: '#00FF00',
        zipCode: '04567-890',
        state: 'SP',
        city: 'São Paulo',
        district: 'Vila Madalena',
        street: 'Rua Augusta',
        number: '456',
        complement: 'Sala 2'
      };
      
      const createResponse = await axios.post(`${BASE_URL}/company`, newCompanyData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Criação de empresa funcionando');
      console.log('   - Nova empresa criada:', createResponse.data.name);
      console.log('   - ID:', createResponse.data.id);
      
      const newCompanyId = createResponse.data.id;
      
      // Teste 5: Atualizar empresa
      console.log('\n5️⃣ Testando atualização de empresa...');
      try {
        const updateData = {
          name: 'Nova Loja Teste Atualizada LTDA',
          phone: '(11) 88888-7777',
          brandColor: '#FF00FF'
        };
        
        const updateResponse = await axios.patch(`${BASE_URL}/company/${newCompanyId}`, updateData, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Atualização de empresa funcionando');
        console.log('   - Empresa atualizada:', updateResponse.data.name);
      } catch (error) {
        console.log('❌ Erro na atualização:', error.response?.data?.message || error.message);
      }
      
      // Teste 6: Desativar empresa
      console.log('\n6️⃣ Testando desativação de empresa...');
      try {
        const deactivateResponse = await axios.patch(`${BASE_URL}/company/${newCompanyId}/deactivate`, {}, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Desativação de empresa funcionando');
        console.log('   - Empresa desativada:', deactivateResponse.data.isActive);
      } catch (error) {
        console.log('❌ Erro na desativação:', error.response?.data?.message || error.message);
      }
      
      // Teste 7: Ativar empresa
      console.log('\n7️⃣ Testando ativação de empresa...');
      try {
        const activateResponse = await axios.patch(`${BASE_URL}/company/${newCompanyId}/activate`, {}, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Ativação de empresa funcionando');
        console.log('   - Empresa ativada:', activateResponse.data.isActive);
      } catch (error) {
        console.log('❌ Erro na ativação:', error.response?.data?.message || error.message);
      }
      
      // Teste 8: Remover empresa
      console.log('\n8️⃣ Testando remoção de empresa...');
      try {
        const deleteResponse = await axios.delete(`${BASE_URL}/company/${newCompanyId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Remoção de empresa funcionando');
        console.log('   - Mensagem:', deleteResponse.data.message);
      } catch (error) {
        console.log('❌ Erro na remoção:', error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('❌ Erro na criação:', error.response?.data?.message || error.message);
    }

    // Teste 9: Login como empresa e testar endpoints específicos
    console.log('\n9️⃣ Testando login como empresa...');
    try {
      const companyLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'empresa@example.com',
        password: 'company123'
      });
      
      companyToken = companyLoginResponse.data.access_token;
      console.log('✅ Login empresa realizado com sucesso');
      
      // Teste 10: Obter dados da própria empresa
      console.log('\n🔟 Testando obtenção de dados da própria empresa...');
      try {
        const myCompanyResponse = await axios.get(`${BASE_URL}/company/my-company`, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Obtenção de dados da própria empresa funcionando');
        console.log('   - Empresa:', myCompanyResponse.data.name);
        console.log('   - CNPJ:', myCompanyResponse.data.cnpj);
      } catch (error) {
        console.log('❌ Erro na obtenção de dados:', error.response?.data?.message || error.message);
      }
      
      // Teste 11: Obter estatísticas da empresa
      console.log('\n1️⃣1️⃣ Testando obtenção de estatísticas da empresa...');
      try {
        const statsResponse = await axios.get(`${BASE_URL}/company/stats`, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Obtenção de estatísticas funcionando');
        console.log('   - Vendedores:', statsResponse.data.sellers || 0);
        console.log('   - Produtos:', statsResponse.data.products || 0);
        console.log('   - Vendas:', statsResponse.data.sales || 0);
        console.log('   - Valor total vendas:', statsResponse.data.totalSalesValue || 0);
      } catch (error) {
        console.log('❌ Erro na obtenção de estatísticas:', error.response?.data?.message || error.message);
      }
      
      // Teste 12: Atualizar dados da própria empresa
      console.log('\n1️⃣2️⃣ Testando atualização de dados da própria empresa...');
      try {
        const updateData = {
          phone: '(11) 77777-6666',
          brandColor: '#0000FF'
        };
        
        const updateResponse = await axios.patch(`${BASE_URL}/company/my-company`, updateData, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Atualização de dados da própria empresa funcionando');
        console.log('   - Telefone atualizado:', updateResponse.data.phone);
      } catch (error) {
        console.log('❌ Erro na atualização:', error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('❌ Erro no login empresa:', error.response?.data?.message || error.message);
    }

    // Teste 13: Tentar criar empresa com CNPJ duplicado
    console.log('\n1️⃣3️⃣ Testando criação com CNPJ duplicado...');
    try {
      const duplicateData = {
        name: 'Empresa Duplicada LTDA',
        login: 'duplicada@teste.com',
        password: 'senha123',
        cnpj: '12.345.678/0001-90', // CNPJ já existente
        email: 'duplicada@teste.com'
      };
      
      await axios.post(`${BASE_URL}/company`, duplicateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('❌ Criação com CNPJ duplicado deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Criação com CNPJ duplicado corretamente rejeitada');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    // Teste 14: Tentar acessar sem token
    console.log('\n1️⃣4️⃣ Testando acesso sem token...');
    try {
      await axios.get(`${BASE_URL}/company`);
      console.log('❌ Acesso sem token deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Acesso sem token corretamente rejeitado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Testes do módulo de empresas concluídos!');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  testCompanyModule();
}

module.exports = { testCompanyModule };
