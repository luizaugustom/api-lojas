const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testInboundInvoices() {
  console.log('🧪 Testando listagem de notas fiscais de entrada...\n');

  try {
    // 1. Fazer login como empresa
    console.log('1️⃣ Fazendo login como empresa...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      login: 'teste@montshop.com',
      password: '123456'
    });

    const token = loginResponse.data.access_token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('✅ Login realizado com sucesso\n');

    // 2. Testar listagem de documentos fiscais sem filtro
    console.log('2️⃣ Testando listagem geral de documentos fiscais...');
    const allDocsResponse = await axios.get(`${API_BASE}/fiscal`, { headers });
    console.log(`📊 Total de documentos: ${allDocsResponse.data.documents?.length || 0}`);
    
    if (allDocsResponse.data.documents?.length > 0) {
      console.log('📋 Tipos de documentos encontrados:');
      const types = [...new Set(allDocsResponse.data.documents.map(d => d.documentType))];
      types.forEach(type => console.log(`   - ${type}`));
    }
    console.log('');

    // 3. Testar listagem específica de documentos de entrada
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

    // 4. Testar upload de XML de entrada (se houver arquivo de teste)
    console.log('4️⃣ Testando upload de XML de entrada...');
    try {
      // Criar um XML de teste simples
      const testXml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe35240114200166000187550010000000071234567890">
      <ide>
        <nNF>123456</nNF>
        <dhEmi>2024-01-15T10:00:00-03:00</dhEmi>
        <tpEmis>1</tpEmis>
      </ide>
      <emit>
        <CNPJ>14200166000187</CNPJ>
        <xNome>Fornecedor Teste</xNome>
      </emit>
      <det>
        <prod>
          <CFOP>1102</CFOP>
          <xProd>Produto de Entrada</xProd>
          <vProd>100.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vNF>100.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe>
    <infProt>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

      const formData = new FormData();
      const blob = new Blob([testXml], { type: 'application/xml' });
      formData.append('xmlFile', blob, 'teste-entrada.xml');

      const uploadResponse = await axios.post(`${API_BASE}/fiscal/upload-xml`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ XML de entrada enviado com sucesso');
      console.log(`📄 Documento criado: ${uploadResponse.data.documentType} #${uploadResponse.data.documentNumber}`);
      console.log('');

      // 5. Verificar se o documento aparece na listagem de entrada
      console.log('5️⃣ Verificando se documento aparece na listagem de entrada...');
      const updatedInboundResponse = await axios.get(`${API_BASE}/fiscal?documentType=inbound`, { headers });
      console.log(`📊 Documentos de entrada após upload: ${updatedInboundResponse.data.documents?.length || 0}`);
      
      if (updatedInboundResponse.data.documents?.length > 0) {
        console.log('📋 Documentos de entrada atualizados:');
        updatedInboundResponse.data.documents.forEach(doc => {
          console.log(`   - ${doc.documentType} #${doc.documentNumber} - ${doc.status} - R$ ${doc.totalValue || 0}`);
        });
      }

    } catch (uploadError) {
      console.log('⚠️ Erro no upload de XML:', uploadError.response?.data?.message || uploadError.message);
    }

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.response?.data?.message || error.message);
  }
}

// Executar teste
testInboundInvoices();
