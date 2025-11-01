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

    // Calculate total sales value
    const totalSalesAggregate = await this.prisma.sale.aggregate({
      where: { sellerId: id },
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
        sellerId: id,
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

    const totalSalesCount = seller._count.sales;
    const totalRevenue = Number(totalSalesAggregate._sum.total || 0);
    const averageSaleValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

    return {
      totalSales: totalSalesCount,
      totalRevenue: totalRevenue,
      averageSaleValue: averageSaleValue,
      monthlySales: monthlySales._count.id,
      monthlySalesValue: Number(monthlySales._sum.total || 0),
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
