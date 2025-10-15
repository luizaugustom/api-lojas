import { Injectable, ConflictException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, createProductDto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: {
          ...createProductDto,
          companyId,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`Product created: ${product.id} for company: ${companyId}`);
      return product;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Código de barras já está em uso');
      }
      this.logger.error('Error creating product:', error);
      throw error;
    }
  }

  async findAll(companyId?: string, page = 1, limit = 10, search?: string) {
    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const product = await this.prisma.product.findUnique({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            saleItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async findByBarcode(barcode: string, companyId?: string) {
    const where: any = { barcode };
    if (companyId) {
      where.companyId = companyId;
    }

    const product = await this.prisma.product.findFirst({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingProduct = await this.prisma.product.findUnique({
        where,
      });

      if (!existingProduct) {
        throw new NotFoundException('Produto não encontrado');
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`Product updated: ${product.id}`);
      return product;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Código de barras já está em uso');
      }
      this.logger.error('Error updating product:', error);
      throw error;
    }
  }

  async remove(id: string, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingProduct = await this.prisma.product.findUnique({
        where,
      });

      if (!existingProduct) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Check if product has sales
      const salesCount = await this.prisma.saleItem.count({
        where: { productId: id },
      });

      if (salesCount > 0) {
        throw new BadRequestException('Não é possível excluir produto que possui vendas');
      }

      await this.prisma.product.delete({
        where: { id },
      });

      this.logger.log(`Product deleted: ${id}`);
      return { message: 'Produto removido com sucesso' };
    } catch (error) {
      this.logger.error('Error deleting product:', error);
      throw error;
    }
  }

  async updateStock(id: string, updateStockDto: UpdateStockDto, companyId?: string) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const existingProduct = await this.prisma.product.findUnique({
      where,
    });

    if (!existingProduct) {
      throw new NotFoundException('Produto não encontrado');
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        stockQuantity: updateStockDto.stockQuantity,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    this.logger.log(`Product stock updated: ${product.id} to ${updateStockDto.stockQuantity}`);
    return product;
  }

  async getLowStockProducts(companyId?: string, threshold = 10) {
    const where: any = {
      stockQuantity: {
        lte: threshold,
      },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.product.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        stockQuantity: 'asc',
      },
    });
  }

  async getExpiringProducts(companyId?: string, days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const where: any = {
      expirationDate: {
        lte: futureDate,
        gte: new Date(),
      },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.product.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });
  }

  async getProductStats(companyId?: string) {
    const where = companyId ? { companyId } : {};

    const [totalProducts, lowStockCount, expiringCount, totalStockValue] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.count({
        where: {
          ...where,
          stockQuantity: { lte: 10 },
        },
      }),
      this.prisma.product.count({
        where: {
          ...where,
          expirationDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),
      this.prisma.product.aggregate({
        where,
        _sum: {
          stockQuantity: true,
        },
      }),
    ]);

    return {
      totalProducts,
      lowStockCount,
      expiringCount,
      totalStockQuantity: totalStockValue._sum.stockQuantity || 0,
    };
  }

  async getCategories(companyId?: string) {
    const where = companyId ? { companyId } : {};

    const categories = await this.prisma.product.findMany({
      where: {
        ...where,
        category: {
          not: null,
        },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return categories.map(item => item.category).filter(Boolean);
  }
}
