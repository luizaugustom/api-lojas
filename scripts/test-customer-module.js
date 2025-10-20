const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testCustomerModule() {
  console.log('🧪 Testando módulo de clientes...\n');

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

    // Teste 2: Listar clientes (como admin)
    console.log('\n2️⃣ Testando listagem de clientes (admin)...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/customer`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Listagem de clientes funcionando');
      console.log('   - Quantidade de clientes:', listResponse.data.length);
      if (listResponse.data.length > 0) {
        console.log('   - Primeiro cliente:', listResponse.data[0]?.name);
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
      
      // Teste 4: Listar clientes da empresa
      console.log('\n4️⃣ Testando listagem de clientes da empresa...');
      try {
        const companyCustomersResponse = await axios.get(`${BASE_URL}/customer`, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Listagem de clientes da empresa funcionando');
        console.log('   - Quantidade de clientes:', companyCustomersResponse.data.length);
        if (companyCustomersResponse.data.length > 0) {
          console.log('   - Primeiro cliente:', companyCustomersResponse.data[0]?.name);
        }
      } catch (error) {
        console.log('❌ Erro na listagem de clientes da empresa:', error.response?.data?.message || error.message);
      }
      
      // Teste 5: Criar novo cliente
      console.log('\n5️⃣ Testando criação de novo cliente...');
      try {
        const newCustomerData = {
          name: 'Cliente Teste LTDA',
          phone: '(11) 99999-7777',
          email: 'cliente@teste.com',
          cpfCnpj: '123.456.789-00',
          zipCode: '01234-567',
          state: 'SP',
          city: 'São Paulo',
          district: 'Centro',
          street: 'Rua Teste',
          number: '123',
          complement: 'Apto 1'
        };
        
        const createResponse = await axios.post(`${BASE_URL}/customer`, newCustomerData, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Criação de cliente funcionando');
        console.log('   - Cliente criado:', createResponse.data.name);
        console.log('   - ID:', createResponse.data.id);
        
        const newCustomerId = createResponse.data.id;
        
        // Teste 6: Buscar cliente por ID
        console.log('\n6️⃣ Testando busca de cliente por ID...');
        try {
          const findResponse = await axios.get(`${BASE_URL}/customer/${newCustomerId}`, {
            headers: { Authorization: `Bearer ${companyToken}` }
          });
          console.log('✅ Busca de cliente por ID funcionando');
          console.log('   - Cliente encontrado:', findResponse.data.name);
          console.log('   - Telefone:', findResponse.data.phone);
        } catch (error) {
          console.log('❌ Erro na busca por ID:', error.response?.data?.message || error.message);
        }
        
        // Teste 7: Atualizar cliente
        console.log('\n7️⃣ Testando atualização de cliente...');
        try {
          const updateData = {
            name: 'Cliente Teste Atualizado LTDA',
            phone: '(11) 88888-6666',
            email: 'cliente.atualizado@teste.com'
          };
          
          const updateResponse = await axios.patch(`${BASE_URL}/customer/${newCustomerId}`, updateData, {
            headers: { Authorization: `Bearer ${companyToken}` }
          });
          console.log('✅ Atualização de cliente funcionando');
          console.log('   - Cliente atualizado:', updateResponse.data.name);
          console.log('   - Novo telefone:', updateResponse.data.phone);
        } catch (error) {
          console.log('❌ Erro na atualização:', error.response?.data?.message || error.message);
        }
        
        // Teste 8: Remover cliente
        console.log('\n8️⃣ Testando remoção de cliente...');
        try {
          const deleteResponse = await axios.delete(`${BASE_URL}/customer/${newCustomerId}`, {
            headers: { Authorization: `Bearer ${companyToken}` }
          });
          console.log('✅ Remoção de cliente funcionando');
          console.log('   - Mensagem:', deleteResponse.data.message);
        } catch (error) {
          console.log('❌ Erro na remoção:', error.response?.data?.message || error.message);
        }
        
      } catch (error) {
        console.log('❌ Erro na criação:', error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('❌ Erro no login empresa:', error.response?.data?.message || error.message);
    }

    // Teste 9: Busca com filtro
    console.log('\n9️⃣ Testando busca com filtro...');
    try {
      const searchResponse = await axios.get(`${BASE_URL}/customer?search=Maria`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Busca com filtro funcionando');
      console.log('   - Resultados encontrados:', searchResponse.data.length);
    } catch (error) {
      console.log('❌ Erro na busca com filtro:', error.response?.data?.message || error.message);
    }

    // Teste 10: Tentar acessar sem token
    console.log('\n🔟 Testando acesso sem token...');
    try {
      await axios.get(`${BASE_URL}/customer`);
      console.log('❌ Acesso sem token deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Acesso sem token corretamente rejeitado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Testes do módulo de clientes concluídos!');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  testCustomerModule();
}

module.exports = { testCustomerModule };
