/**
 * Script de teste para atualização de produtos
 * Demonstra como atualizar produtos corretamente
 */

const API_BASE_URL = 'http://localhost:3000';
const TOKEN = 'seu-jwt-token-aqui'; // Substitua pelo token real

// Exemplo 1: Atualização básica de produto
async function updateBasicProduct() {
  console.log('🔄 Testando atualização básica de produto...');
  
  const productId = '123e4567-e89b-12d3-a456-426614174000'; // UUID válido
  const updateData = {
    name: "Smartphone Samsung Galaxy Atualizado",
    price: 1399.99,
    category: "Eletrônicos Premium"
  };

  console.log('📤 Dados enviados:', JSON.stringify(updateData, null, 2));
  console.log('🆔 ID do produto:', productId);

  try {
    const response = await fetch(`${API_BASE_URL}/product/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Produto atualizado com sucesso:', result);
    } else {
      console.log('❌ Erro na atualização:', result);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

// Exemplo 2: Atualização com fotos
async function updateProductWithPhotos() {
  console.log('\n📸 Testando atualização com fotos...');
  
  const productId = '123e4567-e89b-12d3-a456-426614174000';
  const updateData = {
    name: "Notebook Dell Inspiron Atualizado",
    price: 2799.99,
    photos: [
      "/uploads/products/company123/new-photo1.jpg",
      "/uploads/products/company123/new-photo2.jpg"
    ]
  };

  try {
    const response = await fetch(`${API_BASE_URL}/product/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Produto com fotos atualizado:', result);
    } else {
      console.log('❌ Erro na atualização:', result);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

// Exemplo 3: Atualização de estoque
async function updateProductStock() {
  console.log('\n📦 Testando atualização de estoque...');
  
  const productId = '123e4567-e89b-12d3-a456-426614174000';
  const stockData = {
    stockQuantity: 150
  };

  try {
    const response = await fetch(`${API_BASE_URL}/product/${productId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(stockData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Estoque atualizado:', result);
    } else {
      console.log('❌ Erro na atualização:', result);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

// Exemplo 4: Dados INCORRETOS que causam erro
async function updateProductWithErrors() {
  console.log('\n❌ Testando dados incorretos...');
  
  // ID inválido
  const invalidProductId = 'invalid-id';
  const updateData = {
    name: "Produto Teste",
    activityId: "abc123", // Campo não permitido
    price: 99.99,
    photos: [
      { url: "/uploads/photo.jpg" }, // Objeto em vez de string
      null,                          // Valor nulo
      undefined                      // Valor undefined
    ]
  };

  try {
    const response = await fetch(`${API_BASE_URL}/product/${invalidProductId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    
    console.log('❌ Erro esperado:', result);
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

// Exemplo 5: Teste com diferentes formatos de ID
async function testDifferentIdFormats() {
  console.log('\n🆔 Testando diferentes formatos de ID...\n');

  const idFormats = [
    {
      name: 'UUID válido',
      id: '123e4567-e89b-12d3-a456-426614174000'
    },
    {
      name: 'ID inválido - muito curto',
      id: '123'
    },
    {
      name: 'ID inválido - formato incorreto',
      id: 'product-123'
    },
    {
      name: 'ID inválido - caracteres especiais',
      id: '123@456#789'
    },
    {
      name: 'ID vazio',
      id: ''
    }
  ];

  for (const testCase of idFormats) {
    console.log(`\n🆔 Testando: ${testCase.name} (${testCase.id})`);
    
    const updateData = {
      name: `Produto Teste - ${testCase.name}`,
      price: 99.99
    };

    try {
      const response = await fetch(`${API_BASE_URL}/product/${testCase.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Sucesso com ${testCase.name}`);
      } else {
        console.log(`❌ Erro esperado: ${result.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.log(`❌ Erro de conexão: ${error.message}`);
    }
  }
}

// Executar testes
async function runUpdateTests() {
  console.log('🧪 Iniciando testes de atualização de produtos...\n');
  
  await updateBasicProduct();
  await updateProductWithPhotos();
  await updateProductStock();
  await updateProductWithErrors();
  await testDifferentIdFormats();
  
  console.log('\n🏁 Testes de atualização concluídos!');
}

// Executar se chamado diretamente
if (typeof window === 'undefined') {
  runUpdateTests().catch(console.error);
}

// Exportar para uso em outros arquivos
module.exports = {
  updateBasicProduct,
  updateProductWithPhotos,
  updateProductStock,
  updateProductWithErrors,
  testDifferentIdFormats,
  runUpdateTests
};
