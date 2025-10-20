/**
 * Script de teste específico para conversão de datas
 * Demonstra como o sistema converte datas automaticamente
 */

const API_BASE_URL = 'http://localhost:3000';
const TOKEN = 'seu-jwt-token-aqui'; // Substitua pelo token real

// Teste específico para o problema da data
async function testDateConversion() {
  console.log('📅 Testando conversão automática de datas...\n');

  // Dados que causavam erro antes
  const productDataWithDate = {
    name: "ferro",
    photos: [],
    barcode: "545654658354",
    stockQuantity: 120,
    price: 120,
    category: "Ferragens",
    expirationDate: "2025-11-06" // ← Esta data será convertida automaticamente
  };

  console.log('📤 Dados enviados:', JSON.stringify(productDataWithDate, null, 2));

  try {
    const response = await fetch(`${API_BASE_URL}/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(productDataWithDate)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Produto criado com sucesso!');
      console.log('📅 Data convertida automaticamente:', result.expirationDate);
      console.log('📋 Produto completo:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Erro na criação:', result);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

// Teste com diferentes formatos de data
async function testDifferentDateFormats() {
  console.log('\n🧪 Testando diferentes formatos de data...\n');

  const dateFormats = [
    {
      name: 'Data simples (YYYY-MM-DD)',
      expirationDate: '2025-12-31'
    },
    {
      name: 'Data ISO completa',
      expirationDate: '2025-12-31T00:00:00.000Z'
    },
    {
      name: 'Data com hora',
      expirationDate: '2025-12-31T14:30:00Z'
    },
    {
      name: 'Sem data de vencimento',
      expirationDate: undefined
    }
  ];

  for (const testCase of dateFormats) {
    console.log(`\n📅 Testando: ${testCase.name}`);
    
    const productData = {
      name: `Produto Teste - ${testCase.name}`,
      barcode: `test${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
      stockQuantity: 10,
      price: 99.99,
      category: "Teste"
    };

    if (testCase.expirationDate !== undefined) {
      productData.expirationDate = testCase.expirationDate;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Sucesso! Data final: ${result.expirationDate || 'N/A'}`);
      } else {
        console.log(`❌ Erro: ${result.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.log(`❌ Erro de conexão: ${error.message}`);
    }
  }
}

// Executar testes
async function runDateTests() {
  console.log('🧪 Iniciando testes de conversão de datas...\n');
  
  await testDateConversion();
  await testDifferentDateFormats();
  
  console.log('\n🏁 Testes de data concluídos!');
}

// Executar se chamado diretamente
if (typeof window === 'undefined') {
  runDateTests().catch(console.error);
}

// Exportar para uso em outros arquivos
module.exports = {
  testDateConversion,
  testDifferentDateFormats,
  runDateTests
};
