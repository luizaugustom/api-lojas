const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNFCePrinting() {
  try {
    console.log('🧪 Testando funcionalidade de impressão de NFCe...\n');

    // 1. Verificar se o campo customFooter foi adicionado
    console.log('1. Verificando campo customFooter na tabela companies...');
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        customFooter: true,
      },
      take: 1,
    });

    if (companies.length > 0) {
      console.log('✅ Campo customFooter encontrado!');
      console.log(`   Empresa: ${companies[0].name}`);
      console.log(`   Footer atual: ${companies[0].customFooter || 'Não configurado'}`);
    } else {
      console.log('⚠️  Nenhuma empresa encontrada no banco de dados');
    }

    // 2. Verificar se existem vendas para teste
    console.log('\n2. Verificando vendas existentes...');
    const sales = await prisma.sale.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        seller: true,
        company: true,
      },
      take: 1,
    });

    if (sales.length > 0) {
      console.log('✅ Vendas encontradas!');
      console.log(`   Venda ID: ${sales[0].id}`);
      console.log(`   Total: R$ ${sales[0].total}`);
      console.log(`   Itens: ${sales[0].items.length}`);
      console.log(`   Empresa: ${sales[0].company.name}`);
    } else {
      console.log('⚠️  Nenhuma venda encontrada no banco de dados');
    }

    // 3. Verificar se existem impressoras configuradas
    console.log('\n3. Verificando impressoras configuradas...');
    const printers = await prisma.printer.findMany({
      take: 1,
    });

    if (printers.length > 0) {
      console.log('✅ Impressoras encontradas!');
      console.log(`   Impressora: ${printers[0].name}`);
      console.log(`   Tipo: ${printers[0].type}`);
      console.log(`   Conectada: ${printers[0].isConnected ? 'Sim' : 'Não'}`);
    } else {
      console.log('⚠️  Nenhuma impressora configurada');
    }

    // 4. Verificar documentos fiscais existentes
    console.log('\n4. Verificando documentos fiscais...');
    const fiscalDocs = await prisma.fiscalDocument.findMany({
      where: {
        documentType: 'NFCe',
      },
      take: 1,
    });

    if (fiscalDocs.length > 0) {
      console.log('✅ Documentos NFCe encontrados!');
      console.log(`   Documento: ${fiscalDocs[0].documentNumber}`);
      console.log(`   Status: ${fiscalDocs[0].status}`);
      console.log(`   Data: ${fiscalDocs[0].emissionDate}`);
    } else {
      console.log('ℹ️  Nenhum documento NFCe encontrado (normal se ainda não foi testado)');
    }

    console.log('\n🎉 Teste concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Configure uma impressora via POST /printer');
    console.log('   2. Configure o footer personalizado via POST /printer/custom-footer');
    console.log('   3. Crie uma venda via POST /sale para testar a impressão automática');
    console.log('   4. Verifique os logs da aplicação para confirmar a impressão');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testNFCePrinting();
