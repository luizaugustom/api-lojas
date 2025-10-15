import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface WhatsAppMessage {
  to: string;
  message: string;
  type?: 'text' | 'image' | 'document';
  mediaUrl?: string;
  filename?: string;
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  parameters: string[];
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly whatsappApiUrl: string;
  private readonly whatsappToken: string;

  constructor(private readonly configService: ConfigService) {
    this.whatsappApiUrl = this.configService.get('WHATSAPP_API_URL', 'https://api.whatsapp.com');
    this.whatsappToken = this.configService.get('WHATSAPP_TOKEN', '');
  }

  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      this.logger.log(`Sending WhatsApp message to: ${message.to}`);

      // This would integrate with WhatsApp Business API
      // For now, just log the message
      this.logger.log(`Message: ${message.message}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.logger.log('WhatsApp message sent successfully');
      return true;
    } catch (error) {
      this.logger.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  async sendSaleNotification(phone: string, saleData: any): Promise<boolean> {
    const message = `
🛍️ *Nova Venda Realizada!*

📋 *Detalhes da Venda:*
• ID: ${saleData.id}
• Data: ${new Date(saleData.saleDate).toLocaleString('pt-BR')}
• Total: R$ ${saleData.total.toFixed(2).replace('.', ',')}

💰 *Formas de Pagamento:*
${saleData.paymentMethods.map((method: string) => `• ${this.getPaymentMethodName(method)}`).join('\n')}

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

  async sendLowStockAlert(phone: string, productData: any): Promise<boolean> {
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

  async sendPaymentReminder(phone: string, billData: any): Promise<boolean> {
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

  async sendCashClosureReport(phone: string, closureData: any): Promise<boolean> {
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

  async sendTemplateMessage(template: WhatsAppTemplate, to: string): Promise<boolean> {
    try {
      this.logger.log(`Sending WhatsApp template: ${template.name} to: ${to}`);

      // This would send a template message via WhatsApp Business API
      this.logger.log(`Template: ${template.name} with parameters: ${template.parameters.join(', ')}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.logger.log('WhatsApp template sent successfully');
      return true;
    } catch (error) {
      this.logger.error('Error sending WhatsApp template:', error);
      return false;
    }
  }

  async sendMediaMessage(to: string, mediaUrl: string, filename?: string): Promise<boolean> {
    return this.sendMessage({
      to,
      message: '',
      type: 'image',
      mediaUrl,
      filename,
    });
  }

  async sendDocumentMessage(to: string, mediaUrl: string, filename: string): Promise<boolean> {
    return this.sendMessage({
      to,
      message: '',
      type: 'document',
      mediaUrl,
      filename,
    });
  }

  async getMessageStatus(messageId: string): Promise<{ status: string; timestamp: Date }> {
    try {
      // This would check the status of a WhatsApp message
      // For now, return mock data
      return {
        status: 'delivered',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting message status:', error);
      return {
        status: 'failed',
        timestamp: new Date(),
      };
    }
  }

  private getPaymentMethodName(method: string): string {
    const methods = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'cash': 'Dinheiro',
      'pix': 'PIX',
      'installment': 'A Prazo',
    };
    
    return methods[method] || method;
  }

  async validatePhoneNumber(phone: string): Promise<boolean> {
    // Basic Brazilian phone number validation
    const phoneRegex = /^(\+55)?[\s]?[1-9]{2}[\s]?[9]?[\d]{4}[\s]?[\d]{4}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  async formatPhoneNumber(phone: string): Promise<string> {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (digits.length === 11) {
      return `55${digits}`;
    } else if (digits.length === 13 && digits.startsWith('55')) {
      return digits;
    }
    
    throw new Error('Número de telefone inválido');
  }
}
