import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ProductService } from '../product/product.service';
import { PrinterService } from '../printer/printer.service';
import { FiscalService, NFCeData } from '../fiscal/fiscal.service';
import { EmailService } from '../../shared/services/email.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ProcessExchangeDto } from './dto/process-exchange.dto';
import { PaymentMethodDto, PaymentMethod } from './dto/payment-method.dto';


@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
    private readonly printerService: PrinterService,
    private readonly fiscalService: FiscalService,
    private readonly emailService: EmailService,
  ) {}

  async create(companyId: string, sellerId: string, createSaleDto: CreateSaleDto) {
    try {
      // Validate products and calculate total
      let total = 0;
      const validatedItems = [];

      for (const item of createSaleDto.items) {
        const product = await this.prisma.product.findFirst({
          where: {
            id: item.productId,
            companyId,
          },
        });

        if (!product) {
          throw new NotFoundException(`Produto ${item.productId} não encontrado`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(`Estoque insuficiente para o produto ${product.name}`);
        }

        const itemTotal = product.price.toNumber() * item.quantity;
        total += itemTotal;

        validatedItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: itemTotal,
        });
      }

      // Validate payment methods and calculate total paid
      const validPaymentMethods = Object.values(PaymentMethod);
      let totalPaid = 0;

      for (const paymentMethod of createSaleDto.paymentMethods) {
        // Validate payment method
        if (!validPaymentMethods.includes(paymentMethod.method as PaymentMethod)) {
          throw new BadRequestException(`Método de pagamento inválido: ${paymentMethod.method}`);
        }

        // Validate amount
        if (paymentMethod.amount <= 0) {
          throw new BadRequestException(`Valor inválido para o método ${paymentMethod.method}: ${paymentMethod.amount}`);
        }

        totalPaid += paymentMethod.amount;
      }

      // Check if installment payment requires client name
      const hasInstallment = createSaleDto.paymentMethods.some(pm => pm.method === PaymentMethod.INSTALLMENT);
      if (hasInstallment && !createSaleDto.clientName) {
        throw new BadRequestException('Nome do cliente é obrigatório para vendas a prazo');
      }

      // Validate total paid matches sale total (with tolerance for rounding)
      if (Math.abs(totalPaid - total) > 0.01) {
        throw new BadRequestException(`Total pago (${totalPaid}) não confere com o total da venda (${total})`);
      }

      // Calculate change (only relevant for cash payments)
      const cashPayment = createSaleDto.paymentMethods.find(pm => pm.method === PaymentMethod.CASH);
      const cashAmount = cashPayment ? cashPayment.amount : 0;
      const change = totalPaid > total ? totalPaid - total : 0;

      // Create sale with items in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create sale
        const sale = await tx.sale.create({
          data: {
            total,
            clientCpfCnpj: createSaleDto.clientCpfCnpj,
            clientName: createSaleDto.clientName,
            change,
            isInstallment: hasInstallment,
            companyId,
            sellerId,
          },
        });

        // Create payment methods
        for (const paymentMethod of createSaleDto.paymentMethods) {
          await tx.salePaymentMethod.create({
            data: {
              saleId: sale.id,
              method: paymentMethod.method,
              amount: paymentMethod.amount,
              additionalInfo: paymentMethod.additionalInfo,
            },
          });
        }

        // Create sale items and update stock
        for (const item of validatedItems) {
          await tx.saleItem.create({
            data: {
              ...item,
              saleId: sale.id,
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }

        return sale;
      });

        // Get complete sale data
        const completeSale = await this.prisma.sale.findUnique({
          where: { id: result.id },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    barcode: true,
                    price: true,
                  },
                },
              },
            },
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
            paymentMethods: true,
            company: {
              select: {
                id: true,
                name: true,
                cnpj: true,
                street: true,
                number: true,
                district: true,
                phone: true,
                email: true,
                customFooter: true,
              },
            },
          },
        });

      // Generate and print NFCe
      try {
        // Generate NFCe
        const nfceData: NFCeData = {
          companyId,
          clientCpfCnpj: createSaleDto.clientCpfCnpj,
          clientName: createSaleDto.clientName,
          items: completeSale.items.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            barcode: item.product.barcode,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
          })),
          totalValue: Number(completeSale.total),
          paymentMethod: completeSale.paymentMethods.map(pm => pm.method),
          saleId: completeSale.id,
          sellerName: completeSale.seller.name,
        };

        const fiscalDocument = await this.fiscalService.generateNFCe(nfceData);

        // Print NFCe
        const nfcePrintData = {
          company: {
            name: completeSale.company.name,
            cnpj: completeSale.company.cnpj,
            address: `${completeSale.company.street || ''}, ${completeSale.company.number || ''} - ${completeSale.company.district || ''}`,
            phone: completeSale.company.phone,
            email: completeSale.company.email,
          },
          fiscal: {
            documentNumber: fiscalDocument.documentNumber,
            accessKey: fiscalDocument.accessKey,
            emissionDate: fiscalDocument.emissionDate,
            status: fiscalDocument.status,
          },
          sale: {
            id: completeSale.id,
            total: Number(completeSale.total),
            clientName: completeSale.clientName,
            clientCpfCnpj: completeSale.clientCpfCnpj,
            paymentMethod: completeSale.paymentMethods.map(pm => pm.method),
            change: Number(completeSale.change),
            saleDate: completeSale.saleDate,
            sellerName: completeSale.seller.name,
          },
          items: completeSale.items.map(item => ({
            productName: item.product.name,
            barcode: item.product.barcode,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
          })),
          customFooter: completeSale.company.customFooter || 'OBRIGADO PELA PREFERÊNCIA!\nVOLTE SEMPRE!',
        };

        await this.printerService.printNFCe(nfcePrintData);
        this.logger.log(`NFCe printed successfully for sale: ${completeSale.id}`);
      } catch (fiscalError) {
        this.logger.warn('Failed to generate or print NFCe:', fiscalError);
        // Continue with sale even if NFCe fails
      }

      // Enviar email de confirmação se o cliente tiver email
      if (createSaleDto.clientCpfCnpj) {
        try {
          const customer = await this.prisma.customer.findFirst({
            where: {
              cpfCnpj: createSaleDto.clientCpfCnpj,
              companyId,
            },
            include: {
              company: {
                select: {
                  name: true,
                },
              },
            },
          });

          if (customer && customer.email) {
            await this.emailService.sendSaleConfirmationEmail(
              customer.email,
              customer.name,
              completeSale,
              customer.company.name
            );
            this.logger.log(`Sale confirmation email sent to customer: ${customer.email}`);
          }
        } catch (emailError) {
          this.logger.error('Failed to send sale confirmation email:', emailError);
          // Não falha a venda se o email falhar
        }
      }

      this.logger.log(`Sale created: ${result.id} for company: ${companyId}`);
      return completeSale;
    } catch (error) {
      this.logger.error('Error creating sale:', error);
      throw error;
    }
  }

  async findAll(companyId?: string, page = 1, limit = 10, sellerId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.saleDate.lte = new Date(endDate);
      }
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
          paymentMethods: true,
          seller: {
            select: {
              id: true,
              name: true,
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

  async findOne(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const sale = await this.prisma.sale.findUnique({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                price: true,
              },
            },
          },
        },
        paymentMethods: true,
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            cnpj: true,
          },
        },
        exchanges: {
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
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    return sale;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingSale = await this.prisma.sale.findUnique({
        where,
      });

      if (!existingSale) {
        throw new NotFoundException('Venda não encontrada');
      }

      // Only allow updates for recent sales (within 24 hours)
      const hoursSinceSale = (Date.now() - existingSale.saleDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceSale > 24) {
        throw new BadRequestException('Não é possível editar vendas com mais de 24 horas');
      }

      const { sellerId, items, paymentMethods, ...updateData } = updateSaleDto;
      const sale = await this.prisma.sale.update({
        where: { id },
        data: updateData,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  barcode: true,
                  price: true,
                },
              },
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

      this.logger.log(`Sale updated: ${sale.id}`);
      return sale;
    } catch (error) {
      this.logger.error('Error updating sale:', error);
      throw error;
    }
  }

  async remove(id: string, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingSale = await this.prisma.sale.findUnique({
        where,
        include: {
          items: true,
        },
      });

      if (!existingSale) {
        throw new NotFoundException('Venda não encontrada');
      }

      // Only allow deletion for recent sales (within 24 hours)
      const hoursSinceSale = (Date.now() - existingSale.saleDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceSale > 24) {
        throw new BadRequestException('Não é possível excluir vendas com mais de 24 horas');
      }

      // Restore stock and delete sale in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Restore stock for each item
        for (const item of existingSale.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }

        // Delete sale (cascade will delete items)
        await tx.sale.delete({
          where: { id },
        });
      });

      this.logger.log(`Sale deleted: ${id}`);
      return { message: 'Venda removida com sucesso' };
    } catch (error) {
      this.logger.error('Error deleting sale:', error);
      throw error;
    }
  }

  async processExchange(companyId: string, processExchangeDto: ProcessExchangeDto) {
    try {
      const { originalSaleId, productId, quantity, reason } = processExchangeDto;

      // Verify original sale belongs to company
      const originalSale = await this.prisma.sale.findFirst({
        where: {
          id: originalSaleId,
          companyId,
        },
        include: {
          items: {
            where: { productId },
          },
        },
      });

      if (!originalSale) {
        throw new NotFoundException('Venda original não encontrada');
      }

      const saleItem = originalSale.items[0];
      if (!saleItem) {
        throw new NotFoundException('Produto não encontrado na venda original');
      }

      if (quantity > saleItem.quantity) {
        throw new BadRequestException('Quantidade de troca não pode ser maior que a quantidade original');
      }

      // Verify product exists and has stock
      const product = await this.prisma.product.findFirst({
        where: {
          id: productId,
          companyId,
        },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado');
      }

      // Create exchange in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create exchange record
        const exchange = await tx.productExchange.create({
          data: {
            originalSaleId,
            productId,
            originalQuantity: saleItem.quantity,
            exchangedQuantity: quantity,
            reason,
          },
        });

        // Update product stock
        await tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: {
              increment: quantity,
            },
          },
        });

        return exchange;
      });

      this.logger.log(`Exchange processed: ${result.id} for sale: ${originalSaleId}`);
      return result;
    } catch (error) {
      this.logger.error('Error processing exchange:', error);
      throw error;
    }
  }

  async getSalesStats(companyId?: string, sellerId?: string, startDate?: string, endDate?: string) {
    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.saleDate.lte = new Date(endDate);
      }
    }

    const [totalSales, totalValue, averageTicket, salesByPaymentMethod] = await Promise.all([
      this.prisma.sale.count({ where }),
      this.prisma.sale.aggregate({
        where,
        _sum: { total: true },
      }),
      this.prisma.sale.aggregate({
        where,
        _avg: { total: true },
      }),
      this.prisma.salePaymentMethod.groupBy({
        by: ['method'],
        where: {
          sale: where,
        },
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    // Transform payment methods data
    const paymentMethodsSummary = salesByPaymentMethod.reduce((acc, item) => {
      acc[item.method] = {
        count: item._count.id,
        total: item._sum.amount || 0,
      };
      return acc;
    }, {});

    return {
      totalSales,
      totalValue: totalValue._sum.total || 0,
      averageTicket: averageTicket._avg.total || 0,
      salesByPaymentMethod: paymentMethodsSummary,
    };
  }

  async reprintReceipt(id: string, companyId?: string) {
    const sale = await this.findOne(id, companyId);
    
    try {
      // TODO: Fix printer service interface
      // await this.printerService.printReceipt(sale);
      return { message: 'Cupom reimpresso com sucesso' };
    } catch (error) {
      this.logger.error('Error reprinting receipt:', error);
      throw new BadRequestException('Erro ao reimprimir cupom');
    }
  }
}
