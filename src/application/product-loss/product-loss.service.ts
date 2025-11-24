import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateProductLossDto } from './dto/create-product-loss.dto';

@Injectable()
export class ProductLossService {
  private readonly logger = new Logger(ProductLossService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, createProductLossDto: CreateProductLossDto) {
    try {
      // Verificar se o produto existe e pertence à empresa
      const product = await this.prisma.product.findUnique({
        where: { id: createProductLossDto.productId },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      if (product.companyId !== companyId) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Verificar se há estoque suficiente
      if (product.stockQuantity < createProductLossDto.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente. Disponível: ${product.stockQuantity}, Solicitado: ${createProductLossDto.quantity}`,
        );
      }

      // Calcular custo unitário (usar costPrice se disponível, senão usar price)
      const unitCost = product.costPrice
        ? Number(product.costPrice)
        : Number(product.price);
      const totalCost = unitCost * createProductLossDto.quantity;

      // Verificar se o vendedor existe e pertence à empresa (se fornecido)
      if (createProductLossDto.sellerId) {
        const seller = await this.prisma.seller.findUnique({
          where: { id: createProductLossDto.sellerId },
        });

        if (!seller || seller.companyId !== companyId) {
          throw new NotFoundException('Vendedor não encontrado');
        }
      }

      // Criar a perda e atualizar o estoque em uma transação
      const result = await this.prisma.$transaction(async (tx) => {
        // Criar registro de perda
        const loss = await tx.productLoss.create({
          data: {
            companyId,
            productId: createProductLossDto.productId,
            quantity: createProductLossDto.quantity,
            unitCost,
            totalCost,
            reason: createProductLossDto.reason,
            notes: createProductLossDto.notes,
            sellerId: createProductLossDto.sellerId,
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
              },
            },
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Atualizar estoque do produto
        await tx.product.update({
          where: { id: createProductLossDto.productId },
          data: {
            stockQuantity: {
              decrement: createProductLossDto.quantity,
            },
          },
        });

        return loss;
      });

      this.logger.log(
        `Perda registrada: ${createProductLossDto.quantity} unidades do produto ${product.name} (${product.barcode})`,
      );

      return result;
    } catch (error) {
      this.logger.error('Erro ao registrar perda:', error);
      throw error;
    }
  }

  async findAll(companyId: string, startDate?: string, endDate?: string) {
    const where: any = { companyId };

    if (startDate || endDate) {
      where.lossDate = {};
      if (startDate) {
        where.lossDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.lossDate.lte = new Date(endDate);
      }
    }

    const losses = await this.prisma.productLoss.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        lossDate: 'desc',
      },
    });

    return losses;
  }

  async findOne(id: string, companyId: string) {
    const loss = await this.prisma.productLoss.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!loss) {
      throw new NotFoundException('Perda não encontrada');
    }

    if (loss.companyId !== companyId) {
      throw new NotFoundException('Perda não encontrada');
    }

    return loss;
  }

  async getLossSummary(companyId: string, startDate?: string, endDate?: string) {
    const where: any = { companyId };

    if (startDate || endDate) {
      where.lossDate = {};
      if (startDate) {
        where.lossDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.lossDate.lte = new Date(endDate);
      }
    }

    const [totalLosses, totalQuantity, totalCost, lossesByReason] = await Promise.all([
      this.prisma.productLoss.count({ where }),
      this.prisma.productLoss.aggregate({
        where,
        _sum: { quantity: true },
      }),
      this.prisma.productLoss.aggregate({
        where,
        _sum: { totalCost: true },
      }),
      this.prisma.productLoss.groupBy({
        by: ['reason'],
        where,
        _sum: {
          quantity: true,
          totalCost: true,
        },
        _count: true,
      }),
    ]);

    return {
      summary: {
        totalLosses,
        totalQuantity: totalQuantity._sum.quantity || 0,
        totalCost: Number(totalCost._sum.totalCost || 0),
      },
      byReason: lossesByReason.map((item) => ({
        reason: item.reason,
        count: item._count,
        quantity: item._sum.quantity || 0,
        totalCost: Number(item._sum.totalCost || 0),
      })),
    };
  }
}

