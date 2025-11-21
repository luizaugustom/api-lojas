import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

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
  private readonly evolutionApiUrl: string;
  private readonly evolutionApiKey: string;
  private readonly evolutionInstance: string;
  private readonly httpClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.evolutionApiUrl = this.configService.get('EVOLUTION_API_URL', '').replace(/\/$/, ''); // Remove trailing slash
    this.evolutionApiKey = this.configService.get('EVOLUTION_API_KEY', '');
    this.evolutionInstance = this.configService.get('EVOLUTION_INSTANCE', 'default');

    // Configurar cliente HTTP para Evolution API
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.evolutionApiKey,
      },
    });

    if (!this.evolutionApiUrl || !this.evolutionApiKey) {
      this.logger.warn('Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY no .env');
    } else {
      this.logger.log(`Evolution API configurada: ${this.evolutionApiUrl} (Instance: ${this.evolutionInstance})`);
    }
  }

  /**
   * Verifica se a instância está conectada e pronta para enviar mensagens
   */
  async checkInstanceStatus(): Promise<{ connected: boolean; status?: string }> {
    try {
      if (!this.evolutionApiUrl || !this.evolutionApiKey) {
        return { connected: false, status: 'not_configured' };
      }

      const url = `${this.evolutionApiUrl}/instance/connectionState/${this.evolutionInstance}`;
      const response = await this.httpClient.get(url);

      if (response.status === 200 && response.data) {
        const state = response.data.state || response.data.status;
        const connected = state === 'open' || state === 'connected';
        return { connected, status: state };
      }

      return { connected: false, status: 'unknown' };
    } catch (error) {
      this.logger.warn(`Erro ao verificar status da instância: ${error.message}`);
      return { connected: false, status: 'error' };
    }
  }

  async sendMessage(message: WhatsAppMessage, retries: number = 2): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Validar configuração
      if (!this.evolutionApiUrl || !this.evolutionApiKey) {
        this.logger.warn('Evolution API não configurada. Verifique EVOLUTION_API_URL e EVOLUTION_API_KEY no .env');
        return false;
      }

      // Verificar se a instância está conectada (apenas no primeiro envio)
      if (retries === 2) {
        const instanceStatus = await this.checkInstanceStatus();
        if (!instanceStatus.connected) {
          this.logger.warn(`Instância ${this.evolutionInstance} não está conectada. Status: ${instanceStatus.status}`);
          // Não falhar imediatamente, tentar enviar mesmo assim (pode ser cache)
        }
      }

      // Validar número de telefone
      const formattedPhone = await this.formatPhoneNumber(message.to);
      const messageLength = message.message.length;
      
      this.logger.log(`📤 Enviando mensagem WhatsApp | Destino: ${formattedPhone} | Tamanho: ${messageLength} chars | Tentativa: ${3 - retries}/3 | Instância: ${this.evolutionInstance}`);

      // Enviar via Evolution API
      const url = `${this.evolutionApiUrl}/message/sendText/${this.evolutionInstance}`;
      
      const payload = {
        number: formattedPhone,
        text: message.message,
      };

      const response = await this.httpClient.post(url, payload);
      const duration = Date.now() - startTime;

      if (response.status === 200 || response.status === 201) {
        this.logger.log(`✅ Mensagem WhatsApp enviada com sucesso | Destino: ${formattedPhone} | Tempo: ${duration}ms | Status: ${response.status}`);
        return true;
      }

      this.logger.warn(`⚠️ Resposta inesperada da Evolution API | Status: ${response.status} | Tempo: ${duration}ms | Destino: ${formattedPhone}`);
      return false;
    } catch (error) {
      // Retry logic para erros temporários
      if (retries > 0 && this.isRetryableError(error)) {
        const delay = Math.pow(2, 3 - retries) * 1000; // Backoff exponencial: 1s, 2s, 4s
        this.logger.warn(`Erro temporário, tentando novamente em ${delay}ms... (tentativas restantes: ${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendMessage(message, retries - 1);
      }

      const duration = Date.now() - startTime;
      this.logger.error(`❌ Erro ao enviar mensagem WhatsApp | Destino: ${message.to} | Tentativa: ${3 - retries}/3 | Tempo: ${duration}ms`);
      
      if (error.response) {
        this.logger.error(`📊 Detalhes do erro | Status: ${error.response.status} | Resposta: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        this.logger.error(`🔌 Erro de conexão | Não foi possível conectar à Evolution API | URL: ${this.evolutionApiUrl}`);
      } else {
        this.logger.error(`⚠️ Erro desconhecido | Mensagem: ${error.message}`);
      }
      
      if (error.stack) {
        this.logger.debug(`Stack trace: ${error.stack}`);
      }
      
      return false;
    }
  }

  /**
   * Verifica se o erro é recuperável (deve tentar novamente)
   */
  private isRetryableError(error: any): boolean {
    // Erros de rede/timeout são recuperáveis
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }

    // Erros 5xx são recuperáveis (erro do servidor)
    if (error.response && error.response.status >= 500 && error.response.status < 600) {
      return true;
    }

    // Erro 429 (Too Many Requests) é recuperável
    if (error.response && error.response.status === 429) {
      return true;
    }

    return false;
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
