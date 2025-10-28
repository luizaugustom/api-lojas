import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class InstallmentMessagingService {
  private readonly logger = new Logger(InstallmentMessagingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
  ) {}

  /**
   * Cron job que executa diariamente às 9h para verificar parcelas vencidas ou a vencer
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkInstallmentsAndSendMessages() {
    this.logger.log('Iniciando verificação de parcelas para envio de mensagens automáticas...');

    try {
      // Buscar empresas que têm o envio automático ativado
      const companies = await this.prisma.company.findMany({
        where: {
          autoMessageEnabled: true,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      this.logger.log(`Encontradas ${companies.length} empresas com envio automático ativado`);

      for (const company of companies) {
        await this.processCompanyInstallments(company.id, company.name);
      }

      this.logger.log('Verificação de parcelas concluída com sucesso');
    } catch (error) {
      this.logger.error('Erro ao verificar parcelas:', error);
    }
  }

  /**
   * Processa as parcelas de uma empresa específica
   */
  private async processCompanyInstallments(companyId: string, companyName: string) {
    try {
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

      this.logger.log(`Empresa ${companyName}: ${installments.length} parcelas não pagas encontradas`);

      for (const installment of installments) {
        // Verificar se deve enviar mensagem
        if (await this.shouldSendMessage(installment, today)) {
          await this.sendPaymentMessage(installment, companyName);
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao processar parcelas da empresa ${companyId}:`, error);
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
  private async sendPaymentMessage(installment: any, companyName: string) {
    try {
      // Verificar se o cliente tem telefone
      if (!installment.customer.phone) {
        this.logger.warn(
          `Cliente ${installment.customer.name} não possui telefone cadastrado. Parcela ID: ${installment.id}`
        );
        return;
      }

      // Validar e formatar telefone
      const isValid = await this.whatsappService.validatePhoneNumber(installment.customer.phone);
      if (!isValid) {
        this.logger.warn(
          `Telefone inválido para cliente ${installment.customer.name}: ${installment.customer.phone}`
        );
        return;
      }

      const formattedPhone = await this.whatsappService.formatPhoneNumber(installment.customer.phone);

      // Determinar o tipo de mensagem
      const dueDate = new Date(installment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let message: string;

      if (dueDate.getTime() === today.getTime()) {
        // Mensagem para vencimento hoje
        message = this.buildDueTodayMessage(companyName, installment);
      } else {
        // Mensagem para parcela atrasada
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        message = this.buildOverdueMessage(companyName, installment, daysOverdue);
      }

      // Enviar mensagem
      const success = await this.whatsappService.sendMessage({
        to: formattedPhone,
        message,
        type: 'text',
      });

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
          `Mensagem enviada com sucesso para ${installment.customer.name} (${formattedPhone}). Parcela ID: ${installment.id}`
        );
      } else {
        this.logger.error(
          `Falha ao enviar mensagem para ${installment.customer.name} (${formattedPhone}). Parcela ID: ${installment.id}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Erro ao enviar mensagem de cobrança. Parcela ID: ${installment.id}`,
        error
      );
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

