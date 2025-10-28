const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testInboundInvoicesAPI() {
  console.log('🧪 Testando API da página inbound-invoices...\n');

  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      login: 'teste@montshop.com',
      password: '123456'
    });

    const token = loginResponse.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Login realizado com sucesso\n');

    // 2. Testar exatamente a mesma consulta que a página inbound-invoices faz
    console.log('2️⃣ Testando consulta da página inbound-invoices...');
    console.log('   URL: GET /fiscal?documentType=inbound');
    
    const inboundResponse = await axios.get(`${API_BASE}/fiscal?documentType=inbound`, { headers });
    
    console.log(`📊 Status da resposta: ${inboundResponse.status}`);
    console.log(`📊 Estrutura da resposta:`, JSON.stringify(inboundResponse.data, null, 2));
    
    if (inboundResponse.data.documents && inboundResponse.data.documents.length > 0) {
      console.log(`\n📋 Documentos de entrada encontrados: ${inboundResponse.data.documents.length}`);
      inboundResponse.data.documents.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.documentType} #${doc.documentNumber}`);
        console.log(`      - ID: ${doc.id}`);
        console.log(`      - Status: ${doc.status}`);
        console.log(`      - Valor: R$ ${doc.totalValue || 0}`);
        console.log(`      - Data: ${doc.emissionDate || doc.createdAt}`);
        console.log(`      - XML Content: ${doc.xmlContent ? 'Sim' : 'Não'}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum documento de entrada encontrado');
    }

    // 3. Testar com parâmetros de busca
    console.log('3️⃣ Testando com parâmetros de busca...');
    const searchResponse = await axios.get(`${API_BASE}/fiscal?documentType=inbound&search=`, { headers });
    console.log(`📊 Documentos com busca vazia: ${searchResponse.data.documents?.length || 0}`);

    // 4. Verificar se há problemas de autenticação/autorização
    console.log('4️⃣ Verificando permissões...');
    const userInfo = loginResponse.data.user;
    console.log(`📊 Usuário logado: ${userInfo.login}`);
    console.log(`📊 Role: ${userInfo.role}`);
    console.log(`📊 Company ID: ${userInfo.companyId || 'N/A'}`);

    // 5. Testar consulta sem filtro para comparar
    console.log('5️⃣ Comparando com consulta sem filtro...');
    const allResponse = await axios.get(`${API_BASE}/fiscal`, { headers });
    console.log(`📊 Total de documentos: ${allResponse.data.documents?.length || 0}`);
    
    if (allResponse.data.documents && allResponse.data.documents.length > 0) {
      console.log('📋 Todos os documentos:');
      allResponse.data.documents.forEach(doc => {
        console.log(`   - ${doc.documentType} #${doc.documentNumber} - ${doc.status}`);
      });
    }

    console.log('\n✅ Teste da API concluído!');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error(`📊 Status HTTP: ${error.response.status}`);
    }
  }
}

// Executar teste
testInboundInvoicesAPI();

