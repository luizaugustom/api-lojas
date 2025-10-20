import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCompanyMetrics(companyId: string) {
    try {
      this.logger.log(`Getting metrics for company: ${companyId}`);

      // Verificar se a empresa existe
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, isActive: true }
      });

      if (!company) {
        throw new NotFoundException('Empresa não encontrada');
      }

      if (!company.isActive) {
        throw new NotFoundException('Empresa inativa');
      }

      // Calcular métricas em paralelo para melhor performance
      const [
        // Contadores básicos
        totalProducts,
        totalCustomers,
        totalSellers,
        totalSales,
        totalBillsToPay,
        
        // Valores financeiros
        totalSalesValue,
        pendingBillsValue,
        paidBillsValue,
        
        // Métricas de vendas
        salesThisMonth,
        salesValueThisMonth,
        salesLastMonth,
        salesValueLastMonth,
        
        // Métricas de produtos
        lowStockProducts,
        expiringProducts,
        totalStockValue,
        
        // Métricas de caixa
        currentCashClosure,
        closedCashClosures,
        
        // Métricas fiscais
        totalFiscalDocuments,
        fiscalDocumentsThisMonth,
        
        // Métricas de vendedores
        topSellers,
        
        // Métricas de produtos mais vendidos
        topProducts
      ] = await Promise.all([
        // Contadores básicos
        this.prisma.product.count({ where: { companyId } }),
        this.prisma.customer.count({ where: { companyId } }),
        this.prisma.seller.count({ where: { companyId } }),
        this.prisma.sale.count({ where: { companyId } }),
        this.prisma.billToPay.count({ where: { companyId } }),
        
        // Valores financeiros
        this.prisma.sale.aggregate({
          where: { companyId },
          _sum: { total: true }
        }),
        this.prisma.billToPay.aggregate({
          where: { companyId, isPaid: false },
          _sum: { amount: true }
        }),
        this.prisma.billToPay.aggregate({
          where: { companyId, isPaid: true },
          _sum: { amount: true }
        }),
        
        // Métricas de vendas - este mês
        this.getSalesThisMonth(companyId),
        this.getSalesValueThisMonth(companyId),
        
        // Métricas de vendas - mês passado
        this.getSalesLastMonth(companyId),
        this.getSalesValueLastMonth(companyId),
        
        // Métricas de produtos
        this.prisma.product.count({
          where: { companyId, stockQuantity: { lte: 10 } }
        }),
        this.prisma.product.count({
          where: {
            companyId,
            expirationDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
              gte: new Date()
            }
          }
        }),
        this.prisma.product.aggregate({
          where: { companyId },
          _sum: { 
            stockQuantity: true,
            price: true 
          }
        }),
        
        // Métricas de caixa
        this.prisma.cashClosure.findFirst({
          where: { companyId, isClosed: false },
          orderBy: { openingDate: 'desc' }
        }),
        this.prisma.cashClosure.count({
          where: { companyId, isClosed: true }
        }),
        
        // Métricas fiscais
        this.prisma.fiscalDocument.count({ where: { companyId } }),
        this.getFiscalDocumentsThisMonth(companyId),
        
        // Top vendedores
        this.getTopSellers(companyId),
        
        // Top produtos
        this.getTopProducts(companyId)
      ]);

      // Calcular variações percentuais
      const salesGrowth = this.calculateGrowthPercentage(
        salesValueThisMonth,
        salesValueLastMonth
      );

      const salesCountGrowth = this.calculateGrowthPercentage(
        salesThisMonth,
        salesLastMonth
      );

      // Calcular ticket médio
      const averageTicket = totalSales > 0 ? 
        Number(totalSalesValue._sum.total || 0) / totalSales : 0;

      // Calcular ticket médio do mês
      const averageTicketThisMonth = salesThisMonth > 0 ? 
        salesValueThisMonth / salesThisMonth : 0;

      // Calcular valor total do estoque
      const stockValue = Number(totalStockValue._sum.price || 0) * 
        Number(totalStockValue._sum.stockQuantity || 0);

      return {
        company: {
          id: company.id,
          name: company.name,
          isActive: company.isActive
        },
        
        // Contadores básicos
        counts: {
          products: totalProducts,
          customers: totalCustomers,
          sellers: totalSellers,
          sales: totalSales,
          billsToPay: totalBillsToPay,
          fiscalDocuments: totalFiscalDocuments,
          closedCashClosures: closedCashClosures
        },
        
        // Valores financeiros
        financial: {
          totalSalesValue: Number(totalSalesValue._sum.total || 0),
          pendingBillsValue: Number(pendingBillsValue._sum.amount || 0),
          paidBillsValue: Number(paidBillsValue._sum.amount || 0),
          stockValue: stockValue,
          netRevenue: Number(totalSalesValue._sum.total || 0) - Number(paidBillsValue._sum.amount || 0)
        },
        
        // Métricas de vendas
        sales: {
          thisMonth: {
            count: salesThisMonth,
            value: salesValueThisMonth,
            averageTicket: averageTicketThisMonth
          },
          lastMonth: {
            count: salesLastMonth,
            value: salesValueLastMonth
          },
          total: {
            count: totalSales,
            value: Number(totalSalesValue._sum.total || 0),
            averageTicket: averageTicket
          },
          growth: {
            countPercentage: salesCountGrowth,
            valuePercentage: salesGrowth
          }
        },
        
        // Métricas de produtos
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
          expiring: expiringProducts,
          stockValue: stockValue,
          lowStockPercentage: totalProducts > 0 ? (lowStockProducts / totalProducts) * 100 : 0,
          expiringPercentage: totalProducts > 0 ? (expiringProducts / totalProducts) * 100 : 0
        },
        
        // Métricas de caixa
        cash: {
          currentClosure: currentCashClosure ? {
            id: currentCashClosure.id,
            openingDate: currentCashClosure.openingDate,
            openingAmount: Number(currentCashClosure.openingAmount),
            totalSales: Number(currentCashClosure.totalSales),
            isClosed: currentCashClosure.isClosed
          } : null,
          closedClosures: closedCashClosures
        },
        
        // Métricas fiscais
        fiscal: {
          totalDocuments: totalFiscalDocuments,
          documentsThisMonth: fiscalDocumentsThisMonth,
          documentsGrowth: this.calculateGrowthPercentage(
            fiscalDocumentsThisMonth,
            totalFiscalDocuments - fiscalDocumentsThisMonth
          )
        },
        
        // Rankings
        rankings: {
          topSellers: topSellers,
          topProducts: topProducts
        },
        
        // Metadados
        metadata: {
          generatedAt: new Date().toISOString(),
          period: {
            thisMonth: this.getMonthPeriod(),
            lastMonth: this.getLastMonthPeriod()
          }
        }
      };
    } catch (error) {
      this.logger.error('Error getting company metrics:', error);
      throw error;
    }
  }

  private async getSalesThisMonth(companyId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    return this.prisma.sale.count({
      where: {
        companyId,
        saleDate: { gte: startOfMonth }
      }
    });
  }

  private async getSalesValueThisMonth(companyId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const result = await this.prisma.sale.aggregate({
      where: {
        companyId,
        saleDate: { gte: startOfMonth }
      },
      _sum: { total: true }
    });
    
    return Number(result._sum.total || 0);
  }

  private async getSalesLastMonth(companyId: string): Promise<number> {
    const startOfLastMonth = new Date();
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    startOfLastMonth.setDate(1);
    startOfLastMonth.setHours(0, 0, 0, 0);
    
    const endOfLastMonth = new Date();
    endOfLastMonth.setDate(0); // Último dia do mês passado
    endOfLastMonth.setHours(23, 59, 59, 999);
    
    return this.prisma.sale.count({
      where: {
        companyId,
        saleDate: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    });
  }

  private async getSalesValueLastMonth(companyId: string): Promise<number> {
    const startOfLastMonth = new Date();
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    startOfLastMonth.setDate(1);
    startOfLastMonth.setHours(0, 0, 0, 0);
    
    const endOfLastMonth = new Date();
    endOfLastMonth.setDate(0); // Último dia do mês passado
    endOfLastMonth.setHours(23, 59, 59, 999);
    
    const result = await this.prisma.sale.aggregate({
      where: {
        companyId,
        saleDate: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      },
      _sum: { total: true }
    });
    
    return Number(result._sum.total || 0);
  }

  private async getFiscalDocumentsThisMonth(companyId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    return this.prisma.fiscalDocument.count({
      where: {
        companyId,
        emissionDate: { gte: startOfMonth }
      }
    });
  }

  private async getTopSellers(companyId: string, limit = 5) {
    const sellers = await this.prisma.seller.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { sales: true }
        },
        sales: {
          select: {
            total: true
          }
        }
      }
    });

    return sellers
      .map(seller => ({
        id: seller.id,
        name: seller.name,
        salesCount: seller._count.sales,
        totalValue: seller.sales.reduce((sum, sale) => sum + Number(sale.total), 0)
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit);
  }

  private async getTopProducts(companyId: string, limit = 5) {
    const products = await this.prisma.product.findMany({
      where: { companyId },
      include: {
        saleItems: {
          select: {
            quantity: true,
            totalPrice: true
          }
        }
      }
    });

    return products
      .map(product => ({
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        salesCount: product.saleItems.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: product.saleItems.reduce((sum, item) => sum + Number(item.totalPrice), 0),
        stockQuantity: product.stockQuantity
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit);
  }

  private calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }

  private getMonthPeriod() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start: startOfMonth.toISOString(),
      end: endOfMonth.toISOString(),
      label: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    };
  }

  private getLastMonthPeriod() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return {
      start: lastMonth.toISOString(),
      end: endOfLastMonth.toISOString(),
      label: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
    };
  }
}
