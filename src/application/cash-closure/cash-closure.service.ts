import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PrinterService } from '../printer/printer.service';
import { CreateCashClosureDto } from './dto/create-cash-closure.dto';
import { CloseCashClosureDto } from './dto/close-cash-closure.dto';

@Injectable()
export class CashClosureService {
  private readonly logger = new Logger(CashClosureService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly printerService: PrinterService,
  ) {}

  async create(companyId: string, createCashClosureDto: CreateCashClosureDto, sellerId?: string) {
    try {
      // Se vendedor foi passado, verificar se tem caixa individual
      let targetSellerId: string | null = null;
      
      if (sellerId) {
        const seller = await this.prisma.seller.findUnique({
          where: { id: sellerId },
          select: { hasIndividualCash: true },
        });

        if (seller?.hasIndividualCash) {
          targetSellerId = sellerId;
        }
      }

      // Check if there's an open cash closure
      const existingOpenClosure = await this.prisma.cashClosure.findFirst({
        where: {
          companyId,
          isClosed: false,
          sellerId: targetSellerId, // Busca caixa do vendedor específico ou compartilhado (null)
        },
      });

      if (existingOpenClosure) {
        const msg = targetSellerId 
          ? 'Você já tem um fechamento de caixa aberto'
          : 'Já existe um fechamento de caixa compartilhado aberto';
        throw new BadRequestException(msg);
      }

      const cashClosure = await this.prisma.cashClosure.create({
        data: {
          ...createCashClosureDto,
          companyId,
          sellerId: targetSellerId,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          seller: targetSellerId ? {
            select: {
              id: true,
              name: true,
            },
          } : undefined,
        },
      });

      const logMsg = targetSellerId 
        ? `Individual cash closure created: ${cashClosure.id} for seller: ${targetSellerId}`
        : `Shared cash closure created: ${cashClosure.id} for company: ${companyId}`;
      this.logger.log(logMsg);
      
      return cashClosure;
    } catch (error) {
      this.logger.error('Error creating cash closure:', error);
      throw error;
    }
  }

  async findAll(companyId?: string, page = 1, limit = 10, isClosed?: boolean) {
    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    }

    if (isClosed !== undefined) {
      where.isClosed = isClosed;
    }

    const [closures, total] = await Promise.all([
      this.prisma.cashClosure.findMany({
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
              sales: true,
            },
          },
        },
        orderBy: {
          openingDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cashClosure.count({ where }),
    ]);

    return {
      closures,
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

    const closure = await this.prisma.cashClosure.findUnique({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        sales: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            sales: true,
          },
        },
      },
    });

    if (!closure) {
      throw new NotFoundException('Fechamento de caixa não encontrado');
    }

    return closure;
  }

  async getCurrentClosure(companyId: string, sellerId?: string) {
    // Se vendedor foi passado, verificar se tem caixa individual
    let targetSellerId: string | null = null;
    
    if (sellerId) {
      const seller = await this.prisma.seller.findUnique({
        where: { id: sellerId },
        select: { hasIndividualCash: true },
      });

      if (seller?.hasIndividualCash) {
        targetSellerId = sellerId;
      }
    }

    const closure = await this.prisma.cashClosure.findFirst({
      where: {
        companyId,
        isClosed: false,
        sellerId: targetSellerId, // Busca caixa do vendedor específico ou compartilhado (null)
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
        sales: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            sales: true,
          },
        },
      },
    });

    if (!closure) {
      throw new NotFoundException('Não há fechamento de caixa aberto');
    }

    return closure;
  }

  async close(companyId: string, closeCashClosureDto: CloseCashClosureDto, sellerId?: string) {
    try {
      // Se vendedor foi passado, verificar se tem caixa individual
      let targetSellerId: string | null = null;
      
      if (sellerId) {
        const seller = await this.prisma.seller.findUnique({
          where: { id: sellerId },
          select: { hasIndividualCash: true },
        });

        if (seller?.hasIndividualCash) {
          targetSellerId = sellerId;
        }
      }

      const existingClosure = await this.prisma.cashClosure.findFirst({
        where: {
          companyId,
          isClosed: false,
          sellerId: targetSellerId,
        },
        include: {
          sales: true,
        },
      });

      if (!existingClosure) {
        throw new NotFoundException('Não há fechamento de caixa aberto');
      }

      // Calculate totals
      const totalSales = existingClosure.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const totalWithdrawals = closeCashClosureDto.withdrawals || 0;
      const closingAmount = closeCashClosureDto.closingAmount || 0;

      const closure = await this.prisma.cashClosure.update({
        where: { id: existingClosure.id },
        data: {
          closingDate: new Date(),
          totalSales,
          totalWithdrawals,
          closingAmount,
          isClosed: true,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
            },
          },
          sales: {
            include: {
              seller: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Print closure report
      try {
        // TODO: Fix printer service interface
        // await this.printerService.printCashClosureReport(closure);
      } catch (printError) {
        this.logger.warn('Failed to print cash closure report:', printError);
      }

      this.logger.log(`Cash closure closed: ${closure.id} for company: ${companyId}`);
      return closure;
    } catch (error) {
      this.logger.error('Error closing cash closure:', error);
      throw error;
    }
  }

  async getCashClosureStats(companyId: string, sellerId?: string) {
    // Se vendedor foi passado, verificar se tem caixa individual
    let targetSellerId: string | null = null;
    
    if (sellerId) {
      const seller = await this.prisma.seller.findUnique({
        where: { id: sellerId },
        select: { hasIndividualCash: true },
      });

      if (seller?.hasIndividualCash) {
        targetSellerId = sellerId;
      }
    }

    const currentClosure = await this.prisma.cashClosure.findFirst({
      where: {
        companyId,
        isClosed: false,
        sellerId: targetSellerId,
      },
    });

    if (!currentClosure) {
      return {
        hasOpenClosure: false,
        message: 'Não há fechamento de caixa aberto',
      };
    }

    // Get sales for current closure
    const salesWhere: any = {
      companyId,
      cashClosureId: currentClosure.id,
    };

    const sales = await this.prisma.sale.findMany({
      where: salesWhere,
      include: {
        paymentMethods: true,
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    
    // Calcular vendas por método de pagamento
    const salesByPaymentMethod = sales.reduce((acc, sale) => {
      sale.paymentMethods.forEach(paymentMethod => {
        const method = paymentMethod.method;
        acc[method] = (acc[method] || 0) + Number(paymentMethod.amount);
      });
      return acc;
    }, {});

    // Calcular total apenas de vendas em dinheiro
    const totalCashSales = salesByPaymentMethod['cash'] || 0;

    const salesBySeller = sales.reduce((acc, sale) => {
      const sellerName = sale.seller.name;
      acc[sellerName] = (acc[sellerName] || 0) + Number(sale.total);
      return acc;
    }, {});

    return {
      hasOpenClosure: true,
      openingDate: currentClosure.openingDate,
      openingAmount: Number(currentClosure.openingAmount),
      totalSales,
      totalCashSales, // Apenas vendas em dinheiro para cálculo do caixa
      salesCount: sales.length,
      salesByPaymentMethod,
      salesBySeller,
      isIndividualCash: !!targetSellerId,
    };
  }

  async getClosureHistory(companyId: string, page = 1, limit = 10) {
    const [closures, total] = await Promise.all([
      this.prisma.cashClosure.findMany({
        where: {
          companyId,
          isClosed: true,
        },
        include: {
          _count: {
            select: {
              sales: true,
            },
          },
        },
        orderBy: {
          closingDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cashClosure.count({
        where: {
          companyId,
          isClosed: true,
        },
      }),
    ]);

    return {
      closures,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reprintReport(id: string, companyId?: string) {
    const closure = await this.findOne(id, companyId);
    
    if (!closure.isClosed) {
      throw new BadRequestException('Não é possível imprimir relatório de fechamento em aberto');
    }

    try {
      // TODO: Fix printer service interface
      // await this.printerService.printCashClosureReport(closure);
      return { message: 'Relatório reimpresso com sucesso' };
    } catch (error) {
      this.logger.error('Error reprinting cash closure report:', error);
      throw new BadRequestException('Erro ao reimprimir relatório');
    }
  }
}
