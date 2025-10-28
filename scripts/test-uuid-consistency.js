/**
 * Script de Teste de Consistência UUID v4
 * 
 * Este script testa a criação real de uma venda completa
 * verificando que todos os IDs são UUID v4 válidos
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let adminToken = '';
let companyToken = '';
let companyId = '';
let sellerId = '';
let productId = '';
let saleId = '';

async function validateUUID(value, name) {
  const isValid = UUID_V4_REGEX.test(value);
  console.log(`  ${isValid ? '✅' : '❌'} ${name}: ${value}`);
  
  if (!isValid) {
    throw new Error(`${name} não é um UUID v4 válido: ${value}`);
  }
  
  return value;
}

async function test() {
  console.log('🧪 TESTE DE CONSISTÊNCIA UUID v4\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Login Admin
    console.log('\n1️⃣  Login como Admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      login: ADMIN_LOGIN,
      password: ADMIN_PASSWORD,
    });
    
    adminToken = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Criar Empresa
    console.log('\n2️⃣  Criando empresa de teste...');
    const timestamp = Date.now();
    const companyResponse = await axios.post(
      `${API_URL}/company`,
      {
        name: `Empresa Teste ${timestamp}`,
        login: `empresa-${timestamp}@test.com`,
        password: '123456',
        cnpj: `12.345.678/0001-${String(timestamp).slice(-2)}`,
        email: `empresa-${timestamp}@test.com`,
        phone: '(11) 99999-9999',
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    
    companyId = companyResponse.data.id;
    await validateUUID(companyId, 'Company ID');
    
    // 3. Login como Empresa
    console.log('\n3️⃣  Login como Empresa...');
    const companyLoginResponse = await axios.post(`${API_URL}/auth/login`, {
      login: `empresa-${timestamp}@test.com`,
      password: '123456',
    });
    
    companyToken = companyLoginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso');
    
    // 4. Criar Vendedor
    console.log('\n4️⃣  Criando vendedor...');
    const sellerResponse = await axios.post(
      `${API_URL}/seller`,
      {
        login: `vendedor-${timestamp}@test.com`,
        password: '123456',
        name: `Vendedor Teste ${timestamp}`,
        phone: '(11) 98888-8888',
      },
      {
        headers: { Authorization: `Bearer ${companyToken}` }
      }
    );
    
    sellerId = sellerResponse.data.id;
    await validateUUID(sellerId, 'Seller ID');
    
    // 5. Criar Produto
    console.log('\n5️⃣  Criando produto...');
    const productResponse = await axios.post(
      `${API_URL}/product`,
      {
        name: `Produto Teste ${timestamp}`,
        barcode: `789${timestamp}`,
        price: 10.50,
        stockQuantity: 100,
      },
      {
        headers: { Authorization: `Bearer ${companyToken}` }
      }
    );
    
    productId = productResponse.data.id;
    await validateUUID(productId, 'Product ID');
    
    // 6. Criar Venda - TESTE PRINCIPAL
    console.log('\n6️⃣  Criando venda (TESTE PRINCIPAL)...');
    console.log('  Payload:');
    console.log(`    sellerId: ${sellerId}`);
    console.log(`    productId: ${productId}`);
    console.log(`    quantity: 2`);
    console.log(`    amount: 21.00`);
    
    const saleResponse = await axios.post(
      `${API_URL}/sale`,
      {
        sellerId: sellerId,
        items: [
          {
            productId: productId,
            quantity: 2,
          }
        ],
        paymentMethods: [
          {
            method: 'cash',
            amount: 21.00,
          }
        ],
        clientName: 'Cliente Teste',
        clientCpfCnpj: '123.456.789-00',
      },
      {
        headers: { Authorization: `Bearer ${companyToken}` }
      }
    );
    
    saleId = saleResponse.data.id;
    await validateUUID(saleId, 'Sale ID');
    
    // 7. Verificar Venda
    console.log('\n7️⃣  Verificando venda criada...');
    const saleDetails = await axios.get(
      `${API_URL}/sale/${saleId}`,
      {
        headers: { Authorization: `Bearer ${companyToken}` }
      }
    );
    
    console.log('\n📊 Detalhes da Venda:');
    console.log(`  Sale ID: ${saleDetails.data.id}`);
    console.log(`  Company ID: ${saleDetails.data.companyId}`);
    console.log(`  Seller ID: ${saleDetails.data.sellerId}`);
    console.log(`  Total: R$ ${saleDetails.data.total}`);
    console.log(`  Items: ${saleDetails.data.items.length}`);
    
    // Validar todos os IDs
    await validateUUID(saleDetails.data.id, 'Sale ID (detalhes)');
    await validateUUID(saleDetails.data.companyId, 'Company ID (detalhes)');
    await validateUUID(saleDetails.data.sellerId, 'Seller ID (detalhes)');
    
    // Validar IDs dos items
    console.log('\n  Items da venda:');
    for (const item of saleDetails.data.items) {
      console.log(`    - ${item.product.name}`);
      await validateUUID(item.id, `    Item ID`);
      await validateUUID(item.productId, `    Product ID`);
      await validateUUID(item.saleId, `    Sale ID`);
    }
    
    // Validar IDs dos métodos de pagamento
    console.log('\n  Métodos de pagamento:');
    for (const pm of saleDetails.data.paymentMethods) {
      console.log(`    - ${pm.method}: R$ ${pm.amount}`);
      await validateUUID(pm.id, `    Payment Method ID`);
      await validateUUID(pm.saleId, `    Sale ID`);
    }
    
    // 8. Resultados Finais
    console.log('\n' + '='.repeat(60));
    console.log('✅ TODOS OS TESTES PASSARAM COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n📊 Resumo:');
    console.log(`  ✅ Empresa criada: ${companyId}`);
    console.log(`  ✅ Vendedor criado: ${sellerId}`);
    console.log(`  ✅ Produto criado: ${productId}`);
    console.log(`  ✅ Venda criada: ${saleId}`);
    console.log(`  ✅ Todos os IDs são UUID v4 válidos`);
    console.log(`  ✅ Nenhuma conversão necessária`);
    console.log(`  ✅ Sistema 100% funcional\n`);
    
    // 9. Limpar dados de teste (opcional)
    console.log('🧹 Limpando dados de teste...');
    try {
      await axios.delete(`${API_URL}/sale/${saleId}`, {
        headers: { Authorization: `Bearer ${companyToken}` }
      });
      console.log('  ✅ Venda removida');
      
      await axios.delete(`${API_URL}/product/${productId}`, {
        headers: { Authorization: `Bearer ${companyToken}` }
      });
      console.log('  ✅ Produto removido');
      
      await axios.delete(`${API_URL}/seller/${sellerId}`, {
        headers: { Authorization: `Bearer ${companyToken}` }
      });
      console.log('  ✅ Vendedor removido');
      
      await axios.delete(`${API_URL}/company/${companyId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('  ✅ Empresa removida');
      
      console.log('\n✅ Limpeza concluída\n');
    } catch (cleanupError) {
      console.log('\n⚠️  Erro na limpeza (pode ser ignorado):', cleanupError.message);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TESTE FALHOU!');
    console.error('='.repeat(60));
    
    if (error.response) {
      console.error('\n📍 Erro da API:');
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${error.response.data.message || error.response.data}`);
      console.error(`  Data:`, error.response.data);
    } else {
      console.error('\n📍 Erro:', error.message);
      console.error(error);
    }
    
    process.exit(1);
  }
}

console.log('🚀 Iniciando teste de consistência UUID v4...\n');
test();


