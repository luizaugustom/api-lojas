const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFiscalApiIntegration() {
  try {
    console.log('🧪 Testando integração com API fiscal...\n');

    // 1. Verificar configuração atual
    console.log('1. Verificando configuração da API fiscal...');
    const fiscalProvider = process.env.FISCAL_PROVIDER || 'mock';
    const fiscalEnvironment = process.env.FISCAL_ENVIRONMENT || 'sandbox';
    
    console.log(`   Provedor: ${fiscalProvider}`);
    console.log(`   Ambiente: ${fiscalEnvironment}`);

    // 2. Verificar se existem empresas configuradas
    console.log('\n2. Verificando empresas configuradas...');
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        cnpj: true,
        street: true,
        number: true,
        city: true,
        state: true,
        zipCode: true,
      },
    });

    if (companies.length === 0) {
      console.log('❌ Nenhuma empresa encontrada');
      return;
    }

    const company = companies[0];
    console.log(`✅ Empresa encontrada: ${company.name}`);
    console.log(`   CNPJ: ${company.cnpj}`);
    console.log(`   Endereço: ${company.street}, ${company.number} - ${company.city}/${company.state}`);

    // 3. Verificar se existem produtos
    console.log('\n3. Verificando produtos...');
    const products = await prisma.product.findMany({
      where: { companyId: company.id },
      take: 2,
    });

    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado');
      return;
    }

    console.log(`✅ ${products.length} produtos encontrados`);
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - R$ ${product.price}`);
    });

    // 4. Verificar se existem vendas
    console.log('\n4. Verificando vendas...');
    const sales = await prisma.sale.findMany({
      where: { companyId: company.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        seller: true,
      },
      take: 1,
    });

    if (sales.length === 0) {
      console.log('❌ Nenhuma venda encontrada');
      return;
    }

    const sale = sales[0];
    console.log(`✅ Venda encontrada: ${sale.id}`);
    console.log(`   Total: R$ ${sale.total}`);
    console.log(`   Itens: ${sale.items.length}`);
    console.log(`   Vendedor: ${sale.seller.name}`);

    // 5. Simular chamada para API fiscal
    console.log('\n5. Simulando chamada para API fiscal...');
    
    const nfceRequest = {
      companyId: company.id,
      clientCpfCnpj: sale.clientCpfCnpj,
      clientName: sale.clientName,
      items: sale.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        ncm: '99999999',
        cfop: '5102',
      })),
      totalValue: Number(sale.total),
      paymentMethod: sale.paymentMethod,
      saleId: sale.id,
      sellerName: sale.seller.name,
    };

    console.log('📋 Dados da NFCe que seriam enviados:');
    console.log(JSON.stringify(nfceRequest, null, 2));

    // 6. Verificar documentos fiscais existentes
    console.log('\n6. Verificando documentos fiscais...');
    const fiscalDocs = await prisma.fiscalDocument.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (fiscalDocs.length > 0) {
      console.log(`✅ ${fiscalDocs.length} documentos fiscais encontrados`);
      fiscalDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.documentType} - ${doc.documentNumber} - ${doc.status}`);
      });
    } else {
      console.log('ℹ️  Nenhum documento fiscal encontrado');
    }

    // 7. Verificar configurações necessárias
    console.log('\n7. Verificando configurações necessárias...');
    
    const requiredEnvVars = {
      'FISCAL_PROVIDER': process.env.FISCAL_PROVIDER,
      'FISCAL_ENVIRONMENT': process.env.FISCAL_ENVIRONMENT,
    };

    // Adicionar variáveis específicas do provedor
    switch (fiscalProvider) {
      case 'nfe.io':
        requiredEnvVars['NFEIO_API_KEY'] = process.env.NFEIO_API_KEY;
        break;
      case 'tecnospeed':
        requiredEnvVars['TECNOSPEED_API_KEY'] = process.env.TECNOSPEED_API_KEY;
        break;
      case 'focusnfe':
        requiredEnvVars['FOCUSNFE_API_KEY'] = process.env.FOCUSNFE_API_KEY;
        break;
      case 'enotas':
        requiredEnvVars['ENOTAS_API_KEY'] = process.env.ENOTAS_API_KEY;
        break;
    }

    console.log('📋 Variáveis de ambiente necessárias:');
    Object.entries(requiredEnvVars).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      const displayValue = value ? (key.includes('KEY') ? '***' : value) : 'NÃO CONFIGURADA';
      console.log(`   ${status} ${key}: ${displayValue}`);
    });

    // 8. Verificar certificado digital
    console.log('\n8. Verificando certificado digital...');
    const certPath = process.env.FISCAL_CERTIFICATE_PATH;
    const certPassword = process.env.FISCAL_CERTIFICATE_PASSWORD;
    
    if (certPath && certPassword) {
      console.log(`✅ Certificado configurado: ${certPath}`);
      console.log(`✅ Senha configurada: ***`);
    } else {
      console.log('⚠️  Certificado digital não configurado');
      console.log('   Configure FISCAL_CERTIFICATE_PATH e FISCAL_CERTIFICATE_PASSWORD');
    }

    console.log('\n🎉 Teste de integração concluído!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Configure as variáveis de ambiente necessárias');
    console.log('   2. Configure o certificado digital');
    console.log('   3. Teste a geração de NFCe via API');
    console.log('   4. Verifique os logs da aplicação');

    console.log('\n🔗 Endpoints para teste:');
    console.log('   GET /fiscal/status - Status da API fiscal');
    console.log('   POST /fiscal/nfce - Gerar NFCe');
    console.log('   POST /fiscal/certificate/upload - Upload certificado');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testFiscalApiIntegration();
