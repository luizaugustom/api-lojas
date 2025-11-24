import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { PlanType } from '@prisma/client';

@Injectable()
export class InstallmentMessagingService {
  private readonly logger = new Logger(InstallmentMessagingService.name);
  private readonly maxMessagesPerCompanyPerHour: number = 50; // Rate limiting por empresa
  private readonly companyMessageCounts: Map<string, { count: number; resetAt: Date }> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

  /**
   * Cron job que executa diariamente às 7h (horário de Brasília) para verificar parcelas vencidas ou a vencer
   * Expressão cron: 0 7 * * * (minuto 0, hora 7, todos os dias)
   * Timezone: America/Sao_Paulo (UTC-3)
   */
  @Cron('0 7 * * *', {
    timeZone: 'America/Sao_Paulo',
  })
  async checkInstallmentsAndSendMessages() {
    const startTime = Date.now();
    this.logger.log('🚀 Iniciando verificação de parcelas para envio de mensagens automáticas...');

    // Verificar se a instância está conectada antes de processar
    const instanceStatus = await this.whatsappService.checkInstanceStatus();
    if (!instanceStatus.connected) {
      this.logger.error(`❌ Instância WhatsApp não está conectada. Status: ${instanceStatus.status}. Abortando envio automático.`);
      return;
    }

    this.logger.log(`✅ Instância WhatsApp conectada. Status: ${instanceStatus.status}`);

    try {
      // Buscar empresas que têm o envio automático ativado e permissão para usar
      const companies = await this.prisma.company.findMany({
        where: {
          autoMessageEnabled: true,
          autoMessageAllowed: true,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      this.logger.log(`📊 Encontradas ${companies.length} empresas com envio automático ativado e planos PRO ou TRIAL_7_DAYS`);

      let totalMessagesSent = 0;
      let totalMessagesFailed = 0;
      let totalCompaniesProcessed = 0;

      for (const company of companies) {
        const result = await this.processCompanyInstallments(company.id, company.name);
        totalMessagesSent += result.sent;
        totalMessagesFailed += result.failed;
        totalCompaniesProcessed++;
      }

      const duration = Date.now() - startTime;
      this.logger.log(`✅ Verificação de parcelas concluída com sucesso`);
      this.logger.log(`📈 Estatísticas: ${totalMessagesSent} mensagens enviadas, ${totalMessagesFailed} falhas, ${totalCompaniesProcessed} empresas processadas em ${duration}ms`);
    } catch (error) {
      this.logger.error('❌ Erro ao verificar parcelas:', error);
      this.logger.error(`Stack trace: ${error.stack}`);
    }
  }

  /**
   * Processa as parcelas de uma empresa específica
   */
  private async processCompanyInstallments(companyId: string, companyName: string): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    try {
      // Verificar rate limiting para esta empresa
      if (!this.canSendMessageForCompany(companyId)) {
        this.logger.warn(`⏸️ Rate limit atingido para empresa ${companyName} (${companyId}). Pulando processamento.`);
        return { sent: 0, failed: 0 };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar parcelas não pagas
      const installments = await this.prisma.installment.findMany({
        where: {
          companyId,
          isPaid: false,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      this.logger.log(`🏢 Empresa ${companyName}: ${installments.length} parcelas não pagas encontradas`);

      for (const installment of installments) {
        // Verificar se deve enviar mensagem
        if (await this.shouldSendMessage(installment, today)) {
          // Verificar rate limiting antes de enviar
          if (!this.canSendMessageForCompany(companyId)) {
            this.logger.warn(`⏸️ Rate limit atingido para empresa ${companyName}. Parando envio de mensagens.`);
            break;
          }

          const success = await this.sendPaymentMessage(installment, companyName);
          if (success) {
            sent++;
            this.incrementCompanyMessageCount(companyId);
          } else {
            failed++;
          }
        }
      }

      return { sent, failed };
    } catch (error) {
      this.logger.error(`❌ Erro ao processar parcelas da empresa ${companyId}:`, error);
      this.logger.error(`Stack trace: ${error.stack}`);
      return { sent, failed };
    }
  }

  /**
   * Verifica se pode enviar mensagem para a empresa (rate limiting)
   */
  private canSendMessageForCompany(companyId: string): boolean {
    const now = new Date();
    const companyData = this.companyMessageCounts.get(companyId);

    if (!companyData) {
      return true; // Primeira mensagem, permitir
    }

    // Se passou 1 hora, resetar contador
    if (now >= companyData.resetAt) {
      this.companyMessageCounts.delete(companyId);
      return true;
    }

    // Verificar se atingiu o limite
    return companyData.count < this.maxMessagesPerCompanyPerHour;
  }

  /**
   * Incrementa contador de mensagens da empresa
   */
  private incrementCompanyMessageCount(companyId: string): void {
    const now = new Date();
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora

    const companyData = this.companyMessageCounts.get(companyId);
    if (companyData) {
      companyData.count++;
    } else {
      this.companyMessageCounts.set(companyId, { count: 1, resetAt });
    }
  }

  /**
   * Verifica se deve enviar mensagem para a parcela
   */
  private async shouldSendMessage(installment: any, today: Date): Promise<boolean> {
    const dueDate = new Date(installment.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    // Caso 1: Hoje é o dia do vencimento e ainda não enviou mensagem hoje
    if (dueDate.getTime() === today.getTime()) {
      if (!installment.lastMessageSentAt) {
        return true;
      }
      
      const lastSent = new Date(installment.lastMessageSentAt);
      lastSent.setHours(0, 0, 0, 0);
      
      // Enviar se não enviou hoje
      return lastSent.getTime() !== today.getTime();
    }

    // Caso 2: Parcela está atrasada
    if (dueDate < today) {
      // Se nunca enviou mensagem, enviar
      if (!installment.lastMessageSentAt) {
        return true;
      }

      // Calcular quantos dias se passaram desde a última mensagem
      const lastSent = new Date(installment.lastMessageSentAt);
      lastSent.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - lastSent.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Enviar a cada 3 dias
      return diffDays >= 3;
    }

    return false;
  }

  /**
   * Envia a mensagem de cobrança
   */
  private async sendPaymentMessage(installment: any, companyName: string): Promise<boolean> {
    const startTime = Date.now();
    try {
      // Verificar se o cliente tem telefone
      if (!installment.customer.phone) {
        this.logger.warn(
          `⚠️ Cliente ${installment.customer.name} não possui telefone cadastrado. Parcela ID: ${installment.id}`
        );
        return false;
      }

      // Validar e formatar telefone
      const isValid = await this.whatsappService.validatePhoneNumber(installment.customer.phone);
      if (!isValid) {
        this.logger.warn(
          `⚠️ Telefone inválido para cliente ${installment.customer.name}: ${installment.customer.phone}. Parcela ID: ${installment.id}`
        );
        return false;
      }

      const formattedPhone = await this.whatsappService.formatPhoneNumber(installment.customer.phone);

      // Determinar o tipo de mensagem
      const dueDate = new Date(installment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let message: string;
      let messageType: 'due_today' | 'overdue';

      if (dueDate.getTime() === today.getTime()) {
        // Mensagem para vencimento hoje
        message = this.buildDueTodayMessage(companyName, installment);
        messageType = 'due_today';
      } else {
        // Mensagem para parcela atrasada
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        message = this.buildOverdueMessage(companyName, installment, daysOverdue);
        messageType = 'overdue';
      }

      // Enviar mensagem
      const success = await this.whatsappService.sendMessage({
        to: formattedPhone,
        message,
        type: 'text',
      });

      const duration = Date.now() - startTime;

      if (success) {
        // Atualizar registro da parcela
        await this.prisma.installment.update({
          where: { id: installment.id },
          data: {
            lastMessageSentAt: new Date(),
            messageCount: installment.messageCount + 1,
          },
        });

        this.logger.log(
          `✅ Mensagem enviada com sucesso | Cliente: ${installment.customer.name} | Telefone: ${formattedPhone} | Tipo: ${messageType} | Parcela: ${installment.installmentNumber}/${installment.totalInstallments} | Tempo: ${duration}ms | ID: ${installment.id}`
        );
        return true;
      } else {
        this.logger.error(
          `❌ Falha ao enviar mensagem | Cliente: ${installment.customer.name} | Telefone: ${formattedPhone} | Tipo: ${messageType} | Parcela ID: ${installment.id} | Tempo: ${duration}ms`
        );
        return false;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Erro ao enviar mensagem de cobrança | Parcela ID: ${installment.id} | Tempo: ${duration}ms`,
        error
      );
      this.logger.error(`Stack trace: ${error.stack}`);
      return false;
    }
  }

  /**
   * Constrói mensagem para vencimento hoje
   */
  private buildDueTodayMessage(companyName: string, installment: any): string {
    const amount = installment.remainingAmount.toNumber();
    const formattedAmount = amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return `
🔔 *LEMBRETE DE PAGAMENTO*

Olá, ${installment.customer.name}!

📅 *HOJE É O VENCIMENTO* da sua parcela ${installment.installmentNumber}/${installment.totalInstallments} na loja *${companyName}*.

💰 *Valor:* ${formattedAmount}

Por favor, dirija-se à loja para efetuar o pagamento e manter seu crédito em dia.

Agradecemos a sua preferência! 🙏
    `.trim();
  }

  /**
   * Constrói mensagem para parcela atrasada
   */
  private buildOverdueMessage(companyName: string, installment: any, daysOverdue: number): string {
    const amount = installment.remainingAmount.toNumber();
    const formattedAmount = amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const dueDate = new Date(installment.dueDate);
    const formattedDueDate = dueDate.toLocaleDateString('pt-BR');

    return `
⚠️ *PAGAMENTO EM ATRASO*

Olá, ${installment.customer.name}!

Sua parcela ${installment.installmentNumber}/${installment.totalInstallments} na loja *${companyName}* está *${daysOverdue} dia(s) atrasada*.

📅 *Vencimento:* ${formattedDueDate}
💰 *Valor:* ${formattedAmount}

Por favor, dirija-se à loja o quanto antes para regularizar sua situação e evitar transtornos.

Contamos com você! 🙏
    `.trim();
  }

  /**
   * Método manual para testar o envio de mensagens (pode ser chamado via endpoint)
   */
  async testMessageForInstallment(installmentId: string): Promise<any> {
    try {
      const installment = await this.prisma.installment.findUnique({
        where: { id: installmentId },
        include: {
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!installment) {
        return { success: false, message: 'Parcela não encontrada' };
      }

      if (installment.isPaid) {
        return { success: false, message: 'Parcela já está paga' };
      }

      await this.sendPaymentMessage(installment, installment.company.name);

      return { 
        success: true, 
        message: 'Mensagem de teste enviada com sucesso',
        phone: installment.customer.phone,
        customerName: installment.customer.name,
      };
    } catch (error) {
      this.logger.error('Erro ao enviar mensagem de teste:', error);
      return { success: false, message: 'Erro ao enviar mensagem', error: error.message };
    }
  }
}

