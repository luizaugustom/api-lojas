const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSaleCreation() {
  try {
    console.log('🛒 Testando criação de venda com impressão de NFCe...\n');

    // 1. Buscar dados necessários
    const company = await prisma.company.findFirst();
    const seller = await prisma.seller.findFirst({
      where: { companyId: company.id },
    });
    const products = await prisma.product.findMany({
      where: { companyId: company.id },
      take: 2,
    });

    if (!company || !seller || products.length === 0) {
      console.log('❌ Dados necessários não encontrados. Execute setup-nfce-test.js primeiro.');
      return;
    }

    console.log(`📋 Empresa: ${company.name}`);
    console.log(`👤 Vendedor: ${seller.name}`);
    console.log(`📦 Produtos disponíveis: ${products.length}`);

    // 2. Criar dados da venda
    const saleData = {
      sellerId: seller.id,
      items: [
        {
          productId: products[0].id,
          quantity: 2,
          unitPrice: Number(products[0].price),
          totalPrice: Number(products[0].price) * 2,
        },
        {
          productId: products[1].id,
          quantity: 1,
          unitPrice: Number(products[1].price),
          totalPrice: Number(products[1].price),
        },
      ],
      clientCpfCnpj: '123.456.789-00',
      clientName: 'Maria Santos - Cliente Teste',
      paymentMethods: ['cash', 'pix'],
      totalPaid: 100.00,
    };

    const total = saleData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const change = saleData.totalPaid - total;

    console.log(`💰 Total da venda: R$ ${total.toFixed(2)}`);
    console.log(`💵 Valor pago: R$ ${saleData.totalPaid.toFixed(2)}`);
    console.log(`🔄 Troco: R$ ${change.toFixed(2)}`);

    // 3. Criar a venda
    console.log('\n🛒 Criando venda...');
    
    const result = await prisma.$transaction(async (tx) => {
      // Criar venda
      const sale = await tx.sale.create({
        data: {
          total,
          clientCpfCnpj: saleData.clientCpfCnpj,
          clientName: saleData.clientName,
          paymentMethod: saleData.paymentMethods,
          change,
          isInstallment: false,
          companyId: company.id,
          sellerId: seller.id,
        },
      });

      // Criar itens da venda e atualizar estoque
      for (const item of saleData.items) {
        await tx.saleItem.create({
          data: {
            ...item,
            saleId: sale.id,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return sale;
    });

    console.log(`✅ Venda criada com sucesso!`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Total: R$ ${Number(result.total).toFixed(2)}`);
    console.log(`   Data: ${result.saleDate}`);

    // 4. Simular impressão de NFCe (já que não temos API fiscal real)
    console.log('\n📄 Simulando impressão de NFCe...');
    
    const completeSale = await prisma.sale.findUnique({
      where: { id: result.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        seller: true,
        company: true,
      },
    });

    // Gerar conteúdo da NFCe
    const nfceContent = generateNFCeContent(completeSale, company.customFooter);
    
    console.log('📋 Conteúdo da NFCe que seria impresso:');
    console.log('=' .repeat(50));
    console.log(nfceContent);
    console.log('=' .repeat(50));

    // 5. Verificar se a venda foi criada corretamente
    console.log('\n✅ Verificação final:');
    console.log(`   Venda ID: ${result.id}`);
    console.log(`   Itens: ${completeSale.items.length}`);
    console.log(`   Total: R$ ${Number(completeSale.total).toFixed(2)}`);
    console.log(`   Cliente: ${completeSale.clientName}`);
    console.log(`   Footer personalizado: ${company.customFooter ? 'Configurado' : 'Não configurado'}`);

    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('\n📝 Nota: A impressão real da NFCe seria feita automaticamente');
    console.log('   quando a API fiscal estiver configurada e a impressora conectada.');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateNFCeContent(sale, customFooter) {
  const { company, seller, items } = sale;
  
  let nfce = '';
  
  // Header
  nfce += centerText(company.name) + '\n';
  nfce += centerText(`CNPJ: ${company.cnpj}`) + '\n';
  if (company.street) {
    nfce += centerText(`${company.street}, ${company.number || ''} - ${company.district || ''}`) + '\n';
  }
  if (company.phone) {
    nfce += centerText(`Tel: ${company.phone}`) + '\n';
  }
  if (company.email) {
    nfce += centerText(`Email: ${company.email}`) + '\n';
  }
  nfce += centerText('--------------------------------') + '\n';
  nfce += centerText('NOTA FISCAL DO CONSUMIDOR') + '\n';
  nfce += centerText('ELETRÔNICA - NFCe') + '\n';
  nfce += centerText('--------------------------------') + '\n';
  
  // Fiscal info (simulado)
  nfce += `Número: 000000001\n`;
  nfce += `Chave de Acesso:\n35240114200166000187650010000000001234567890\n`;
  nfce += `Data/Hora Emissão: ${new Date().toLocaleString('pt-BR')}\n`;
  nfce += `Status: Autorizada\n`;
  nfce += centerText('--------------------------------') + '\n';
  
  // Sale info
  nfce += `Venda: ${sale.id}\n`;
  nfce += `Data: ${new Date(sale.saleDate).toLocaleString('pt-BR')}\n`;
  nfce += `Vendedor: ${seller.name}\n`;
  
  if (sale.clientName) {
    nfce += `Cliente: ${sale.clientName}\n`;
  }
  if (sale.clientCpfCnpj) {
    nfce += `CPF/CNPJ: ${sale.clientCpfCnpj}\n`;
  }
  
  nfce += centerText('--------------------------------') + '\n';
  
  // Items
  nfce += 'ITEM DESCRIÇÃO           QTD  V.UNIT  TOTAL\n';
  nfce += '----------------------------------------\n';
  
  items.forEach((item, index) => {
    const itemNumber = (index + 1).toString().padStart(3);
    const description = item.product.name.substring(0, 20).padEnd(20);
    const quantity = item.quantity.toString().padStart(3);
    const unitPrice = formatCurrency(item.unitPrice).padStart(7);
    const totalPrice = formatCurrency(item.totalPrice).padStart(8);
    
    nfce += `${itemNumber} ${description} ${quantity} ${unitPrice} ${totalPrice}\n`;
    
    if (item.product.barcode) {
      nfce += `     Código: ${item.product.barcode}\n`;
    }
  });
  
  nfce += centerText('--------------------------------') + '\n';
  
  // Payment methods
  nfce += 'FORMA DE PAGAMENTO:\n';
  sale.paymentMethod.forEach(method => {
    nfce += `- ${getPaymentMethodName(method)}\n`;
  });
  
  if (sale.change > 0) {
    nfce += `Troco: ${formatCurrency(sale.change)}\n`;
  }
  
  nfce += centerText('--------------------------------') + '\n';
  nfce += `TOTAL: ${formatCurrency(sale.total)}\n`;
  nfce += centerText('--------------------------------') + '\n';
  
  // QR Code info
  nfce += centerText('CONSULTE A CHAVE DE ACESSO') + '\n';
  nfce += centerText('NO SITE DA RECEITA FEDERAL') + '\n';
  nfce += centerText('OU USE O QR CODE ABAIXO') + '\n';
  nfce += centerText('--------------------------------') + '\n';
  
  // Custom footer
  if (customFooter) {
    nfce += centerText('--------------------------------') + '\n';
    nfce += centerText(customFooter) + '\n';
    nfce += centerText('--------------------------------') + '\n';
  }
  
  nfce += centerText('OBRIGADO PELA PREFERÊNCIA!') + '\n';
  nfce += centerText('VOLTE SEMPRE!') + '\n';
  nfce += centerText('--------------------------------') + '\n';
  nfce += centerText(new Date().toLocaleString('pt-BR')) + '\n';
  nfce += centerText('--------------------------------') + '\n\n\n';
  
  return nfce;
}

function centerText(text, width = 32) {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function formatCurrency(value) {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`;
}

function getPaymentMethodName(method) {
  const methods = {
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'cash': 'Dinheiro',
    'pix': 'PIX',
    'installment': 'A Prazo',
  };
  
  return methods[method] || method;
}

// Executar o teste
testSaleCreation();
