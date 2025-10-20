"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let EmailService = EmailService_1 = class EmailService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(EmailService_1.name);
        this.initializeTransporter();
    }
    initializeTransporter() {
        const smtpHost = this.configService.get('SMTP_HOST');
        const smtpPort = this.configService.get('SMTP_PORT');
        const smtpUser = this.configService.get('SMTP_USER');
        const smtpPass = this.configService.get('SMTP_PASS');
        if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
            this.logger.warn('Configurações SMTP não encontradas. Serviço de email desabilitado.');
            return;
        }
        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });
        this.logger.log('Serviço de email inicializado com sucesso');
    }
    async sendEmail(options) {
        if (!this.transporter) {
            this.logger.error('Transporter não inicializado. Verifique as configurações SMTP.');
            return false;
        }
        try {
            const mailOptions = {
                from: this.configService.get('SMTP_USER'),
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            };
            const result = await this.transporter.sendMail(mailOptions);
            this.logger.log(`Email enviado com sucesso para ${options.to}. MessageId: ${result.messageId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar email para ${options.to}:`, error);
            return false;
        }
    }
    async sendWelcomeEmail(customerEmail, customerName, companyName) {
        const template = this.getWelcomeTemplate(customerName, companyName);
        return this.sendEmail({
            to: customerEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }
    async sendSaleConfirmationEmail(customerEmail, customerName, saleData, companyName) {
        const template = this.getSaleConfirmationTemplate(customerName, saleData, companyName);
        return this.sendEmail({
            to: customerEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }
    async sendPromotionalEmail(customerEmail, customerName, promotionData, companyName) {
        const template = this.getPromotionalTemplate(customerName, promotionData, companyName);
        return this.sendEmail({
            to: customerEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
        });
    }
    getWelcomeTemplate(customerName, companyName) {
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
    getSaleConfirmationTemplate(customerName, saleData, companyName) {
        const subject = `Confirmação de Compra - ${companyName}`;
        const itemsHtml = saleData.items?.map((item) => `
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
              <p><strong>Data:</strong> ${new Date(saleData.saleDate).toLocaleString('pt-BR')}</p>
              <p><strong>Forma de Pagamento:</strong> ${saleData.paymentMethod?.join(', ') || 'Não informado'}</p>
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
        const itemsText = saleData.items?.map((item) => `- ${item.product?.name || 'Produto'} (Qtd: ${item.quantity}) - R$ ${item.totalPrice?.toFixed(2).replace('.', ',') || '0,00'}`).join('\n') || '';
        const text = `
      Compra Confirmada!
      
      Olá ${customerName},
      
      Sua compra foi realizada com sucesso! Aqui estão os detalhes:
      
      Número da Venda: ${saleData.id}
      Data: ${new Date(saleData.saleDate).toLocaleString('pt-BR')}
      Forma de Pagamento: ${saleData.paymentMethod?.join(', ') || 'Não informado'}
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
    getPromotionalTemplate(customerName, promotionData, companyName) {
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
              ${promotionData.validUntil ? `<p><strong>Válido até:</strong> ${new Date(promotionData.validUntil).toLocaleDateString('pt-BR')}</p>` : ''}
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
      ${promotionData.validUntil ? `Válido até: ${new Date(promotionData.validUntil).toLocaleDateString('pt-BR')}` : ''}
      
      Aproveite esta oportunidade na ${companyName}!
      Esperamos vê-lo em breve! 😊
      
      ---
      Este é um email automático, por favor não responda.
      ${companyName} - MONT Tecnologias
    `;
        return { subject, html, text };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map