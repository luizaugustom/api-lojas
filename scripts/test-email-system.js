const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

// Configuração do transporter de email (usar suas credenciais SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function testEmailSystem() {
  try {
    console.log('🧪 Testando sistema de email...\n');

    // 1. Criar um cliente de teste com email
    console.log('1. Criando cliente de teste...');
    const testCustomer = await prisma.customer.create({
      data: {
        name: 'João Silva Teste',
        email: 'teste@exemplo.com', // Substitua por um email válido para teste
        phone: '(11) 99999-9999',
        cpfCnpj: '123.456.789-00',
        companyId: 'seu-company-id-aqui', // Substitua pelo ID de uma empresa existente
      },
    });
    console.log(`✅ Cliente criado: ${testCustomer.name} (${testCustomer.email})\n`);

    // 2. Testar envio de email de boas-vindas
    console.log('2. Testando email de boas-vindas...');
    const welcomeEmailSent = await sendWelcomeEmail(
      testCustomer.email,
      testCustomer.name,
      'Empresa Teste'
    );
    console.log(`✅ Email de boas-vindas: ${welcomeEmailSent ? 'Enviado' : 'Falhou'}\n`);

    // 3. Criar uma venda de teste
    console.log('3. Criando venda de teste...');
    const testSale = await prisma.sale.create({
      data: {
        total: 150.00,
        clientCpfCnpj: testCustomer.cpfCnpj,
        clientName: testCustomer.name,
        paymentMethod: ['cash'],
        change: 0,
        companyId: testCustomer.companyId,
        sellerId: 'seu-seller-id-aqui', // Substitua pelo ID de um vendedor existente
        items: {
          create: [
            {
              quantity: 2,
              unitPrice: 75.00,
              totalPrice: 150.00,
              productId: 'seu-product-id-aqui', // Substitua pelo ID de um produto existente
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    console.log(`✅ Venda criada: ${testSale.id}\n`);

    // 4. Testar envio de email de confirmação de venda
    console.log('4. Testando email de confirmação de venda...');
    const saleConfirmationSent = await sendSaleConfirmationEmail(
      testCustomer.email,
      testCustomer.name,
      testSale,
      'Empresa Teste'
    );
    console.log(`✅ Email de confirmação: ${saleConfirmationSent ? 'Enviado' : 'Falhou'}\n`);

    // 5. Testar envio de email promocional
    console.log('5. Testando email promocional...');
    const promotionalEmailSent = await sendPromotionalEmail(
      testCustomer.email,
      testCustomer.name,
      {
        title: 'Oferta Especial - 20% OFF',
        message: 'Aproveite nossa oferta especial!',
        description: 'Desconto válido em todos os produtos',
        discount: '20% de desconto',
        validUntil: '2024-12-31',
      },
      'Empresa Teste'
    );
    console.log(`✅ Email promocional: ${promotionalEmailSent ? 'Enviado' : 'Falhou'}\n`);

    console.log('🎉 Teste do sistema de email concluído!');
    console.log('\n📋 Resumo:');
    console.log(`- Cliente criado: ${testCustomer.name}`);
    console.log(`- Email de boas-vindas: ${welcomeEmailSent ? '✅' : '❌'}`);
    console.log(`- Venda criada: ${testSale.id}`);
    console.log(`- Email de confirmação: ${saleConfirmationSent ? '✅' : '❌'}`);
    console.log(`- Email promocional: ${promotionalEmailSent ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function sendWelcomeEmail(customerEmail, customerName, companyName) {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: customerEmail,
      subject: `Bem-vindo(a) à ${companyName}!`,
      html: `
        <h1>🎉 Bem-vindo(a), ${customerName}!</h1>
        <p>É com grande prazer que damos as boas-vindas ao nosso sistema!</p>
        <p>A partir de agora, você receberá:</p>
        <ul>
          <li>📧 Confirmações de suas compras</li>
          <li>🎁 Ofertas especiais e promoções</li>
          <li>📱 Notificações importantes</li>
          <li>💡 Dicas e novidades</li>
        </ul>
        <p>Obrigado por escolher a <strong>${companyName}</strong>!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    return false;
  }
}

async function sendSaleConfirmationEmail(customerEmail, customerName, saleData, companyName) {
  try {
    const itemsHtml = saleData.items.map(item => `
      <tr>
        <td>${item.product.name}</td>
        <td>${item.quantity}</td>
        <td>R$ ${item.unitPrice.toFixed(2).replace('.', ',')}</td>
        <td>R$ ${item.totalPrice.toFixed(2).replace('.', ',')}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: customerEmail,
      subject: `Confirmação de Compra - ${companyName}`,
      html: `
        <h1>🛍️ Compra Confirmada!</h1>
        <p>Olá <strong>${customerName}</strong>,</p>
        <p>Sua compra foi realizada com sucesso!</p>
        
        <h3>Detalhes da Venda:</h3>
        <p><strong>Número:</strong> ${saleData.id}</p>
        <p><strong>Data:</strong> ${new Date(saleData.saleDate).toLocaleString('pt-BR')}</p>
        <p><strong>Total:</strong> R$ ${saleData.total.toFixed(2).replace('.', ',')}</p>
        
        <h3>Itens:</h3>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr>
            <th>Produto</th>
            <th>Qtd</th>
            <th>Preço Unit.</th>
            <th>Total</th>
          </tr>
          ${itemsHtml}
        </table>
        
        <p>Obrigado por sua compra na <strong>${companyName}</strong>!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de confirmação:', error);
    return false;
  }
}

async function sendPromotionalEmail(customerEmail, customerName, promotionData, companyName) {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: customerEmail,
      subject: promotionData.subject || `Oferta Especial - ${companyName}`,
      html: `
        <h1>🎁 ${promotionData.title}</h1>
        <p>Olá <strong>${customerName}</strong>,</p>
        <p>${promotionData.message}</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;">
          <h3>${promotionData.title}</h3>
          <p>${promotionData.description}</p>
          ${promotionData.discount ? `<p><strong>Desconto:</strong> ${promotionData.discount}</p>` : ''}
          ${promotionData.validUntil ? `<p><strong>Válido até:</strong> ${new Date(promotionData.validUntil).toLocaleDateString('pt-BR')}</p>` : ''}
        </div>
        
        <p>Aproveite esta oportunidade na <strong>${companyName}</strong>!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email promocional:', error);
    return false;
  }
}

// Executar o teste
testEmailSystem();
