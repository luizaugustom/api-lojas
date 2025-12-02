import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IWhatsAppProvider } from './providers/whatsapp-provider.interface';
import { ZApiProvider } from './providers/z-api.provider';

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

export interface InstallmentBillingData {
  customerName: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  remainingAmount: number;
  dueDate: Date;
  description?: string;
  saleId?: string;
  companyName?: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly provider: IWhatsAppProvider;
  private readonly providerName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly zApiProvider: ZApiProvider,
  ) {
    const zApiInstanceId = this.configService.get('Z_API_INSTANCE_ID', '');
    const zApiToken = this.configService.get('Z_API_TOKEN', '');

    if (zApiInstanceId && zApiToken) {
      this.provider = this.zApiProvider;
      this.providerName = 'Z-API';
      this.logger.log('✅ Z-API configurada como provider de WhatsApp');
    } else {
      this.provider = this.zApiProvider;
      this.providerName = 'Z-API';
      this.logger.warn('⚠️ Z-API não configurada completamente. Configure Z_API_INSTANCE_ID e Z_API_TOKEN no .env');
      this.logger.warn('💡 Obtenha suas credenciais em: https://developer.z-api.io/');
    }
  }

  /**
   * Verifica se a instância está conectada e pronta para enviar mensagens
   */
  async checkInstanceStatus(): Promise<{ connected: boolean; status?: string }> {
    return this.provider.checkConnection();
  }

  async sendMessage(message: WhatsAppMessage, retries: number = 2): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Verificar se a instância está conectada (apenas no primeiro envio)
      if (retries === 2) {
        const instanceStatus = await this.checkInstanceStatus();
        if (!instanceStatus.connected) {
          this.logger.warn(`⚠️ Instância ${this.providerName} não está conectada. Status: ${instanceStatus.status}`);
          // Não falhar imediatamente, tentar enviar mesmo assim (pode ser cache)
        }
      }

      // Validar número de telefone
      const isValid = await this.provider.validatePhoneNumber(message.to);
      if (!isValid) {
        this.logger.warn(`⚠️ Número de telefone inválido: ${message.to}`);
        return false;
      }

      const formattedPhone = await this.provider.formatPhoneNumber(message.to);
      const messageLength = message.message.length;
      
      this.logger.log(`📤 Enviando mensagem WhatsApp via ${this.providerName} | Destino: ${formattedPhone} | Tamanho: ${messageLength} chars | Tentativa: ${3 - retries}/3`);

      // Enviar mensagem via provider
      const success = await this.provider.sendMessage(formattedPhone, message.message);
      const duration = Date.now() - startTime;

      if (success) {
        this.logger.log(`✅ Mensagem WhatsApp enviada com sucesso via ${this.providerName} | Destino: ${formattedPhone} | Tempo: ${duration}ms`);
        return true;
      }

      // Retry logic para erros temporários
      if (retries > 0) {
        const delay = Math.pow(2, 3 - retries) * 1000; // Backoff exponencial: 1s, 2s, 4s
        this.logger.warn(`⚠️ Falha ao enviar, tentando novamente em ${delay}ms... (tentativas restantes: ${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendMessage(message, retries - 1);
      }

      this.logger.error(`❌ Erro ao enviar mensagem WhatsApp via ${this.providerName} | Destino: ${formattedPhone} | Tempo: ${duration}ms`);
      return false;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ Erro ao enviar mensagem WhatsApp via ${this.providerName} | Destino: ${message.to} | Tentativa: ${3 - retries}/3 | Tempo: ${duration}ms`);
      
      if (error.stack) {
        this.logger.debug(`Stack trace: ${error.stack}`);
      }

      // Retry logic para erros temporários
      if (retries > 0) {
        const delay = Math.pow(2, 3 - retries) * 1000;
        this.logger.warn(`⚠️ Erro temporário, tentando novamente em ${delay}ms... (tentativas restantes: ${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendMessage(message, retries - 1);
      }
      
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

  /**
   * Envia mensagem de cobrança para uma parcela específica
   */
  async sendInstallmentBilling(billingData: InstallmentBillingData, phone: string): Promise<boolean> {
    try {
      const dueDateFormatted = new Date(billingData.dueDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const daysUntilDue = Math.ceil(
        (new Date(billingData.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      let statusEmoji = '📅';
      let statusText = '';
      
      if (daysUntilDue < 0) {
        statusEmoji = '⚠️';
        statusText = `*VENCIDA há ${Math.abs(daysUntilDue)} dia(s)*`;
      } else if (daysUntilDue === 0) {
        statusEmoji = '🔴';
        statusText = '*VENCE HOJE*';
      } else if (daysUntilDue <= 3) {
        statusEmoji = '🟡';
        statusText = `*Vence em ${daysUntilDue} dia(s)*`;
      } else {
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
        this.logger.log(`Mensagem de cobrança enviada para ${billingData.customerName} (${phone})`);
      }

      return success;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem de cobrança para ${phone}:`, error);
      return false;
    }
  }

  /**
   * Envia mensagem de cobrança para múltiplas parcelas de um cliente
   */
  async sendMultipleInstallmentsBilling(
    customerName: string,
    phone: string,
    installments: Array<{
      installmentNumber: number;
      totalInstallments: number;
      amount: number;
      remainingAmount: number;
      dueDate: Date;
      description?: string;
    }>,
    companyName?: string,
  ): Promise<boolean> {
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
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem de cobrança múltipla para ${phone}:`, error);
      return false;
    }
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
    return this.provider.validatePhoneNumber(phone);
  }

  async formatPhoneNumber(phone: string): Promise<string> {
    return this.provider.formatPhoneNumber(phone);
  }
}
