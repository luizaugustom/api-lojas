const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testFrontendSimulation() {
  console.log('🧪 Simulando exatamente o que o frontend faz...\n');

  try {
    // 1. Fazer login (simulando o useAuth hook)
    console.log('1️⃣ Fazendo login (simulando useAuth)...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      login: 'teste@montshop.com',
      password: '123456'
    });

    const token = loginResponse.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Login realizado com sucesso\n');

    // 2. Simular exatamente a consulta que o frontend faz
    console.log('2️⃣ Simulando consulta do frontend...');
    console.log('   URL: GET /fiscal?documentType=inbound&search=');
    
    const response = await axios.get(`${API_BASE}/fiscal?documentType=inbound&search=`, { headers });
    const data = response.data;
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Estrutura da resposta:`, JSON.stringify(data, null, 2));

    // 3. Simular exatamente o processamento que o frontend faz
    console.log('\n3️⃣ Simulando processamento do frontend...');
    
    // Simular o useMemo do frontend
    const raw = data;
    const list = Array.isArray(raw) ? raw : raw?.data || raw?.documents || raw?.items || [];
    
    console.log(`📊 Lista extraída: ${list.length} itens`);
    console.log(`📊 Tipo da lista:`, Array.isArray(list) ? 'Array' : typeof list);
    
    if (list.length > 0) {
      console.log('📋 Itens na lista:');
      list.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.documentType} #${item.documentNumber}`);
        console.log(`      - ID: ${item.id}`);
        console.log(`      - Status: ${item.status}`);
        console.log(`      - Valor: R$ ${item.totalValue || 0}`);
      });
    } else {
      console.log('❌ Lista vazia!');
    }

    // 4. Simular a renderização (docs)
    console.log('\n4️⃣ Simulando docs finais...');
    const docs = list; // Agora sem filtro adicional
    
    console.log(`📊 Documentos finais para renderizar: ${docs.length}`);
    
    if (docs.length > 0) {
      console.log('📋 Documentos que aparecerão na página:');
      docs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.documentType} #${doc.documentNumber} - ${doc.status} - R$ ${doc.totalValue || 0}`);
      });
    } else {
      console.log('❌ Nenhum documento para renderizar!');
    }

    // 5. Verificar se há problemas de estrutura
    console.log('\n5️⃣ Verificando estrutura da resposta...');
    console.log(`📊 data é array? ${Array.isArray(data)}`);
    console.log(`📊 data.documents existe? ${!!data.documents}`);
    console.log(`📊 data.documents é array? ${Array.isArray(data.documents)}`);
    console.log(`📊 data.data existe? ${!!data.data}`);
    console.log(`📊 data.items existe? ${!!data.items}`);

    console.log('\n✅ Simulação do frontend concluída!');

  } catch (error) {
    console.error('❌ Erro na simulação:', error.response?.data || error.message);
  }
}

// Executar teste
testFrontendSimulation();

