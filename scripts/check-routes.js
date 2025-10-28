/**
 * Script para verificar se as rotas estão registradas corretamente
 * Execute: node scripts/check-routes.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function checkRoutes() {
  console.log('🔍 Verificando rotas de notificação...\n');
  console.log(`API URL: ${API_URL}\n`);

  const routes = [
    { method: 'GET', path: '/api/notification', name: 'Listar notificações' },
    { method: 'GET', path: '/api/notification/unread-count', name: 'Contador não lidas' },
    { method: 'GET', path: '/api/notification/preferences/me', name: 'Obter preferências' },
    { method: 'PUT', path: '/api/notification/preferences', name: 'Atualizar preferências' },
  ];

  for (const route of routes) {
    try {
      console.log(`${route.method} ${route.path}`);
      
      const config = {
        method: route.method.toLowerCase(),
        url: `${API_URL}${route.path}`,
        validateStatus: () => true, // Não lançar erro em nenhum status
      };

      const response = await axios(config);
      
      // 401 é OK (significa que a rota existe mas precisa de auth)
      // 404 é RUIM (rota não existe)
      if (response.status === 401) {
        console.log(`✅ ${route.name} - Rota encontrada (requer autenticação)`);
      } else if (response.status === 404) {
        console.log(`❌ ${route.name} - Rota NÃO encontrada (404)`);
      } else {
        console.log(`⚠️  ${route.name} - Status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ ${route.name} - Erro: ${error.message}`);
    }
    console.log('');
  }

  console.log('\n📝 Resumo:');
  console.log('Se aparecer ❌ 404, a rota não está registrada.');
  console.log('Se aparecer ✅ 401, a rota está OK (só precisa de login).');
}

checkRoutes()
  .then(() => {
    console.log('\n✨ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  });

