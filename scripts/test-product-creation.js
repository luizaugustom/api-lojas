/**
 * Script de teste para criação de produtos
 * Demonstra como enviar dados corretos para evitar erros de validação
 */

const API_BASE_URL = 'http://localhost:3000';
const TOKEN = 'seu-jwt-token-aqui'; // Substitua pelo token real

// Exemplo 1: Criação básica de produto (sem fotos)
async function createBasicProduct() {
  console.log('🚀 Testando criação básica de produto...');
  
  const productData = {
    name: "Smartphone Samsung Galaxy",
    barcode: "7891234567890",
    stockQuantity: 100,
    price: 1299.99,
    category: "Eletrônicos",
    expirationDate: "2025-12-31" // Será convertido automaticamente para ISO DateTime
  };

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
      console.log('✅ Produto criado com sucesso:', result);
    } else {
      console.log('❌ Erro na criação:', result);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

// Exemplo 2: Criação com fotos (URLs existentes)
async function createProductWithPhotos() {
  console.log('📸 Testando criação com fotos...');
  
  const productData = {
    name: "Notebook Dell Inspiron",
    barcode: "7891234567891",
    stockQuantity: 50,
    price: 2599.99,
    category: "Informática",
    photos: [
      "/uploads/products/company123/existing-photo1.jpg",
      "/uploads/products/company123/existing-photo2.jpg"
    ]
  };

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
      console.log('✅ Produto com fotos criado:', result);
    } else {
      console.log('❌ Erro na criação:', result);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

// Exemplo 3: Dados INCORRETOS que causam erro
async function createProductWithErrors() {
  console.log('❌ Testando dados incorretos...');
  
  const productDataWithErrors = {
    name: "Produto Teste",
    activityId: "abc123", // ← ERRO: campo não permitido
    barcode: "7891234567892",
    stockQuantity: 25,
    price: 99.99,
    photos: [
      { url: "/uploads/photo.jpg" }, // ← ERRO: objeto em vez de string
      null,                          // ← ERRO: valor nulo
      undefined                      // ← ERRO: valor undefined
    ]
  };

  try {
    const response = await fetch(`${API_BASE_URL}/product`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify(productDataWithErrors)
    });

    const result = await response.json();
    
    console.log('❌ Erro esperado:', result);
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

// Exemplo 4: Criação com upload de fotos
async function createProductWithUpload() {
  console.log('📁 Testando criação com upload...');
  
  const formData = new FormData();
  formData.append('name', 'Produto com Upload');
  formData.append('barcode', '7891234567893');
  formData.append('stockQuantity', '30');
  formData.append('price', '199.99');
  formData.append('category', 'Teste');
  
  // Se você tiver arquivos locais para testar:
  // formData.append('photos', new File([''], 'foto1.jpg'));
  // formData.append('photos', new File([''], 'foto2.jpg'));

  try {
    const response = await fetch(`${API_BASE_URL}/product/upload-and-create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      },
      body: formData
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Produto com upload criado:', result);
    } else {
      console.log('❌ Erro na criação:', result);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🧪 Iniciando testes de criação de produtos...\n');
  
  await createBasicProduct();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await createProductWithPhotos();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await createProductWithErrors();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await createProductWithUpload();
  
  console.log('\n🏁 Testes concluídos!');
}

// Executar se chamado diretamente
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}

// Exportar para uso em outros arquivos
module.exports = {
  createBasicProduct,
  createProductWithPhotos,
  createProductWithErrors,
  createProductWithUpload,
  runTests
};
