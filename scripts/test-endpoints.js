const https = require('http');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

async function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testEndpoints() {
  console.log('🧪 Testando endpoints da API...\n');

  try {
    // 1. Testar rota raiz
    console.log('1. Testando rota raiz...');
    const rootResponse = await makeRequest('GET', '/');
    console.log(`   Status: ${rootResponse.statusCode} (esperado: 404)`);
    
    // 2. Fazer login
    console.log('\n2. Fazendo login...');
    const loginResponse = await makeRequest('POST', '/auth/login', {
      login: 'admin@example.com',
      password: 'admin123'
    });
    
    if (loginResponse.statusCode === 200) {
      const loginData = JSON.parse(loginResponse.body);
      authToken = loginData.access_token;
      console.log('   ✅ Login realizado com sucesso');
    } else {
      console.log(`   ❌ Erro no login: ${loginResponse.statusCode}`);
      console.log(`   Resposta: ${loginResponse.body}`);
      return;
    }

    // 3. Testar endpoints protegidos
    const protectedEndpoints = [
      { method: 'GET', path: '/admin', name: 'Listar Admins' },
      { method: 'GET', path: '/company', name: 'Listar Empresas' },
      { method: 'GET', path: '/seller', name: 'Listar Vendedores' },
      { method: 'GET', path: '/product', name: 'Listar Produtos' },
      { method: 'GET', path: '/customer', name: 'Listar Clientes' },
      { method: 'GET', path: '/sale', name: 'Listar Vendas' },
      { method: 'GET', path: '/bill-to-pay', name: 'Listar Contas a Pagar' },
    ];

    console.log('\n3. Testando endpoints protegidos...');
    
    for (const endpoint of protectedEndpoints) {
      try {
        const response = await makeRequest(endpoint.method, endpoint.path, null, {
          'Authorization': `Bearer ${authToken}`
        });
        
        const status = response.statusCode === 200 ? '✅' : 
                      response.statusCode === 403 ? '🔒' : '❌';
        
        console.log(`   ${status} ${endpoint.name}: ${response.statusCode}`);
        
        if (response.statusCode === 500) {
          console.log(`      Erro: ${response.body}`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.name}: Erro de conexão`);
      }
    }

    // 4. Testar criação de admin
    console.log('\n4. Testando criação de admin...');
    const createAdminResponse = await makeRequest('POST', '/admin', {
      login: 'test.admin@example.com',
      password: 'test123'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log(`   Status: ${createAdminResponse.statusCode}`);
    if (createAdminResponse.statusCode === 500) {
      console.log(`   Erro: ${createAdminResponse.body}`);
    }

    // 5. Testar criação de empresa
    console.log('\n5. Testando criação de empresa...');
    const createCompanyResponse = await makeRequest('POST', '/company', {
      name: 'Empresa Teste LTDA',
      login: 'empresa.teste@example.com',
      password: 'senha123',
      cnpj: '11.111.111/0001-11',
      email: 'contato@empresateste.com'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log(`   Status: ${createCompanyResponse.statusCode}`);
    if (createCompanyResponse.statusCode === 500) {
      console.log(`   Erro: ${createCompanyResponse.body}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testEndpoints();


