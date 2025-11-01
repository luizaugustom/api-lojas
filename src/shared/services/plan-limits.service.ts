import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PlanType } from '@prisma/client';

export interface PlanLimits {
  maxProducts: number | null; // null = unlimited
  maxSellers: number | null;
  maxBillsToPay: number | null;
}

@Injectable()
export class PlanLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna os limites de um plano
   */
  getPlanLimits(plan: PlanType): PlanLimits {
    switch (plan) {
      case PlanType.BASIC:
        return {
          maxProducts: 250,
          maxSellers: 1,
          maxBillsToPay: 5,
        };
      case PlanType.PLUS:
        return {
          maxProducts: 800,
          maxSellers: 2,
          maxBillsToPay: 15,
        };
      case PlanType.PRO:
        return {
          maxProducts: null, // unlimited
          maxSellers: null,
          maxBillsToPay: null,
        };
      case PlanType.TRIAL_7_DAYS:
        // Plano de teste tem os mesmos limites do PLUS
        return {
          maxProducts: 800,
          maxSellers: 2,
          maxBillsToPay: 15,
        };
      default:
        return {
          maxProducts: 250,
          maxSellers: 1,
          maxBillsToPay: 5,
        };
    }
  }

  /**
   * Valida se a empresa pode adicionar mais produtos
   */
  async validateProductLimit(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true },
    });

    if (!company) {
      throw new BadRequestException('Empresa não encontrada');
    }

    const limits = this.getPlanLimits(company.plan);

    // Se for ilimitado, não precisa validar
    if (limits.maxProducts === null) {
      return;
    }

    const currentCount = await this.prisma.product.count({
      where: { companyId },
    });

    if (currentCount >= limits.maxProducts) {
      throw new BadRequestException(
        `Limite de produtos atingido. Seu plano ${company.plan} permite no máximo ${limits.maxProducts} produtos. Faça upgrade para adicionar mais produtos.`,
      );
    }
  }

  /**
   * Valida se a empresa pode adicionar mais vendedores
   */
  async validateSellerLimit(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true },
    });

    if (!company) {
      throw new BadRequestException('Empresa não encontrada');
    }

    const limits = this.getPlanLimits(company.plan);

    // Se for ilimitado, não precisa validar
    if (limits.maxSellers === null) {
      return;
    }

    const currentCount = await this.prisma.seller.count({
      where: { companyId },
    });

    if (currentCount >= limits.maxSellers) {
      throw new BadRequestException(
        `Limite de vendedores atingido. Seu plano ${company.plan} permite no máximo ${limits.maxSellers} vendedor(es). Faça upgrade para adicionar mais vendedores.`,
      );
    }
  }

  /**
   * Valida se a empresa pode adicionar mais contas a pagar
   */
  async validateBillToPayLimit(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true },
    });

    if (!company) {
      throw new BadRequestException('Empresa não encontrada');
    }

    const limits = this.getPlanLimits(company.plan);

    // Se for ilimitado, não precisa validar
    if (limits.maxBillsToPay === null) {
      return;
    }

    // Conta apenas contas não pagas
    const currentCount = await this.prisma.billToPay.count({
      where: {
        companyId,
        isPaid: false,
      },
    });

    if (currentCount >= limits.maxBillsToPay) {
      throw new BadRequestException(
        `Limite de contas a pagar atingido. Seu plano ${company.plan} permite no máximo ${limits.maxBillsToPay} conta(s) a pagar pendente(s). Faça upgrade para adicionar mais contas ou pague as contas existentes.`,
      );
    }
  }

  /**
   * Obtém as estatísticas de uso dos limites de uma empresa
   */
  async getCompanyUsageStats(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true },
    });

    if (!company) {
      throw new BadRequestException('Empresa não encontrada');
    }

    const limits = this.getPlanLimits(company.plan);

    const [productsCount, sellersCount, billsToPayCount] = await Promise.all([
      this.prisma.product.count({ where: { companyId } }),
      this.prisma.seller.count({ where: { companyId } }),
      this.prisma.billToPay.count({ 
        where: { 
          companyId,
          isPaid: false,
        } 
      }),
    ]);

    return {
      plan: company.plan,
      limits,
      usage: {
        products: {
          current: productsCount,
          max: limits.maxProducts,
          percentage: limits.maxProducts 
            ? Math.round((productsCount / limits.maxProducts) * 100) 
            : 0,
          available: limits.maxProducts 
            ? limits.maxProducts - productsCount 
            : null,
        },
        sellers: {
          current: sellersCount,
          max: limits.maxSellers,
          percentage: limits.maxSellers 
            ? Math.round((sellersCount / limits.maxSellers) * 100) 
            : 0,
          available: limits.maxSellers 
            ? limits.maxSellers - sellersCount 
            : null,
        },
        billsToPay: {
          current: billsToPayCount,
          max: limits.maxBillsToPay,
          percentage: limits.maxBillsToPay 
            ? Math.round((billsToPayCount / limits.maxBillsToPay) * 100) 
            : 0,
          available: limits.maxBillsToPay 
            ? limits.maxBillsToPay - billsToPayCount 
            : null,
        },
      },
    };
  }

  /**
   * Verifica se a empresa está próxima dos limites (80% ou mais)
   */
  async checkNearLimits(companyId: string): Promise<{
    nearLimit: boolean;
    warnings: string[];
  }> {
    const stats = await this.getCompanyUsageStats(companyId);
    const warnings: string[] = [];
    let nearLimit = false;

    if (stats.usage.products.percentage >= 80 && stats.limits.maxProducts) {
      warnings.push(
        `Você está usando ${stats.usage.products.percentage}% do seu limite de produtos (${stats.usage.products.current}/${stats.usage.products.max})`,
      );
      nearLimit = true;
    }

    if (stats.usage.sellers.percentage >= 80 && stats.limits.maxSellers) {
      warnings.push(
        `Você está usando ${stats.usage.sellers.percentage}% do seu limite de vendedores (${stats.usage.sellers.current}/${stats.usage.sellers.max})`,
      );
      nearLimit = true;
    }

    if (stats.usage.billsToPay.percentage >= 80 && stats.limits.maxBillsToPay) {
      warnings.push(
        `Você está usando ${stats.usage.billsToPay.percentage}% do seu limite de contas a pagar (${stats.usage.billsToPay.current}/${stats.usage.billsToPay.max})`,
      );
      nearLimit = true;
    }

    return {
      nearLimit,
      warnings,
    };
  }
}

