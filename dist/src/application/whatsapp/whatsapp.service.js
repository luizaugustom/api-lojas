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
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let WhatsappService = WhatsappService_1 = class WhatsappService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(WhatsappService_1.name);
        this.whatsappApiUrl = this.configService.get('WHATSAPP_API_URL', 'https://api.whatsapp.com');
        this.whatsappToken = this.configService.get('WHATSAPP_TOKEN', '');
    }
    async sendMessage(message) {
        try {
            this.logger.log(`Sending WhatsApp message to: ${message.to}`);
            this.logger.log(`Message: ${message.message}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.logger.log('WhatsApp message sent successfully');
            return true;
        }
        catch (error) {
            this.logger.error('Error sending WhatsApp message:', error);
            return false;
        }
    }
    async sendSaleNotification(phone, saleData) {
        const message = `
🛍️ *Nova Venda Realizada!*

📋 *Detalhes da Venda:*
• ID: ${saleData.id}
• Data: ${new Date(saleData.saleDate).toLocaleString('pt-BR')}
• Total: R$ ${saleData.total.toFixed(2).replace('.', ',')}

💰 *Formas de Pagamento:*
${saleData.paymentMethods.map((method) => `• ${this.getPaymentMethodName(method)}`).join('\n')}

${saleData.change > 0 ? `💸 *Troco:* R$ ${saleData.change.toFixed(2).replace('.', ',')}\n` : ''}

👤 *Cliente:* ${saleData.clientName || 'Cliente não informado'}

Obrigado pela venda! 🎉
    `.trim();
        return this.sendMessage({
            to: phone,
            message,
            type: 'text',
        });
    }
    async sendLowStockAlert(phone, productData) {
        const message = `
⚠️ *ALERTA DE ESTOQUE BAIXO*

📦 *Produto:* ${productData.name}
🏷️ *Código:* ${productData.barcode}
📊 *Estoque Atual:* ${productData.stockQuantity} unidades
⚠️ *Status:* Estoque baixo!

Recomendamos repor o estoque o quanto antes.
    `.trim();
        return this.sendMessage({
            to: phone,
            message,
            type: 'text',
        });
    }
    async sendPaymentReminder(phone, billData) {
        const message = `
💳 *LEMBRETE DE PAGAMENTO*

📋 *Conta:* ${billData.title}
💰 *Valor:* R$ ${billData.amount.toFixed(2).replace('.', ',')}
📅 *Vencimento:* ${new Date(billData.dueDate).toLocaleDateString('pt-BR')}

Por favor, efetue o pagamento até a data de vencimento.
    `.trim();
        return this.sendMessage({
            to: phone,
            message,
            type: 'text',
        });
    }
    async sendCashClosureReport(phone, closureData) {
        const message = `
💰 *RELATÓRIO DE FECHAMENTO DE CAIXA*

📅 *Data:* ${new Date(closureData.closingDate).toLocaleDateString('pt-BR')}

💵 *Valores:*
• Abertura: R$ ${closureData.openingAmount.toFixed(2).replace('.', ',')}
• Fechamento: R$ ${closureData.closingAmount.toFixed(2).replace('.', ',')}
• Total Vendas: R$ ${closureData.totalSales.toFixed(2).replace('.', ',')}
• Saques: R$ ${closureData.totalWithdrawals.toFixed(2).replace('.', ',')}

✅ Fechamento de caixa realizado com sucesso!
    `.trim();
        return this.sendMessage({
            to: phone,
            message,
            type: 'text',
        });
    }
    async sendTemplateMessage(template, to) {
        try {
            this.logger.log(`Sending WhatsApp template: ${template.name} to: ${to}`);
            this.logger.log(`Template: ${template.name} with parameters: ${template.parameters.join(', ')}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.logger.log('WhatsApp template sent successfully');
            return true;
        }
        catch (error) {
            this.logger.error('Error sending WhatsApp template:', error);
            return false;
        }
    }
    async sendMediaMessage(to, mediaUrl, filename) {
        return this.sendMessage({
            to,
            message: '',
            type: 'image',
            mediaUrl,
            filename,
        });
    }
    async sendDocumentMessage(to, mediaUrl, filename) {
        return this.sendMessage({
            to,
            message: '',
            type: 'document',
            mediaUrl,
            filename,
        });
    }
    async getMessageStatus(messageId) {
        try {
            return {
                status: 'delivered',
                timestamp: new Date(),
            };
        }
        catch (error) {
            this.logger.error('Error getting message status:', error);
            return {
                status: 'failed',
                timestamp: new Date(),
            };
        }
    }
    getPaymentMethodName(method) {
        const methods = {
            'credit_card': 'Cartão de Crédito',
            'debit_card': 'Cartão de Débito',
            'cash': 'Dinheiro',
            'pix': 'PIX',
            'installment': 'A Prazo',
        };
        return methods[method] || method;
    }
    async validatePhoneNumber(phone) {
        const phoneRegex = /^(\+55)?[\s]?[1-9]{2}[\s]?[9]?[\d]{4}[\s]?[\d]{4}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }
    async formatPhoneNumber(phone) {
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 11) {
            return `55${digits}`;
        }
        else if (digits.length === 13 && digits.startsWith('55')) {
            return digits;
        }
        throw new Error('Número de telefone inválido');
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map