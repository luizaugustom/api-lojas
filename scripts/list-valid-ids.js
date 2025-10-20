const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listValidIds() {
  try {
    console.log('🔍 Listando IDs válidos...\n');

    // Listar empresas
    console.log('📊 EMPRESAS:');
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
      take: 5
    });
    companies.forEach(company => {
      console.log(`  ID: ${company.id}`);
      console.log(`  Nome: ${company.name}\n`);
    });

    // Listar clientes
    console.log('👥 CLIENTES:');
    const customers = await prisma.customer.findMany({
      select: { id: true, name: true, email: true },
      take: 5
    });
    customers.forEach(customer => {
      console.log(`  ID: ${customer.id}`);
      console.log(`  Nome: ${customer.name}`);
      console.log(`  Email: ${customer.email || 'Não informado'}\n`);
    });

    // Listar vendedores
    console.log('👨‍💼 VENDEDORES:');
    const sellers = await prisma.seller.findMany({
      select: { id: true, name: true },
      take: 5
    });
    sellers.forEach(seller => {
      console.log(`  ID: ${seller.id}`);
      console.log(`  Nome: ${seller.name}\n`);
    });

    // Listar produtos
    console.log('📦 PRODUTOS:');
    const products = await prisma.product.findMany({
      select: { id: true, name: true },
      take: 5
    });
    products.forEach(product => {
      console.log(`  ID: ${product.id}`);
      console.log(`  Nome: ${product.name}\n`);
    });

    // Listar vendas
    console.log('🛍️ VENDAS:');
    const sales = await prisma.sale.findMany({
      select: { id: true, total: true, clientName: true },
      take: 5
    });
    sales.forEach(sale => {
      console.log(`  ID: ${sale.id}`);
      console.log(`  Cliente: ${sale.clientName || 'Não informado'}`);
      console.log(`  Total: R$ ${sale.total}\n`);
    });

    console.log('✅ Use estes IDs nos seus testes da API!');
    console.log('\n📝 Exemplo de uso:');
    if (customers.length > 0) {
      console.log(`curl -X POST "http://localhost:3000/customer/${customers[0].id}/send-promotional-email" \\`);
      console.log('  -H "Authorization: Bearer seu-token-jwt" \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log('  -d \'{"title": "Teste", "message": "Mensagem de teste"}\'');
    }

  } catch (error) {
    console.error('❌ Erro ao listar IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
listValidIds();
