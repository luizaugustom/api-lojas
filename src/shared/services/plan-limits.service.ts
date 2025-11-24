import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PlanType } from '@prisma/client';

export interface PlanLimits {
  maxProducts: number | null; // null = unlimited
  maxSellers: number | null; // null = unlimited
  maxBillsToPay: number | null;
  maxCustomers: number | null; // null = unlimited
  photoUploadEnabled: boolean;
  maxPhotosPerProduct: number | null; // null = unlimited
  nfceEmissionEnabled: boolean;
  nfeEmissionEnabled: boolean;
}

@Injectable()
export class PlanLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna os limites de um plano (método legado, mantido para compatibilidade)
   */
  getPlanLimits(plan: PlanType): PlanLimits {
    switch (plan) {
      case PlanType.PRO:
        return {
          maxProducts: null, // unlimited
          maxSellers: null,
          maxBillsToPay: null,
          maxCustomers: null,
          photoUploadEnabled: true,
          maxPhotosPerProduct: null,
          nfceEmissionEnabled: true,
          nfeEmissionEnabled: true,
        };
      case PlanType.TRIAL_7_DAYS:
        // Plano de teste tem os mesmos limites do PRO (ilimitado)
        return {
          maxProducts: null, // unlimited
          maxSellers: null,
          maxBillsToPay: null,
          maxCustomers: null,
          photoUploadEnabled: true,
          maxPhotosPerProduct: null,
          nfceEmissionEnabled: true,
          nfeEmissionEnabled: true,
        };
      default:
        // Default é PRO (ilimitado)
        return {
          maxProducts: null,
          maxSellers: null,
          maxBillsToPay: null,
          maxCustomers: null,
          photoUploadEnabled: true,
          maxPhotosPerProduct: null,
          nfceEmissionEnabled: true,
          nfeEmissionEnabled: true,
        };
    }
  }

  /**
   * Obtém os limites personalizados da empresa (padrão é tudo ilimitado)
   */
  async getCompanyLimits(companyId: string): Promise<PlanLimits> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        maxProducts: true,
        maxCustomers: true,
        maxSellers: true,
        photoUploadEnabled: true,
        maxPhotosPerProduct: true,
        nfceEmissionEnabled: true,
        nfeEmissionEnabled: true,
        plan: true,
      },
    });

    if (!company) {
      throw new BadRequestException('Empresa não encontrada');
    }

    // Retornar limites personalizados da empresa (null = ilimitado por padrão)
    return {
      maxProducts: company.maxProducts ?? null, // null = ilimitado
      maxSellers: company.maxSellers ?? null, // null = ilimitado
      maxBillsToPay: null, // Mantido para compatibilidade, mas não usado mais
      maxCustomers: company.maxCustomers ?? null, // null = ilimitado
      photoUploadEnabled: company.photoUploadEnabled ?? true,
      maxPhotosPerProduct: company.maxPhotosPerProduct ?? null, // null = ilimitado
      nfceEmissionEnabled: company.nfceEmissionEnabled ?? true,
      nfeEmissionEnabled: company.nfeEmissionEnabled ?? true,
    };
  }

  /**
   * Valida se a empresa pode adicionar mais produtos
   */
  async validateProductLimit(companyId: string): Promise<void> {
    const limits = await this.getCompanyLimits(companyId);

    // Se for ilimitado, não precisa validar
    if (limits.maxProducts === null) {
      return;
    }

    const currentCount = await this.prisma.product.count({
      where: { companyId },
    });

    if (currentCount >= limits.maxProducts) {
      throw new BadRequestException(
        `Limite de produtos atingido. Você pode cadastrar no máximo ${limits.maxProducts} produtos. Entre em contato com o administrador para ajustar o limite.`,
      );
    }
  }

  /**
   * Valida se a empresa pode adicionar mais vendedores
   */
  async validateSellerLimit(companyId: string): Promise<void> {
    const limits = await this.getCompanyLimits(companyId);

    // Se for ilimitado, não precisa validar
    if (limits.maxSellers === null) {
      return;
    }

    const currentCount = await this.prisma.seller.count({
      where: { companyId },
    });

    if (currentCount >= limits.maxSellers) {
      throw new BadRequestException(
        `Limite de vendedores atingido. Você pode cadastrar no máximo ${limits.maxSellers} vendedor(es). Entre em contato com o administrador para ajustar o limite.`,
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

    const limits = await this.getCompanyLimits(companyId);

    const [productsCount, sellersCount, billsToPayCount, customersCount] = await Promise.all([
      this.prisma.product.count({ where: { companyId } }),
      this.prisma.seller.count({ where: { companyId } }),
      this.prisma.billToPay.count({ 
        where: { 
          companyId,
          isPaid: false,
        } 
      }),
      this.prisma.customer.count({ where: { companyId } }),
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
        customers: {
          current: customersCount,
          max: limits.maxCustomers,
          percentage: limits.maxCustomers 
            ? Math.round((customersCount / limits.maxCustomers) * 100) 
            : 0,
          available: limits.maxCustomers 
            ? limits.maxCustomers - customersCount 
            : null,
        },
      },
    };
  }

  /**
   * Valida se a empresa pode adicionar mais clientes
   */
  async validateCustomerLimit(companyId: string): Promise<void> {
    const limits = await this.getCompanyLimits(companyId);

    // Se for ilimitado, não precisa validar
    if (limits.maxCustomers === null) {
      return;
    }

    const currentCount = await this.prisma.customer.count({
      where: { companyId },
    });

    if (currentCount >= limits.maxCustomers) {
      throw new BadRequestException(
        `Limite de clientes atingido. Você pode cadastrar no máximo ${limits.maxCustomers} clientes. Entre em contato com o administrador para ajustar o limite.`,
      );
    }
  }

  /**
   * Valida se a empresa pode fazer upload de fotos
   */
  async validatePhotoUploadEnabled(companyId: string): Promise<void> {
    const limits = await this.getCompanyLimits(companyId);

    if (!limits.photoUploadEnabled) {
      throw new BadRequestException(
        'Upload de fotos está desabilitado para sua empresa. Entre em contato com o administrador para habilitar.',
      );
    }
  }

  /**
   * Valida se a empresa pode adicionar mais fotos ao produto
   */
  async validatePhotoLimitPerProduct(
    companyId: string,
    currentPhotosCount: number,
    newPhotosCount: number,
  ): Promise<void> {
    const limits = await this.getCompanyLimits(companyId);

    // Se for ilimitado, não precisa validar
    if (limits.maxPhotosPerProduct === null) {
      return;
    }

    const totalPhotos = currentPhotosCount + newPhotosCount;

    if (totalPhotos > limits.maxPhotosPerProduct) {
      throw new BadRequestException(
        `Limite de fotos por produto excedido. Você pode adicionar no máximo ${limits.maxPhotosPerProduct} foto(s) por produto. ` +
        `Atualmente: ${currentPhotosCount} foto(s), tentando adicionar: ${newPhotosCount}.`,
      );
    }
  }

  /**
   * Valida se a empresa pode emitir NFCe
   */
  async validateNfceEmissionEnabled(companyId: string): Promise<void> {
    const limits = await this.getCompanyLimits(companyId);

    if (!limits.nfceEmissionEnabled) {
      throw new BadRequestException(
        'Emissão de NFCe está desabilitada para sua empresa. Entre em contato com o administrador para habilitar.',
      );
    }
  }

  /**
   * Valida se a empresa pode emitir NFe
   */
  async validateNfeEmissionEnabled(companyId: string): Promise<void> {
    const limits = await this.getCompanyLimits(companyId);

    if (!limits.nfeEmissionEnabled) {
      throw new BadRequestException(
        'Emissão de NFe está desabilitada para sua empresa. Entre em contato com o administrador para habilitar.',
      );
    }
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

    if (stats.usage.customers.percentage >= 80 && stats.limits.maxCustomers) {
      warnings.push(
        `Você está usando ${stats.usage.customers.percentage}% do seu limite de clientes (${stats.usage.customers.current}/${stats.usage.customers.max})`,
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

