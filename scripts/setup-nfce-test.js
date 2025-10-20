const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupTestEnvironment() {
  try {
    console.log('🔧 Configurando ambiente de teste para NFCe...\n');

    // 1. Buscar uma empresa existente
    const company = await prisma.company.findFirst();
    if (!company) {
      console.log('❌ Nenhuma empresa encontrada. Execute o seed primeiro.');
      return;
    }

    console.log(`📋 Configurando para empresa: ${company.name}`);

    // 2. Configurar footer personalizado
    console.log('\n2. Configurando footer personalizado...');
    const customFooter = `OBRIGADO PELA PREFERÊNCIA!
VOLTE SEMPRE!

Siga-nos nas redes sociais:
📱 Instagram: @minhaloja
📧 Email: contato@minhaloja.com
🌐 Site: www.minhaloja.com

Horário de funcionamento:
Segunda a Sexta: 8h às 18h
Sábado: 8h às 12h`;

    await prisma.company.update({
      where: { id: company.id },
      data: { customFooter },
    });

    console.log('✅ Footer personalizado configurado!');

    // 3. Adicionar impressora de teste
    console.log('\n3. Adicionando impressora de teste...');
    const printer = await prisma.printer.create({
      data: {
        name: 'Impressora Térmica Teste',
        type: 'USB',
        connectionInfo: 'USB001',
        isConnected: true,
        paperStatus: 'OK',
        companyId: company.id,
      },
    });

    console.log('✅ Impressora de teste adicionada!');
    console.log(`   ID: ${printer.id}`);
    console.log(`   Nome: ${printer.name}`);

    // 4. Criar alguns produtos de teste se não existirem
    console.log('\n4. Verificando produtos de teste...');
    const existingProducts = await prisma.product.count({
      where: { companyId: company.id },
    });

    if (existingProducts === 0) {
      console.log('   Criando produtos de teste...');
      
      const products = [
        {
          name: 'Produto Teste 1',
          barcode: '1234567890123',
          price: 25.50,
          stockQuantity: 100,
          companyId: company.id,
        },
        {
          name: 'Produto Teste 2',
          barcode: '1234567890124',
          price: 15.75,
          stockQuantity: 50,
          companyId: company.id,
        },
        {
          name: 'Produto Teste 3',
          barcode: '1234567890125',
          price: 35.00,
          stockQuantity: 25,
          companyId: company.id,
        },
      ];

      for (const product of products) {
        await prisma.product.create({ data: product });
      }

      console.log('✅ Produtos de teste criados!');
    } else {
      console.log(`✅ ${existingProducts} produtos já existem`);
    }

    // 5. Criar vendedor de teste se não existir
    console.log('\n5. Verificando vendedor de teste...');
    const existingSeller = await prisma.seller.findFirst({
      where: { companyId: company.id },
    });

    if (!existingSeller) {
      console.log('   Criando vendedor de teste...');
      await prisma.seller.create({
        data: {
          login: 'vendedor.teste',
          password: 'senha123',
          name: 'João Silva - Vendedor Teste',
          cpf: '123.456.789-00',
          email: 'vendedor@minhaloja.com',
          companyId: company.id,
        },
      });
      console.log('✅ Vendedor de teste criado!');
    } else {
      console.log('✅ Vendedor já existe');
    }

    console.log('\n🎉 Ambiente de teste configurado com sucesso!');
    console.log('\n📋 Agora você pode:');
    console.log('   1. Iniciar a aplicação: npm run start:dev');
    console.log('   2. Criar uma venda via POST /sale');
    console.log('   3. Verificar a impressão automática da NFCe');
    console.log('   4. Testar o footer personalizado');

    console.log('\n🔗 Endpoints para teste:');
    console.log('   POST /sale - Criar venda (testa impressão automática)');
    console.log('   GET /printer/custom-footer - Ver footer configurado');
    console.log('   POST /printer/custom-footer - Alterar footer');
    console.log('   GET /printer - Listar impressoras');

  } catch (error) {
    console.error('❌ Erro durante configuração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a configuração
setupTestEnvironment();
