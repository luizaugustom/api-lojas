import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PlanType } from '@prisma/client';

@Injectable()
export class TrialExpirationService {
  private readonly logger = new Logger(TrialExpirationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cron job que executa diariamente às 2h da manhã para desativar empresas com plano TRIAL_7_DAYS após 7 dias
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async deactivateExpiredTrials() {
    this.logger.log('Iniciando verificação de empresas com plano TRIAL_7_DAYS expiradas...');

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      // Buscar empresas com plano TRIAL_7_DAYS criadas há 7 dias ou mais e que ainda estão ativas
      const expiredCompanies = await this.prisma.company.findMany({
        where: {
          plan: PlanType.TRIAL_7_DAYS,
          isActive: true,
          createdAt: {
            lte: sevenDaysAgo,
          },
        },
        select: {
          id: true,
          name: true,
          login: true,
          createdAt: true,
        },
      });

      this.logger.log(`Encontradas ${expiredCompanies.length} empresas TRIAL_7_DAYS para desativar`);

      let deactivatedCount = 0;

      for (const company of expiredCompanies) {
        try {
          // Calcular quantos dias se passaram desde a criação
          const daysSinceCreation = Math.floor(
            (new Date().getTime() - company.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Desativar apenas se realmente passou 7 dias
          if (daysSinceCreation >= 7) {
            await this.prisma.company.update({
              where: { id: company.id },
              data: { isActive: false },
            });

            deactivatedCount++;
            this.logger.log(
              `Empresa ${company.name} (${company.login}) desativada após ${daysSinceCreation} dias de teste gratuito`
            );
          }
        } catch (error) {
          this.logger.error(`Erro ao desativar empresa ${company.id}:`, error);
        }
      }

      this.logger.log(
        `Verificação concluída. ${deactivatedCount} empresa(s) desativada(s) por expiração do período de teste`
      );
    } catch (error) {
      this.logger.error('Erro ao verificar empresas TRIAL_7_DAYS expiradas:', error);
    }
  }

  /**
   * Método manual para testar a desativação de empresas TRIAL expiradas
   */
  async testDeactivateExpiredTrials(): Promise<{ deactivated: number; companies: any[] }> {
    this.logger.log('Executando teste de desativação de empresas TRIAL expiradas...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const expiredCompanies = await this.prisma.company.findMany({
      where: {
        plan: PlanType.TRIAL_7_DAYS,
        isActive: true,
        createdAt: {
          lte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        name: true,
        login: true,
        createdAt: true,
      },
    });

    const deactivated: any[] = [];

    for (const company of expiredCompanies) {
      const daysSinceCreation = Math.floor(
        (new Date().getTime() - company.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation >= 7) {
        await this.prisma.company.update({
          where: { id: company.id },
          data: { isActive: false },
        });

        deactivated.push({
          ...company,
          daysSinceCreation,
        });
      }
    }

    return {
      deactivated: deactivated.length,
      companies: deactivated,
    };
  }
}

