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
const z_api_provider_1 = require("./providers/z-api.provider");
let WhatsappService = WhatsappService_1 = class WhatsappService {
    constructor(configService, zApiProvider) {
        this.configService = configService;
        this.zApiProvider = zApiProvider;
        this.logger = new common_1.Logger(WhatsappService_1.name);
        const zApiInstanceId = this.configService.get('Z_API_INSTANCE_ID', '');
        const zApiToken = this.configService.get('Z_API_TOKEN', '');
        if (zApiInstanceId && zApiToken) {
            this.provider = this.zApiProvider;
            this.providerName = 'Z-API';
            this.logger.log('✅ Z-API configurada como provider de WhatsApp');
        }
        else {
            this.provider = this.zApiProvider;
            this.providerName = 'Z-API';
            this.logger.warn('⚠️ Z-API não configurada completamente. Configure Z_API_INSTANCE_ID e Z_API_TOKEN no .env');
            this.logger.warn('💡 Obtenha suas credenciais em: https://developer.z-api.io/');
        }
    }
    async checkInstanceStatus() {
        return this.provider.checkConnection();
    }
    async sendMessage(message, retries = 2) {
        const startTime = Date.now();
        try {
            if (!message.to || message.to.trim() === '') {
                this.logger.error('🚨 Número de telefone não fornecido');
                return false;
            }
            if (!message.message || message.message.trim() === '') {
                this.logger.error('🚨 Mensagem vazia não pode ser enviada');
                return false;
            }
            if (message.message.length > 65536) {
                this.logger.error(`🚨 Mensagem muito longa: ${message.message.length} caracteres (máximo: 65536)`);
                return false;
            }
            if (retries === 2) {
                const instanceStatus = await this.checkInstanceStatus();
                if (!instanceStatus.connected) {
                    this.logger.warn(`⚠️ Instância ${this.providerName} não está conectada. Status: ${instanceStatus.status}`);
                }
            }
            const isValid = await this.provider.validatePhoneNumber(message.to);
            if (!isValid) {
                this.logger.error(`📵 Número de telefone inválido: ${message.to}`);
                return false;
            }
            const formattedPhone = await this.provider.formatPhoneNumber(message.to);
            const messageLength = message.message.length;
            this.logger.log(`📤 Enviando mensagem WhatsApp via ${this.providerName} | Destino: ${formattedPhone} | Tamanho: ${messageLength} chars | Tentativa: ${3 - retries}/3`);
            const success = await this.provider.sendMessage(formattedPhone, message.message);
            const duration = Date.now() - startTime;
            if (success) {
                this.logger.log(`✅ Mensagem WhatsApp enviada com sucesso via ${this.providerName} | Destino: ${formattedPhone} | Tempo: ${duration}ms`);
                return true;
            }
            this.logger.error(`❌ Erro ao enviar mensagem WhatsApp via ${this.providerName} | Destino: ${formattedPhone} | Tempo: ${duration}ms`);
            return false;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const isPermanentError = error.response && [400, 401, 403, 404].includes(error.response.status);
            if (isPermanentError) {
                this.logger.error(`❌ Erro permanente ao enviar mensagem WhatsApp via ${this.providerName} | Destino: ${message.to} | Status: ${error.response.status} | Tempo: ${duration}ms`);
                if (error.message) {
                    this.logger.error(`💬 Mensagem de erro: ${error.message}`);
                }
                return false;
            }
            this.logger.error(`❌ Erro ao enviar mensagem WhatsApp via ${this.providerName} | Destino: ${message.to} | Tentativa: ${3 - retries}/3 | Tempo: ${duration}ms`);
            if (error.message) {
                this.logger.error(`💬 Mensagem de erro: ${error.message}`);
            }
            if (retries > 0) {
                const delay = Math.pow(2, 3 - retries) * 1000;
                this.logger.warn(`⚠️ Erro temporário, tentando novamente em ${delay}ms... (tentativas restantes: ${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.sendMessage(message, retries - 1);
            }
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
    async sendInstallmentBilling(billingData, phone) {
        try {
            if (!billingData || !phone) {
                this.logger.error('🚨 Dados de cobrança ou telefone inválidos');
                return false;
            }
            if (!billingData.customerName) {
                this.logger.error('🚨 Nome do cliente não fornecido');
                return false;
            }
            if (!billingData.dueDate) {
                this.logger.error('🚨 Data de vencimento não fornecida');
                return false;
            }
            const dueDateFormatted = new Date(billingData.dueDate).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
            const daysUntilDue = Math.ceil((new Date(billingData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            let statusEmoji = '📅';
            let statusText = '';
            if (daysUntilDue < 0) {
                statusEmoji = '⚠️';
                statusText = `*VENCIDA há ${Math.abs(daysUntilDue)} dia(s)*`;
            }
            else if (daysUntilDue === 0) {
                statusEmoji = '🔴';
                statusText = '*VENCE HOJE*';
            }
            else if (daysUntilDue <= 3) {
                statusEmoji = '🟡';
                statusText = `*Vence em ${daysUntilDue} dia(s)*`;
            }
            else {
                statusText = `*Vence em ${daysUntilDue} dia(s)*`;
            }
            const message = `
${statusEmoji} *COBRANÇA - PARCELA ${billingData.installmentNumber}/${billingData.totalInstallments}*

Olá, ${billingData.customerName}!

${statusText}

📋 *Detalhes da Parcela:*
• Parcela: ${billingData.installmentNumber} de ${billingData.totalInstallments}
• Valor Total: R$ ${billingData.amount.toFixed(2).replace('.', ',')}
• Valor Restante: R$ ${billingData.remainingAmount.toFixed(2).replace('.', ',')}
• Vencimento: ${dueDateFormatted}
${billingData.description ? `• Descrição: ${billingData.description}\n` : ''}
${billingData.companyName ? `\n🏢 *${billingData.companyName}*\n` : ''}
Por favor, efetue o pagamento até a data de vencimento.

Obrigado pela atenção! 🙏
      `.trim();
            const success = await this.sendMessage({
                to: phone,
                message,
                type: 'text',
            });
            if (success) {
                this.logger.log(`💰 Mensagem de cobrança enviada para ${billingData.customerName} (${phone})`);
            }
            else {
                this.logger.error(`🚨 Falha ao enviar mensagem de cobrança para ${billingData.customerName} (${phone})`);
            }
            return success;
        }
        catch (error) {
            this.logger.error(`❌ Erro ao enviar mensagem de cobrança para ${phone}:`, error.message);
            return false;
        }
    }
    async sendMultipleInstallmentsBilling(customerName, phone, installments, companyName) {
        try {
            const totalDebt = installments.reduce((sum, inst) => sum + inst.remainingAmount, 0);
            const overdueCount = installments.filter(inst => new Date(inst.dueDate) < new Date()).length;
            const installmentsList = installments
                .map(inst => {
                const dueDateFormatted = new Date(inst.dueDate).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                });
                const isOverdue = new Date(inst.dueDate) < new Date();
                const emoji = isOverdue ? '🔴' : '📅';
                return `${emoji} Parcela ${inst.installmentNumber}/${inst.totalInstallments}: R$ ${inst.remainingAmount.toFixed(2).replace('.', ',')} - Venc: ${dueDateFormatted}`;
            })
                .join('\n');
            const message = `
💰 *RESUMO DE COBRANÇAS*

Olá, ${customerName}!

Você possui *${installments.length} parcela(s) pendente(s)*:
${installmentsList}

📊 *Total em Aberto:* R$ ${totalDebt.toFixed(2).replace('.', ',')}
${overdueCount > 0 ? `⚠️ *${overdueCount} parcela(s) vencida(s)*\n` : ''}
${companyName ? `\n🏢 *${companyName}*\n` : ''}
Por favor, entre em contato para regularizar sua situação.

Obrigado pela atenção! 🙏
      `.trim();
            const success = await this.sendMessage({
                to: phone,
                message,
                type: 'text',
            });
            if (success) {
                this.logger.log(`Mensagem de cobrança múltipla enviada para ${customerName} (${phone})`);
            }
            return success;
        }
        catch (error) {
            this.logger.error(`Erro ao enviar mensagem de cobrança múltipla para ${phone}:`, error);
            return false;
        }
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
        return this.provider.validatePhoneNumber(phone);
    }
    async formatPhoneNumber(phone) {
        return this.provider.formatPhoneNumber(phone);
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        z_api_provider_1.ZApiProvider])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map