const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function testProductModule() {
  console.log('🧪 Testando módulo de produtos...\n');

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

    // Teste 2: Listar produtos (como admin)
    console.log('\n2️⃣ Testando listagem de produtos (admin)...');
    try {
      const listResponse = await axios.get(`${BASE_URL}/product`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Listagem de produtos funcionando');
      console.log('   - Quantidade de produtos:', listResponse.data.total);
      console.log('   - Página atual:', listResponse.data.page);
      console.log('   - Primeiro produto:', listResponse.data.products[0]?.name);
    } catch (error) {
      console.log('❌ Erro na listagem:', error.response?.data?.message || error.message);
    }

    // Teste 3: Buscar produto por código de barras
    console.log('\n3️⃣ Testando busca por código de barras...');
    try {
      const barcodeResponse = await axios.get(`${BASE_URL}/product/barcode/7891234567890`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Busca por código de barras funcionando');
      console.log('   - Produto encontrado:', barcodeResponse.data.name);
      console.log('   - Preço:', barcodeResponse.data.price);
    } catch (error) {
      console.log('❌ Erro na busca por código de barras:', error.response?.data?.message || error.message);
    }

    // Teste 4: Obter estatísticas dos produtos
    console.log('\n4️⃣ Testando obtenção de estatísticas...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/product/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Obtenção de estatísticas funcionando');
      console.log('   - Total de produtos:', statsResponse.data.totalProducts);
      console.log('   - Produtos com estoque baixo:', statsResponse.data.lowStockCount);
      console.log('   - Produtos próximos do vencimento:', statsResponse.data.expiringCount);
    } catch (error) {
      console.log('❌ Erro na obtenção de estatísticas:', error.response?.data?.message || error.message);
    }

    // Teste 5: Obter produtos com estoque baixo
    console.log('\n5️⃣ Testando produtos com estoque baixo...');
    try {
      const lowStockResponse = await axios.get(`${BASE_URL}/product/low-stock?threshold=50`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Produtos com estoque baixo funcionando');
      console.log('   - Quantidade encontrada:', lowStockResponse.data.length);
    } catch (error) {
      console.log('❌ Erro na busca de produtos com estoque baixo:', error.response?.data?.message || error.message);
    }

    // Teste 6: Obter categorias
    console.log('\n6️⃣ Testando obtenção de categorias...');
    try {
      const categoriesResponse = await axios.get(`${BASE_URL}/product/categories`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Obtenção de categorias funcionando');
      console.log('   - Categorias encontradas:', categoriesResponse.data.length);
      console.log('   - Categorias:', categoriesResponse.data);
    } catch (error) {
      console.log('❌ Erro na obtenção de categorias:', error.response?.data?.message || error.message);
    }

    // Teste 7: Login como empresa e testar endpoints específicos
    console.log('\n7️⃣ Testando login como empresa...');
    try {
      const companyLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'empresa@example.com',
        password: 'company123'
      });
      
      companyToken = companyLoginResponse.data.access_token;
      console.log('✅ Login empresa realizado com sucesso');
      
      // Teste 8: Listar produtos da empresa
      console.log('\n8️⃣ Testando listagem de produtos da empresa...');
      try {
        const companyProductsResponse = await axios.get(`${BASE_URL}/product`, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Listagem de produtos da empresa funcionando');
        console.log('   - Quantidade de produtos:', companyProductsResponse.data.total);
        console.log('   - Primeiro produto:', companyProductsResponse.data.products[0]?.name);
      } catch (error) {
        console.log('❌ Erro na listagem de produtos da empresa:', error.response?.data?.message || error.message);
      }
      
      // Teste 9: Criar novo produto
      console.log('\n9️⃣ Testando criação de novo produto...');
      try {
        const newProductData = {
          name: 'Produto Teste LTDA',
          barcode: '1234567890123',
          stockQuantity: 50,
          price: 99.99,
          size: 'M',
          category: 'Teste',
          expirationDate: '2024-12-31'
        };
        
        const createResponse = await axios.post(`${BASE_URL}/product`, newProductData, {
          headers: { Authorization: `Bearer ${companyToken}` }
        });
        console.log('✅ Criação de produto funcionando');
        console.log('   - Produto criado:', createResponse.data.name);
        console.log('   - ID:', createResponse.data.id);
        
        const newProductId = createResponse.data.id;
        
        // Teste 10: Buscar produto por ID
        console.log('\n🔟 Testando busca de produto por ID...');
        try {
          const findResponse = await axios.get(`${BASE_URL}/product/${newProductId}`, {
            headers: { Authorization: `Bearer ${companyToken}` }
          });
          console.log('✅ Busca de produto por ID funcionando');
          console.log('   - Produto encontrado:', findResponse.data.name);
          console.log('   - Estoque:', findResponse.data.stockQuantity);
        } catch (error) {
          console.log('❌ Erro na busca por ID:', error.response?.data?.message || error.message);
        }
        
        // Teste 11: Atualizar produto
        console.log('\n1️⃣1️⃣ Testando atualização de produto...');
        try {
          const updateData = {
            name: 'Produto Teste Atualizado LTDA',
            price: 149.99,
            stockQuantity: 75
          };
          
          const updateResponse = await axios.patch(`${BASE_URL}/product/${newProductId}`, updateData, {
            headers: { Authorization: `Bearer ${companyToken}` }
          });
          console.log('✅ Atualização de produto funcionando');
          console.log('   - Produto atualizado:', updateResponse.data.name);
          console.log('   - Novo preço:', updateResponse.data.price);
        } catch (error) {
          console.log('❌ Erro na atualização:', error.response?.data?.message || error.message);
        }
        
        // Teste 12: Atualizar estoque
        console.log('\n1️⃣2️⃣ Testando atualização de estoque...');
        try {
          const stockData = {
            stockQuantity: 100
          };
          
          const stockResponse = await axios.patch(`${BASE_URL}/product/${newProductId}/stock`, stockData, {
            headers: { Authorization: `Bearer ${companyToken}` }
          });
          console.log('✅ Atualização de estoque funcionando');
          console.log('   - Novo estoque:', stockResponse.data.stockQuantity);
        } catch (error) {
          console.log('❌ Erro na atualização de estoque:', error.response?.data?.message || error.message);
        }
        
        // Teste 13: Remover produto
        console.log('\n1️⃣3️⃣ Testando remoção de produto...');
        try {
          const deleteResponse = await axios.delete(`${BASE_URL}/product/${newProductId}`, {
            headers: { Authorization: `Bearer ${companyToken}` }
          });
          console.log('✅ Remoção de produto funcionando');
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

    // Teste 14: Tentar criar produto com código de barras duplicado
    console.log('\n1️⃣4️⃣ Testando criação com código de barras duplicado...');
    try {
      const duplicateData = {
        name: 'Produto Duplicado LTDA',
        barcode: '7891234567890', // Código já existente
        stockQuantity: 10,
        price: 50.00
      };
      
      await axios.post(`${BASE_URL}/product`, duplicateData, {
        headers: { Authorization: `Bearer ${companyToken}` }
      });
      console.log('❌ Criação com código duplicado deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Criação com código duplicado corretamente rejeitada');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    // Teste 15: Busca com filtro
    console.log('\n1️⃣5️⃣ Testando busca com filtro...');
    try {
      const searchResponse = await axios.get(`${BASE_URL}/product?search=Samsung&page=1&limit=5`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Busca com filtro funcionando');
      console.log('   - Resultados encontrados:', searchResponse.data.total);
      console.log('   - Produtos na página:', searchResponse.data.products.length);
    } catch (error) {
      console.log('❌ Erro na busca com filtro:', error.response?.data?.message || error.message);
    }

    // Teste 16: Tentar acessar sem token
    console.log('\n1️⃣6️⃣ Testando acesso sem token...');
    try {
      await axios.get(`${BASE_URL}/product`);
      console.log('❌ Acesso sem token deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Acesso sem token corretamente rejeitado');
      } else {
        console.log('❌ Erro inesperado:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Testes do módulo de produtos concluídos!');

  } catch (error) {
    console.error('❌ Erro geral nos testes:', error.message);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  testProductModule();
}

module.exports = { testProductModule };
