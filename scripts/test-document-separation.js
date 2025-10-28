const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testDocumentSeparation() {
  console.log('🧪 Testando separação de documentos fiscais...\n');

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

    // 2. Testar listagem geral de documentos fiscais
    console.log('2️⃣ Testando listagem geral de documentos fiscais...');
    const allDocsResponse = await axios.get(`${API_BASE}/fiscal`, { headers });
    console.log(`📊 Total de documentos: ${allDocsResponse.data.documents?.length || 0}`);
    
    if (allDocsResponse.data.documents?.length > 0) {
      console.log('📋 Todos os documentos:');
      allDocsResponse.data.documents.forEach(doc => {
        console.log(`   - ${doc.documentType} #${doc.documentNumber} - ${doc.status} - R$ ${doc.totalValue || 0}`);
      });
    }
    console.log('');

    // 3. Testar listagem de documentos de entrada (inbound)
    console.log('3️⃣ Testando listagem de documentos de entrada (inbound)...');
    const inboundResponse = await axios.get(`${API_BASE}/fiscal?documentType=inbound`, { headers });
    console.log(`📊 Documentos de entrada encontrados: ${inboundResponse.data.documents?.length || 0}`);
    
    if (inboundResponse.data.documents?.length > 0) {
      console.log('📋 Documentos de entrada:');
      inboundResponse.data.documents.forEach(doc => {
        console.log(`   - ${doc.documentType} #${doc.documentNumber} - ${doc.status} - R$ ${doc.totalValue || 0}`);
      });
    }
    console.log('');

    // 4. Testar listagem de documentos de saída (outbound)
    console.log('4️⃣ Testando listagem de documentos de saída (outbound)...');
    const outboundResponse = await axios.get(`${API_BASE}/fiscal?documentType=outbound`, { headers });
    console.log(`📊 Documentos de saída encontrados: ${outboundResponse.data.documents?.length || 0}`);
    
    if (outboundResponse.data.documents?.length > 0) {
      console.log('📋 Documentos de saída:');
      outboundResponse.data.documents.forEach(doc => {
        console.log(`   - ${doc.documentType} #${doc.documentNumber} - ${doc.status} - R$ ${doc.totalValue || 0}`);
      });
    }
    console.log('');

    // 5. Verificar se não há sobreposição
    const inboundIds = new Set((inboundResponse.data.documents || []).map(d => d.id));
    const outboundIds = new Set((outboundResponse.data.documents || []).map(d => d.id));
    const overlap = [...inboundIds].filter(id => outboundIds.has(id));
    
    if (overlap.length > 0) {
      console.log('⚠️ ATENÇÃO: Documentos aparecem em ambas as listas:');
      overlap.forEach(id => console.log(`   - ID: ${id}`));
    } else {
      console.log('✅ Separação perfeita: nenhum documento aparece em ambas as listas');
    }

    // 6. Verificar se a soma bate
    const totalInbound = inboundResponse.data.documents?.length || 0;
    const totalOutbound = outboundResponse.data.documents?.length || 0;
    const totalAll = allDocsResponse.data.documents?.length || 0;
    
    console.log(`\n📊 Resumo:`);
    console.log(`   - Total geral: ${totalAll}`);
    console.log(`   - Documentos de entrada: ${totalInbound}`);
    console.log(`   - Documentos de saída: ${totalOutbound}`);
    console.log(`   - Soma (entrada + saída): ${totalInbound + totalOutbound}`);
    
    if (totalInbound + totalOutbound === totalAll) {
      console.log('✅ Contagem perfeita: entrada + saída = total');
    } else {
      console.log('⚠️ Diferença na contagem - pode haver documentos não classificados');
    }

    console.log('\n✅ Teste de separação concluído!');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.response?.data?.message || error.message);
  }
}

// Executar teste
testDocumentSeparation();

