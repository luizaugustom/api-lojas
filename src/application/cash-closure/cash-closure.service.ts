import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PrinterService, CashClosureReportData, PrintResult } from '../printer/printer.service';
import { CreateCashClosureDto } from './dto/create-cash-closure.dto';
import { CloseCashClosureDto } from './dto/close-cash-closure.dto';

const CASH_CLOSURE_REPORT_INCLUDE = {
  company: {
    select: {
      id: true,
      name: true,
      cnpj: true,
      street: true,
      number: true,
      district: true,
      city: true,
      state: true,
      zipCode: true,
    },
  },
  seller: {
    select: {
      id: true,
      name: true,
    },
  },
  sales: {
    orderBy: {
      saleDate: 'asc' as const,
    },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
        },
      },
      paymentMethods: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
  },
} as const;

type CashClosureWithDetails = Prisma.CashClosureGetPayload<{
  include: typeof CASH_CLOSURE_REPORT_INCLUDE;
}>;

type SaleWithDetails = Prisma.SaleGetPayload<{
  include: {
    seller: {
      select: {
        id: true;
        name: true;
      };
    };
    paymentMethods: true;
  };
}>;

interface BuildReportOptions {
  includeSaleDetails?: boolean;
}


@Injectable()
export class CashClosureService {
  private readonly logger = new Logger(CashClosureService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly printerService: PrinterService,
  ) {}

  private parseClientDate(value?: string): Date | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      this.logger.warn(`Data inválida recebida do cliente: ${value}`);
      return undefined;
    }

    return parsed;
  }

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

      const openingDate = this.parseClientDate(createCashClosureDto.openingDate);
      const openingAmount = Number(createCashClosureDto.openingAmount ?? 0);

      const cashClosure = await this.prisma.cashClosure.create({
        data: {
          openingAmount,
          ...(openingDate ? { openingDate } : {}),
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

  async close(
    companyId: string,
    closeCashClosureDto: CloseCashClosureDto,
    sellerId?: string,
    computerId?: string | null,
  ) {
    try {
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
        include: CASH_CLOSURE_REPORT_INCLUDE,
      });

      if (!existingClosure) {
        throw new NotFoundException('Não há fechamento de caixa aberto');
      }

      const existingClosureDetailed = existingClosure as CashClosureWithDetails;
      const closureSales = await this.fetchSalesForClosure(existingClosureDetailed);

      const totalSales = closureSales.reduce((sum, sale) => sum + Number(sale.total), 0);
      const totalWithdrawals = Number(closeCashClosureDto.withdrawals ?? 0);
      const closingAmount = Number(closeCashClosureDto.closingAmount ?? 0);
      const shouldPrint = closeCashClosureDto.printReport ?? false;
      const closingDate = this.parseClientDate(closeCashClosureDto.closingDate) ?? new Date();
      const includeSaleDetails = closeCashClosureDto.includeSaleDetails ?? false;

      const updatedClosure = await this.prisma.cashClosure.update({
        where: { id: existingClosure.id },
        data: {
          closingDate,
          totalSales,
          totalWithdrawals,
          closingAmount,
          isClosed: true,
        },
        include: CASH_CLOSURE_REPORT_INCLUDE,
      }) as CashClosureWithDetails;

      const reportData = await this.buildCashClosureReportData(updatedClosure, { includeSaleDetails });
      const reportContent = this.printerService.generateCashClosureReportContent(reportData);
      let printResult: PrintResult | null = null;

      if (shouldPrint) {
        try {
          printResult = await this.printerService.printCashClosureReport(
            reportData,
            companyId,
            computerId,
            reportContent,
          );

          if (!printResult.success) {
            this.logger.warn(`Falha ao imprimir relatório de fechamento ${updatedClosure.id}: ${printResult.error}`);
          }
        } catch (printError) {
          this.logger.warn(`Erro ao tentar imprimir relatório de fechamento ${updatedClosure.id}:`, printError);
          printResult = {
            success: false,
            error: printError instanceof Error ? printError.message : String(printError),
          };
        }
      }

      const summary = this.buildClosureSummary(updatedClosure, reportData);

      const diff = reportData.closure.difference;
      const diffLabel = Math.abs(diff) < 0.01 ? 'sem diferença' : diff > 0 ? 'sobra' : 'falta';
      this.logger.log(
        `Fechamento ${updatedClosure.id} concluído para empresa ${companyId} (${diffLabel}: ${diff.toFixed(2)})`,
      );

      return {
        ...summary,
        closure: summary,
        reportData,
        reportContent,
        printRequested: shouldPrint,
        printResult,
      };
    } catch (error) {
      this.logger.error('Erro ao fechar caixa:', error);
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

    let sales = await this.prisma.sale.findMany({
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

    if (sales.length === 0) {
      sales = await this.prisma.sale.findMany({
        where: {
          companyId,
          ...(targetSellerId ? { sellerId: targetSellerId } : {}),
          saleDate: {
            gte: currentClosure.openingDate,
          },
        },
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
    }

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
    const [closuresRaw, total] = await Promise.all([
      this.prisma.cashClosure.findMany({
        where: {
          companyId,
          isClosed: true,
        },
        include: CASH_CLOSURE_REPORT_INCLUDE,
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

    const closures = await Promise.all(
      closuresRaw.map(async (closure) => {
        const detailedClosure = closure as CashClosureWithDetails;
        const reportData = await this.buildCashClosureReportData(detailedClosure, { includeSaleDetails: false });
        const summary = this.buildClosureSummary(detailedClosure, reportData);

        return {
          ...summary,
          reportData,
        };
      }),
    );

    return {
      closures,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reprintReport(
    id: string,
    companyId?: string,
    computerId?: string | null,
    includeSaleDetails: boolean = false,
  ) {
    try {
      const closure = await this.loadClosureWithDetails(id, companyId);

      if (!closure.isClosed) {
        throw new BadRequestException('Não é possível imprimir relatório de fechamento em aberto');
      }

      const reportData = await this.buildCashClosureReportData(closure, { includeSaleDetails });
      const reportContent = this.printerService.generateCashClosureReportContent(reportData);
      const printResult = await this.printerService.printCashClosureReport(
        reportData,
        closure.companyId,
        computerId,
        reportContent,
      );

      if (!printResult.success) {
        this.logger.warn(`Falha ao reimprimir relatório do fechamento ${closure.id}: ${printResult.error}`);
      }

      const summary = this.buildClosureSummary(closure, reportData);

      return {
        closureId: closure.id,
        ...summary,
        closure: summary,
        reportData,
        reportContent,
        printResult,
      };
    } catch (error) {
      this.logger.error(`Erro ao reimprimir relatório do fechamento ${id}:`, error);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erro ao reimprimir relatório');
    }
  }

  async getReportContent(id: string, companyId?: string, includeSaleDetails: boolean = false) {
    const closure = await this.loadClosureWithDetails(id, companyId);

    if (!closure.isClosed) {
      throw new BadRequestException('O relatório completo só fica disponível após o fechamento do caixa');
    }

    const reportData = await this.buildCashClosureReportData(closure, { includeSaleDetails });
    const reportContent = this.printerService.generateCashClosureReportContent(reportData);
    const summary = this.buildClosureSummary(closure, reportData);

    return {
      closureId: closure.id,
      ...summary,
      closure: summary,
      reportData,
      reportContent,
    };
  }

  private async loadClosureWithDetails(id: string, companyId?: string): Promise<CashClosureWithDetails> {
    const closure = await this.prisma.cashClosure.findFirst({
      where: {
        id,
        ...(companyId ? { companyId } : {}),
      },
      include: CASH_CLOSURE_REPORT_INCLUDE,
    });

    if (!closure) {
      throw new NotFoundException('Fechamento de caixa não encontrado');
    }

    return closure as CashClosureWithDetails;
  }

  private async fetchSalesForClosure(closure: CashClosureWithDetails): Promise<SaleWithDetails[]> {
    const baseInclude = {
      seller: {
        select: {
          id: true,
          name: true,
        },
      },
      paymentMethods: true,
    } as const;

    const relationSales = await this.prisma.sale.findMany({
      where: {
        companyId: closure.companyId,
        cashClosureId: closure.id,
        ...(closure.sellerId ? { sellerId: closure.sellerId } : {}),
      },
      include: baseInclude,
      orderBy: {
        saleDate: 'asc',
      },
    });

    if (relationSales.length > 0) {
      return relationSales;
    }

    const periodEnd = closure.closingDate ?? new Date();

    return this.prisma.sale.findMany({
      where: {
        companyId: closure.companyId,
        ...(closure.sellerId ? { sellerId: closure.sellerId } : {}),
        saleDate: {
          gte: closure.openingDate,
          lte: periodEnd,
        },
      },
      include: baseInclude,
      orderBy: {
        saleDate: 'asc',
      },
    });
  }

  private buildCompanyAddress(company: CashClosureWithDetails['company']): string | undefined {
    const street = [company.street, company.number].filter(Boolean).join(', ');
    const district = company.district;
    const cityState = company.city && company.state ? `${company.city}/${company.state}` : company.city || company.state;
    const zip = company.zipCode ? `CEP: ${company.zipCode}` : undefined;

    const parts = [street, district, cityState, zip].filter((part) => part && part.trim().length > 0) as string[];

    if (!parts.length) {
      return undefined;
    }

    return parts.join(' - ');
  }

  private async buildCashClosureReportData(
    closure: CashClosureWithDetails,
    options: BuildReportOptions = {},
  ): Promise<CashClosureReportData> {
    const includeSaleDetails = options.includeSaleDetails ?? true;
    const sales = await this.fetchSalesForClosure(closure);

    const totalChange = sales.reduce((sum, sale) => sum + Number(sale.change || 0), 0);
    const paymentSummaryMap = new Map<string, number>();
    const sellersMap = new Map<string, {
      id: string;
      name: string;
      totalSales: number;
      totalChange: number;
      sales: Array<{
        id: string;
        date: Date;
        total: number;
        change: number;
        clientName?: string | null;
        paymentMethods: Array<{ method: string; amount: number }>;
      }>;
    }>();

    sales.forEach((sale) => {
      sale.paymentMethods.forEach((payment) => {
        const currentTotal = paymentSummaryMap.get(payment.method) || 0;
        paymentSummaryMap.set(payment.method, currentTotal + Number(payment.amount));
      });

      const sellerId = sale.seller?.id || 'sem-vendedor';
      const sellerName = sale.seller?.name || 'Sem Vendedor';

      if (!sellersMap.has(sellerId)) {
        sellersMap.set(sellerId, {
          id: sellerId,
          name: sellerName,
          totalSales: 0,
          totalChange: 0,
          sales: [],
        });
      }

      const sellerData = sellersMap.get(sellerId)!;

      sellerData.totalSales += Number(sale.total);
      sellerData.totalChange += Number(sale.change || 0);
      sellerData.sales.push({
        id: sale.id,
        date: sale.saleDate,
        total: Number(sale.total),
        change: Number(sale.change || 0),
        clientName: sale.clientName,
        paymentMethods: sale.paymentMethods.map((payment) => ({
          method: payment.method,
          amount: Number(payment.amount),
        })),
      });
    });

    const paymentSummary = Array.from(paymentSummaryMap.entries())
      .map(([method, total]) => ({ method, total }))
      .sort((a, b) => b.total - a.total);

    const sellers = Array.from(sellersMap.values()).map((seller) => ({
      ...seller,
      sales: (includeSaleDetails
        ? seller.sales.sort((a, b) => a.date.getTime() - b.date.getTime())
        : []),
    })).sort((a, b) => b.totalSales - a.totalSales);

    const totalCashSales = paymentSummary.find((entry) => entry.method === 'cash')?.total || 0;
    const openingAmount = Number(closure.openingAmount || 0);
    const closingAmount = Number(closure.closingAmount || 0);
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalWithdrawals = Number(closure.totalWithdrawals || 0);
    const expectedClosing = openingAmount + totalCashSales - totalWithdrawals;
    const difference = closingAmount - expectedClosing;

    return {
      company: {
        name: closure.company.name,
        cnpj: closure.company.cnpj,
        address: this.buildCompanyAddress(closure.company),
      },
      closure: {
        id: closure.id,
        openingDate: closure.openingDate,
        closingDate: closure.closingDate ?? new Date(),
        openingAmount,
        closingAmount,
        totalSales,
        totalWithdrawals,
        totalChange,
        totalCashSales,
        expectedClosing,
        difference,
        salesCount: sales.length,
        seller: closure.seller ? { id: closure.seller.id, name: closure.seller.name } : null,
      },
      paymentSummary,
      sellers,
      includeSaleDetails,
    };
  }

  private buildClosureSummary(
    closure: CashClosureWithDetails,
    reportData: CashClosureReportData,
  ) {
    return {
      id: closure.id,
      openingDate: closure.openingDate,
      closingDate: closure.closingDate,
      isClosed: closure.isClosed,
      openingAmount: reportData.closure.openingAmount,
      closingAmount: reportData.closure.closingAmount,
      totalSales: reportData.closure.totalSales,
      totalWithdrawals: reportData.closure.totalWithdrawals,
      totalChange: reportData.closure.totalChange,
      totalCashSales: reportData.closure.totalCashSales,
      expectedClosing: reportData.closure.expectedClosing,
      difference: reportData.closure.difference,
      salesCount: reportData.closure.salesCount,
      seller: reportData.closure.seller,
      includeSaleDetails: reportData.includeSaleDetails,
    };
  }
}
