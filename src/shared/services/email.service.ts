import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ClientTimeInfo, formatClientDate, formatClientDateOnly } from '../utils/client-time.util';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      this.logger.warn('Configurações SMTP não encontradas. Serviço de email desabilitado.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true para 465, false para outras portas
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    this.logger.log('Serviço de email inicializado com sucesso');
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('Transporter não inicializado. Verifique as configurações SMTP.');
      return false;
    }

    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_USER'),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email enviado com sucesso para ${options.to}. MessageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar email para ${options.to}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(customerEmail: string, customerName: string, companyName: string): Promise<boolean> {
    const template = this.getWelcomeTemplate(customerName, companyName);
    
    return this.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendSaleConfirmationEmail(
    customerEmail: string, 
    customerName: string, 
    saleData: any, 
    companyName: string,
    clientTimeInfo?: ClientTimeInfo,
  ): Promise<boolean> {
    const template = this.getSaleConfirmationTemplate(customerName, saleData, companyName, clientTimeInfo);
    
    return this.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPromotionalEmail(
    customerEmail: string, 
    customerName: string, 
    promotionData: any, 
    companyName: string,
    clientTimeInfo?: ClientTimeInfo,
  ): Promise<boolean> {
    const template = this.getPromotionalTemplate(customerName, promotionData, companyName, clientTimeInfo);
    
    return this.sendEmail({
      to: customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  private getWelcomeTemplate(customerName: string, companyName: string): EmailTemplate {
    const subject = `Bem-vindo(a) à ${companyName}!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bem-vindo(a)</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bem-vindo(a), ${customerName}!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${customerName}</strong>,</p>
            <p>É com grande prazer que damos as boas-vindas ao nosso sistema!</p>
            <p>A partir de agora, você receberá:</p>
            <ul>
              <li>📧 Confirmações de suas compras</li>
              <li>🎁 Ofertas especiais e promoções</li>
              <li>📱 Notificações importantes</li>
              <li>💡 Dicas e novidades</li>
            </ul>
            <p>Obrigado por escolher a <strong>${companyName}</strong>!</p>
            <p>Se tiver alguma dúvida, não hesite em nos contatar.</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>${companyName} - MONT Tecnologias</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bem-vindo(a), ${customerName}!
      
      É com grande prazer que damos as boas-vindas ao nosso sistema!
      
      A partir de agora, você receberá:
      - Confirmações de suas compras
      - Ofertas especiais e promoções
      - Notificações importantes
      - Dicas e novidades
      
      Obrigado por escolher a ${companyName}!
      
      Se tiver alguma dúvida, não hesite em nos contatar.
      
      ---
      Este é um email automático, por favor não responda.
      ${companyName} - MONT Tecnologias
    `;

    return { subject, html, text };
  }

  private getSaleConfirmationTemplate(
    customerName: string,
    saleData: any,
    companyName: string,
    clientTimeInfo?: ClientTimeInfo,
  ): EmailTemplate {
    const subject = `Confirmação de Compra - ${companyName}`;
    
    const itemsHtml = saleData.items?.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product?.name || 'Produto'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.unitPrice?.toFixed(2).replace('.', ',') || '0,00'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R$ ${item.totalPrice?.toFixed(2).replace('.', ',') || '0,00'}</td>
      </tr>
    `).join('') || '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Confirmação de Compra</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .sale-info { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f8f9fa; padding: 10px; text-align: left; font-weight: bold; }
          .total { font-size: 18px; font-weight: bold; color: #28a745; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ Compra Confirmada!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${customerName}</strong>,</p>
            <p>Sua compra foi realizada com sucesso! Aqui estão os detalhes:</p>
            
            <div class="sale-info">
              <p><strong>Número da Venda:</strong> ${saleData.id}</p>
              <p><strong>Data:</strong> ${formatClientDate(saleData.saleDate, clientTimeInfo)}</p>
              <p><strong>Forma de Pagamento:</strong> ${this.stringifyPaymentMethods(saleData.paymentMethod)}</p>
              ${saleData.change > 0 ? `<p><strong>Troco:</strong> R$ ${saleData.change.toFixed(2).replace('.', ',')}</p>` : ''}
            </div>

            <h3>Itens Comprados:</h3>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Preço Unit.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="text-align: right; margin-top: 20px;">
              <p class="total">Total: R$ ${saleData.total?.toFixed(2).replace('.', ',') || '0,00'}</p>
            </div>

            <p>Obrigado por sua compra na <strong>${companyName}</strong>!</p>
            <p>Volte sempre! 😊</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>${companyName} - MONT Tecnologias</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const itemsText = saleData.items?.map((item: any) => 
      `- ${item.product?.name || 'Produto'} (Qtd: ${item.quantity}) - R$ ${item.totalPrice?.toFixed(2).replace('.', ',') || '0,00'}`
    ).join('\n') || '';

    const text = `
      Compra Confirmada!
      
      Olá ${customerName},
      
      Sua compra foi realizada com sucesso! Aqui estão os detalhes:
      
      Número da Venda: ${saleData.id}
      Data: ${formatClientDate(saleData.saleDate, clientTimeInfo)}
      Forma de Pagamento: ${this.stringifyPaymentMethods(saleData.paymentMethod)}
      ${saleData.change > 0 ? `Troco: R$ ${saleData.change.toFixed(2).replace('.', ',')}` : ''}
      
      Itens Comprados:
      ${itemsText}
      
      Total: R$ ${saleData.total?.toFixed(2).replace('.', ',') || '0,00'}
      
      Obrigado por sua compra na ${companyName}!
      Volte sempre! 😊
      
      ---
      Este é um email automático, por favor não responda.
      ${companyName} - MONT Tecnologias
    `;

    return { subject, html, text };
  }

  private getPromotionalTemplate(
    customerName: string,
    promotionData: any,
    companyName: string,
    clientTimeInfo?: ClientTimeInfo,
  ): EmailTemplate {
    const subject = promotionData.subject || `Oferta Especial - ${companyName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Oferta Especial</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; }
          .promotion { background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 ${promotionData.title || 'Oferta Especial'}</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${customerName}</strong>,</p>
            <p>${promotionData.message || 'Temos uma oferta especial para você!'}</p>
            
            <div class="promotion">
              <h3>${promotionData.title || 'Oferta Especial'}</h3>
              <p>${promotionData.description || 'Não perca esta oportunidade!'}</p>
              ${promotionData.discount ? `<p><strong>Desconto:</strong> ${promotionData.discount}</p>` : ''}
              ${promotionData.validUntil ? `<p><strong>Válido até:</strong> ${formatClientDateOnly(promotionData.validUntil, clientTimeInfo)}</p>` : ''}
            </div>

            <p>Aproveite esta oportunidade na <strong>${companyName}</strong>!</p>
            <p>Esperamos vê-lo em breve! 😊</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>${companyName} - MONT Tecnologias</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${promotionData.title || 'Oferta Especial'}
      
      Olá ${customerName},
      
      ${promotionData.message || 'Temos uma oferta especial para você!'}
      
      ${promotionData.title || 'Oferta Especial'}
      ${promotionData.description || 'Não perca esta oportunidade!'}
      ${promotionData.discount ? `Desconto: ${promotionData.discount}` : ''}
      ${promotionData.validUntil ? `Válido até: ${formatClientDateOnly(promotionData.validUntil, clientTimeInfo)}` : ''}
      
      Aproveite esta oportunidade na ${companyName}!
      Esperamos vê-lo em breve! 😊
      
      ---
      Este é um email automático, por favor não responda.
      ${companyName} - MONT Tecnologias
    `;

    return { subject, html, text };
  }

  private stringifyPaymentMethods(methods: any): string {
    if (!methods) {
      return 'Não informado';
    }

    const normalized = Array.isArray(methods) ? methods : [methods];
    const labels = normalized
      .map((method) => {
        if (typeof method === 'string') {
          return method;
        }
        if (method?.method) {
          return method.method;
        }
        if (method?.type) {
          return method.type;
        }
        return '';
      })
      .filter((label) => !!label);

    return labels.length > 0 ? labels.join(', ') : 'Não informado';
  }
}
