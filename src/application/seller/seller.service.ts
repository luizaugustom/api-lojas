import { Injectable, ConflictException, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { HashService } from '../../shared/services/hash.service';
import { CreateSellerDto } from './dto/create-seller.dto';
import { UpdateSellerDto } from './dto/update-seller.dto';
import { PlanLimitsService } from '../../shared/services/plan-limits.service';

@Injectable()
export class SellerService {
  private readonly logger = new Logger(SellerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async create(companyId: string, createSellerDto: CreateSellerDto) {
    try {
      // Validar limite de vendedores do plano
      await this.planLimitsService.validateSellerLimit(companyId);
      
      const hashedPassword = await this.hashService.hashPassword(createSellerDto.password);

      // Preparar dados para criação
      const data: any = {
        ...createSellerDto,
        password: hashedPassword,
        companyId,
      };

      // Se birthDate estiver vazio ou indefinido, remover do objeto
      if (!data.birthDate || data.birthDate === '') {
        delete data.birthDate;
      }

      const seller = await this.prisma.seller.create({
        data,
        select: {
          id: true,
          login: true,
          name: true,
          cpf: true,
          email: true,
          phone: true,
          commissionRate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Seller created: ${seller.id} for company: ${companyId}`);
      return seller;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Login já está em uso');
      }
      this.logger.error('Error creating seller:', error);
      throw error;
    }
  }

  async findAll(companyId?: string) {
    const where = companyId ? { companyId } : {};
    
    const sellers = await this.prisma.seller.findMany({
      where,
      select: {
        id: true,
        login: true,
        name: true,
        cpf: true,
        email: true,
        phone: true,
        commissionRate: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sales: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular valores do mês atual para cada vendedor
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Buscar vendas do mês para todos os vendedores de uma vez
    const sellersWithStats = await Promise.all(
      sellers.map(async (seller) => {
        // Vendas do mês atual
        const monthlySales = await this.prisma.sale.aggregate({
          where: {
            sellerId: seller.id,
            saleDate: {
              gte: startOfMonth,
            },
          },
          _sum: {
            total: true,
          },
          _count: {
            id: true,
          },
        });

        // Total geral
        const totalSales = await this.prisma.sale.aggregate({
          where: { sellerId: seller.id },
          _sum: {
            total: true,
          },
        });

        return {
          ...seller,
          monthlySalesValue: monthlySales._sum.total || 0,
          monthlySalesCount: monthlySales._count.id || 0,
          totalRevenue: totalSales._sum.total || 0,
        };
      })
    );

    return sellersWithStats;
  }

  async findOne(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const seller = await this.prisma.seller.findUnique({
      where,
      select: {
        id: true,
        login: true,
        name: true,
        cpf: true,
        birthDate: true,
        email: true,
        phone: true,
        commissionRate: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sales: true,
          },
        },
      },
    });

    if (!seller) {
      throw new NotFoundException('Vendedor não encontrado');
    }

    return seller;
  }

  async update(id: string, updateSellerDto: UpdateSellerDto, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingSeller = await this.prisma.seller.findUnique({
        where,
      });

      if (!existingSeller) {
        throw new NotFoundException('Vendedor não encontrado');
      }

      const updateData: any = { ...updateSellerDto };

      // Remove password field if empty or undefined
      if (!updateSellerDto.password || updateSellerDto.password.trim() === '') {
        delete updateData.password;
      } else {
        updateData.password = await this.hashService.hashPassword(updateSellerDto.password);
      }

      // Remove birthDate field if empty or undefined
      if (!updateData.birthDate || updateData.birthDate === '') {
        delete updateData.birthDate;
      }

      const seller = await this.prisma.seller.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          login: true,
          name: true,
          cpf: true,
          email: true,
          phone: true,
          commissionRate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Seller updated: ${seller.id}`);
      return seller;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Login já está em uso');
      }
      this.logger.error('Error updating seller:', error);
      throw error;
    }
  }

  async remove(id: string, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingSeller = await this.prisma.seller.findUnique({
        where,
      });

      if (!existingSeller) {
        throw new NotFoundException('Vendedor não encontrado');
      }

      await this.prisma.seller.delete({
        where: { id },
      });

      this.logger.log(`Seller deleted: ${id}`);
      return { message: 'Vendedor removido com sucesso' };
    } catch (error) {
      this.logger.error('Error deleting seller:', error);
      throw error;
    }
  }

  async getSellerStats(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const seller = await this.prisma.seller.findUnique({
      where,
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
      },
    });

    if (!seller) {
      throw new NotFoundException('Vendedor não encontrado');
    }

    const saleWhere: any = { sellerId: id };
    if (companyId) {
      saleWhere.companyId = companyId;
    }

    // Calculate total sales value
    const totalSalesAggregate = await this.prisma.sale.aggregate({
      where: saleWhere,
      _sum: {
        total: true,
      },
    });

    // Calculate sales this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlySales = await this.prisma.sale.aggregate({
      where: {
        ...saleWhere,
        saleDate: {
          gte: startOfMonth,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    // Sales trend for last 30 days
    const startOfPeriod = new Date();
    startOfPeriod.setDate(startOfPeriod.getDate() - 30);
    startOfPeriod.setHours(0, 0, 0, 0);

    const salesInPeriod = await this.prisma.sale.findMany({
      where: {
        ...saleWhere,
        saleDate: {
          gte: startOfPeriod,
        },
      },
      select: {
        saleDate: true,
        total: true,
      },
      orderBy: {
        saleDate: 'asc',
      },
    });

    const salesByDateMap = new Map<string, { total: number; revenue: number }>();
    for (const sale of salesInPeriod) {
      const dateKey = sale.saleDate.toISOString().split('T')[0];
      const entry = salesByDateMap.get(dateKey) ?? { total: 0, revenue: 0 };
      entry.total += 1;
      entry.revenue += Number(sale.total || 0);
      salesByDateMap.set(dateKey, entry);
    }

    const salesByPeriod = Array.from(salesByDateMap.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, data]) => ({
        date,
        total: data.total,
        revenue: Number(data.revenue),
      }));

    // Top products sold by the seller (last 30 days)
    const topProductsRaw = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          ...saleWhere,
          saleDate: {
            gte: startOfPeriod,
          },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const productIds = topProductsRaw.map((item) => item.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: {
            id: {
              in: productIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];
    const productNameMap = new Map(products.map((product) => [product.id, product.name]));

    const topProducts = topProductsRaw.map((item) => ({
      productId: item.productId,
      productName: productNameMap.get(item.productId) ?? 'Produto desconhecido',
      quantity: item._sum.quantity ?? 0,
      revenue: Number(item._sum.totalPrice ?? 0),
    }));

    const totalSalesCount = seller._count.sales;
    const totalRevenue = Number(totalSalesAggregate._sum.total || 0);
    const averageSaleValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    return {
      totalSales: totalSalesCount,
      totalRevenue: totalRevenue,
      averageSaleValue: averageSaleValue,
      monthlySales: monthlySales._count.id,
      monthlySalesValue: Number(monthlySales._sum.total || 0),
      salesByPeriod,
      topProducts,
    };
  }

  async getSellerSales(id: string, companyId?: string, page = 1, limit = 10) {
    const where: any = { sellerId: id };
    if (companyId) {
      where.companyId = companyId;
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  barcode: true,
                },
              },
            },
          },
        },
        orderBy: {
          saleDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
