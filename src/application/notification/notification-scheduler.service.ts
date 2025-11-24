import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { NotificationService } from './notification.service';
import { ProductService } from '../product/product.service';
import { EmailService } from '../../shared/services/email.service';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly productService: ProductService,
    private readonly emailService: EmailService,
    private readonly reportsService: ReportsService,
  ) {}

  /**
   * Cron job que executa diariamente às 8h para verificar estoque baixo
   * Expressão cron: 0 8 * * * (minuto 0, hora 8, todos os dias)
   */
  @Cron('0 8 * * *', {
    timeZone: 'America/Sao_Paulo',
  })
  async checkLowStockProducts() {
    this.logger.log('🔍 Iniciando verificação de produtos com estoque baixo...');

    try {
      // Buscar todas as empresas ativas
      const companies = await this.prisma.company.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      let totalAlerts = 0;

      for (const company of companies) {
        try {
          // Verificar se a empresa tem alertas de estoque ativados
          const preferences = await this.notificationService.getPreferences(company.id, 'company');
          
          if (!preferences.stockAlerts) {
            this.logger.debug(`Alertas de estoque desabilitados para empresa ${company.name}`);
            continue;
          }

          // Buscar produtos com estoque baixo (threshold = 3)
          const lowStockProducts = await this.productService.getLowStockProducts(company.id, 3);

          if (lowStockProducts.length > 0) {
            // Criar notificação para cada produto com estoque baixo
            for (const product of lowStockProducts) {
              await this.notificationService.createStockAlert(
                company.id,
                product.name,
                product.stockQuantity,
              );
              totalAlerts++;
            }

            this.logger.log(
              `📦 ${lowStockProducts.length} produto(s) com estoque baixo encontrado(s) para ${company.name}`,
            );
          }
        } catch (error) {
          this.logger.error(`Erro ao processar empresa ${company.id}:`, error);
        }
      }

      this.logger.log(`✅ Verificação de estoque concluída. ${totalAlerts} alerta(s) criado(s)`);
    } catch (error) {
      this.logger.error('Erro ao verificar estoque baixo:', error);
    }
  }

  /**
   * Cron job que executa diariamente às 9h para verificar contas a vencer
   * Expressão cron: 0 9 * * * (minuto 0, hora 9, todos os dias)
   */
  @Cron('0 9 * * *', {
    timeZone: 'America/Sao_Paulo',
  })
  async checkBillsDueSoon() {
    this.logger.log('🔍 Iniciando verificação de contas a vencer...');

    try {
      // Buscar todas as empresas ativas
      const companies = await this.prisma.company.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      let totalReminders = 0;

      for (const company of companies) {
        try {
          // Verificar se a empresa tem lembretes de contas ativados
          const preferences = await this.notificationService.getPreferences(company.id, 'company');
          
          if (!preferences.billReminders) {
            this.logger.debug(`Lembretes de contas desabilitados para empresa ${company.name}`);
            continue;
          }

          // Buscar parcelas não pagas que vencem nos próximos 7 dias
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          sevenDaysFromNow.setHours(23, 59, 59, 999);

          const installments = await this.prisma.installment.findMany({
            where: {
              companyId: company.id,
              isPaid: false,
              dueDate: {
                gte: today,
                lte: sevenDaysFromNow,
              },
            },
            include: {
              sale: {
                select: {
                  clientName: true,
                },
              },
            },
            orderBy: {
              dueDate: 'asc',
            },
          });

          if (installments.length > 0) {
            // Criar notificação para cada parcela
            for (const installment of installments) {
              const billTitle = `Parcela - ${installment.sale.clientName || 'Cliente'}`;
              await this.notificationService.createBillReminder(
                company.id,
                billTitle,
                installment.dueDate,
                Number(installment.amount),
              );
              totalReminders++;
            }

            this.logger.log(
              `💰 ${installments.length} conta(s) a vencer encontrada(s) para ${company.name}`,
            );
          }
        } catch (error) {
          this.logger.error(`Erro ao processar empresa ${company.id}:`, error);
        }
      }

      this.logger.log(`✅ Verificação de contas concluída. ${totalReminders} lembrete(s) criado(s)`);
    } catch (error) {
      this.logger.error('Erro ao verificar contas a vencer:', error);
    }
  }

  /**
   * Cron job que executa toda segunda-feira às 8h para enviar relatórios semanais
   * Expressão cron: 0 8 * * 1 (minuto 0, hora 8, toda segunda-feira)
   */
  @Cron('0 8 * * 1', {
    timeZone: 'America/Sao_Paulo',
  })
  async sendWeeklyReports() {
    this.logger.log('📊 Iniciando envio de relatórios semanais...');

    try {
      // Buscar todas as empresas ativas
      const companies = await this.prisma.company.findMany({
        where: { isActive: true },
        select: { id: true, name: true, email: true },
      });

      let totalReports = 0;

      for (const company of companies) {
        try {
          // Verificar se a empresa tem relatórios semanais ativados
          const preferences = await this.notificationService.getPreferences(company.id, 'company');
          
          if (!preferences.weeklyReports) {
            this.logger.debug(`Relatórios semanais desabilitados para empresa ${company.name}`);
            continue;
          }

          if (!preferences.emailEnabled) {
            this.logger.debug(`Email desabilitado para empresa ${company.name}`);
            continue;
          }

          if (!company.email) {
            this.logger.warn(`Empresa ${company.name} não tem email cadastrado`);
            continue;
          }

          // Calcular período da semana passada (últimos 7 dias)
          const endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);

          // Buscar vendas da semana
          const sales = await this.prisma.sale.findMany({
            where: {
              companyId: company.id,
              saleDate: {
                gte: startDate,
                lte: endDate,
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

          const totalSales = sales.length;
          const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
          const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

          // Criar template de email
          const subject = `Relatório Semanal - ${company.name}`;
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Relatório Semanal</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px; }
                .content { padding: 20px; }
                .stats { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .stat-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
                .stat-item:last-child { border-bottom: none; }
                .stat-label { font-weight: bold; }
                .stat-value { color: #4CAF50; font-size: 18px; }
                .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📊 Relatório Semanal</h1>
                </div>
                <div class="content">
                  <p>Olá <strong>${company.name}</strong>,</p>
                  <p>Segue o resumo das suas vendas da última semana:</p>
                  
                  <div class="stats">
                    <div class="stat-item">
                      <span class="stat-label">Total de Vendas:</span>
                      <span class="stat-value">${totalSales}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Receita Total:</span>
                      <span class="stat-value">R$ ${totalRevenue.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Ticket Médio:</span>
                      <span class="stat-value">R$ ${averageTicket.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  <p>Período: ${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}</p>
                  
                  <p>Continue assim! 🚀</p>
                </div>
                <div class="footer">
                  <p>Este é um email automático, por favor não responda.</p>
                  <p>${company.name} - MONT Tecnologias</p>
                </div>
              </div>
            </body>
            </html>
          `;

          // Enviar email
          const emailSent = await this.emailService.sendEmail({
            to: company.email,
            subject,
            html,
          });

          if (emailSent) {
            totalReports++;
            this.logger.log(`📧 Relatório semanal enviado para ${company.name} (${company.email})`);
          } else {
            this.logger.warn(`Falha ao enviar relatório para ${company.name}`);
          }
        } catch (error) {
          this.logger.error(`Erro ao processar empresa ${company.id}:`, error);
        }
      }

      this.logger.log(`✅ Envio de relatórios concluído. ${totalReports} relatório(s) enviado(s)`);
    } catch (error) {
      this.logger.error('Erro ao enviar relatórios semanais:', error);
    }
  }
}

