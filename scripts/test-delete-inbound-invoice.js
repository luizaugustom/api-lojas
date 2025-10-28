/**
 * Script de teste para exclusão de notas fiscais de entrada
 * 
 * Este script demonstra como usar o novo endpoint DELETE /fiscal/inbound-invoice/:id
 */

const axios = require('axios');

// Configurações
const API_URL = 'http://localhost:3000/api';
const COMPANY_LOGIN = 'loja01';
const COMPANY_PASSWORD = 'senha123';

let authToken = '';
let companyId = '';

/**
 * Função para fazer login e obter token de autenticação
 */
async function login() {
  console.log('🔐 Fazendo login...');
  try {
    const response = await axios.post(`${API_URL}/auth/company/login`, {
      login: COMPANY_LOGIN,
      password: COMPANY_PASSWORD
    });
    
    authToken = response.data.access_token;
    companyId = response.data.company.id;
    console.log('✅ Login realizado com sucesso');
    console.log(`   Company ID: ${companyId}`);
    return true;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Função para criar uma nota fiscal de entrada de teste
 */
async function createTestInboundInvoice() {
  console.log('\n📝 Criando nota fiscal de entrada de teste...');
  try {
    // Gerar chave de acesso única para teste
    const timestamp = Date.now().toString().substring(4, 13);
    const accessKey = `35240114200166000187550010000000${timestamp}`.padEnd(44, '0');
    
    const response = await axios.post(
      `${API_URL}/fiscal/inbound-invoice`,
      {
        accessKey: accessKey,
        supplierName: 'Fornecedor Teste Ltda',
        totalValue: 1500.50,
        documentNumber: '123456'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Nota fiscal de entrada criada com sucesso');
    console.log('   Dados:', {
      id: response.data.id,
      documentNumber: response.data.documentNumber,
      accessKey: response.data.accessKey,
      totalValue: response.data.totalValue
    });
    
    return response.data.id;
  } catch (error) {
    console.error('❌ Erro ao criar nota fiscal de entrada:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Função para listar notas fiscais de entrada
 */
async function listInboundInvoices() {
  console.log('\n📋 Listando notas fiscais de entrada...');
  try {
    const response = await axios.get(
      `${API_URL}/fiscal?documentType=inbound&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log(`✅ Total de notas de entrada: ${response.data.total}`);
    console.log('   Documentos:');
    response.data.documents.forEach(doc => {
      console.log(`   - ID: ${doc.id}`);
      console.log(`     Número: ${doc.documentNumber}`);
      console.log(`     Fornecedor: ${doc.supplierName}`);
      console.log(`     Valor: R$ ${doc.totalValue}`);
      console.log(`     Status: ${doc.status}`);
      console.log('');
    });
    
    return response.data.documents;
  } catch (error) {
    console.error('❌ Erro ao listar notas fiscais:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Função para excluir uma nota fiscal de entrada
 */
async function deleteInboundInvoice(invoiceId) {
  console.log(`\n🗑️  Excluindo nota fiscal de entrada ${invoiceId}...`);
  try {
    const response = await axios.delete(
      `${API_URL}/fiscal/inbound-invoice/${invoiceId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    console.log('✅ Nota fiscal de entrada excluída com sucesso');
    console.log('   Resposta:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Erro ao excluir nota fiscal:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Função para tentar excluir uma nota que não é de entrada (deve falhar)
 */
async function testDeleteNonInboundInvoice() {
  console.log('\n🧪 Testando exclusão de nota que não é de entrada (deve falhar)...');
  try {
    // Buscar qualquer nota que não seja de entrada
    const response = await axios.get(
      `${API_URL}/fiscal?documentType=outbound&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (response.data.documents.length > 0) {
      const doc = response.data.documents[0];
      console.log(`   Tentando excluir nota de saída: ${doc.id}`);
      
      await deleteInboundInvoice(doc.id);
      console.log('❌ ERRO: Deveria ter falhado ao tentar excluir nota de saída');
    } else {
      console.log('⚠️  Nenhuma nota de saída encontrada para teste');
    }
  } catch (error) {
    console.log('✅ Teste passou: erro esperado ao tentar excluir nota de saída');
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('='.repeat(70));
  console.log('TESTE DE EXCLUSÃO DE NOTAS FISCAIS DE ENTRADA');
  console.log('='.repeat(70));
  
  // 1. Fazer login
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ Não foi possível fazer login. Encerrando teste.');
    return;
  }
  
  // 2. Criar uma nota fiscal de entrada de teste
  const newInvoiceId = await createTestInboundInvoice();
  if (!newInvoiceId) {
    console.log('\n❌ Não foi possível criar nota de teste. Encerrando teste.');
    return;
  }
  
  // 3. Listar notas antes da exclusão
  console.log('\n--- ANTES DA EXCLUSÃO ---');
  await listInboundInvoices();
  
  // 4. Excluir a nota criada
  await deleteInboundInvoice(newInvoiceId);
  
  // 5. Listar notas após a exclusão
  console.log('\n--- APÓS A EXCLUSÃO ---');
  await listInboundInvoices();
  
  // 6. Testar exclusão de nota que não é de entrada
  await testDeleteNonInboundInvoice();
  
  console.log('\n' + '='.repeat(70));
  console.log('TESTE CONCLUÍDO');
  console.log('='.repeat(70));
}

// Executar teste
main().catch(error => {
  console.error('Erro fatal no teste:', error);
  process.exit(1);
});

