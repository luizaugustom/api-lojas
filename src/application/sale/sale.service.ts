import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { Prisma, ExchangeItemType, ExchangePaymentType, ExchangeStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ProductService } from '../product/product.service';
import { PrinterService } from '../printer/printer.service';
import { FiscalService, NFCeData } from '../fiscal/fiscal.service';
import { EmailService } from '../../shared/services/email.service';
import { IBPTService } from '../../shared/services/ibpt.service';
import { StoreCreditService } from '../store-credit/store-credit.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ProcessExchangeDto } from './dto/process-exchange.dto';
import { PaymentMethodDto, PaymentMethod } from './dto/payment-method.dto';
import { ClientTimeInfo, getClientNow } from '../../shared/utils/client-time.util';

const PRODUCT_EXCHANGE_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          barcode: true,
          ncm: true,
          cfop: true,
          unitOfMeasure: true,
        },
      },
      saleItem: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              ncm: true,
              cfop: true,
              unitOfMeasure: true,
            },
          },
        },
      },
    },
  },
  payments: true,
  processedBy: {
    select: {
      id: true,
      name: true,
    },
  },
  fiscalDocuments: true,
} satisfies Prisma.ProductExchangeInclude;

type ProductExchangeWithRelations = Prisma.ProductExchangeGetPayload<{
  include: typeof PRODUCT_EXCHANGE_INCLUDE;
}>;

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
    private readonly printerService: PrinterService,
    private readonly fiscalService: FiscalService,
    private readonly emailService: EmailService,
    private readonly ibptService: IBPTService,
    private readonly storeCreditService: StoreCreditService,
  ) {}

  async create(
    companyId: string,
    sellerId: string,
    createSaleDto: CreateSaleDto,
    computerId?: string | null,
    clientTimeInfo?: ClientTimeInfo,
  ) {
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

      // Check if installment payment requires client data
      const installmentPayment = createSaleDto.paymentMethods.find(pm => pm.method === PaymentMethod.INSTALLMENT);
      const hasInstallment = !!installmentPayment;
      
      if (hasInstallment) {
        if (!createSaleDto.clientName) {
          throw new BadRequestException('Nome do cliente é obrigatório para vendas a prazo');
        }
        if (!installmentPayment.customerId) {
          throw new BadRequestException('ID do cliente é obrigatório para vendas a prazo');
        }
        if (!installmentPayment.installments || installmentPayment.installments < 1) {
          throw new BadRequestException('Número de parcelas é obrigatório e deve ser maior que 0');
        }
        if (!installmentPayment.firstDueDate) {
          throw new BadRequestException('Data do primeiro vencimento é obrigatória para vendas a prazo');
        }

        // Verificar se o cliente existe e pertence à empresa
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: installmentPayment.customerId,
            companyId,
          },
        });

        if (!customer) {
          throw new NotFoundException('Cliente não encontrado');
        }
      }

      // Validate total paid covers sale total (with tolerance for rounding)
      const paymentDifference = totalPaid - total;
      if (paymentDifference < -0.01) {
        throw new BadRequestException(`Total pago (${totalPaid}) não confere com o total da venda (${total})`);
      }

      // Calculate change (only relevant for cash payments)
      const cashPayment = createSaleDto.paymentMethods.find(pm => pm.method === PaymentMethod.CASH);
      const cashAmount = cashPayment ? cashPayment.amount : 0;
      const change = paymentDifference > 0 ? paymentDifference : 0;

      const saleDate = getClientNow(clientTimeInfo);

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
            saleDate,
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

        // Create installments for installment payments
        if (installmentPayment) {
          const installmentAmount = installmentPayment.amount / installmentPayment.installments;
          
          // Garantir que a data seja válida
          let firstDueDate: Date;
          try {
            firstDueDate = new Date(installmentPayment.firstDueDate);
            if (isNaN(firstDueDate.getTime())) {
              throw new Error('Data inválida');
            }
          } catch (error) {
            this.logger.warn(`Data de vencimento inválida para venda ${sale.id}, usando data padrão`);
            firstDueDate = new Date(getClientNow(clientTimeInfo));
            firstDueDate.setMonth(firstDueDate.getMonth() + 1);
          }

          for (let i = 0; i < installmentPayment.installments; i++) {
            const dueDate = new Date(firstDueDate);
            dueDate.setMonth(dueDate.getMonth() + i);

            await tx.installment.create({
              data: {
                installmentNumber: i + 1,
                totalInstallments: installmentPayment.installments,
                amount: installmentAmount,
                remainingAmount: installmentAmount,
                dueDate,
                description: installmentPayment.description || `Parcela ${i + 1}/${installmentPayment.installments} da venda`,
                saleId: sale.id,
                customerId: installmentPayment.customerId,
                companyId,
              },
            });
          }

          this.logger.log(`Created ${installmentPayment.installments} installments for sale ${sale.id}`);
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
                    ncm: true,
                    cfop: true,
                  unitOfMeasure: true,
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
                stateRegistration: true,
                street: true,
                number: true,
                district: true,
                city: true,
                phone: true,
                email: true,
                state: true,
                customFooter: true,
              },
            },
          },
        });

      // Generate and print NFCe (only if not skipped)
      if (!createSaleDto.skipPrint) {
      try {
        // Verificar se a empresa tem configuração fiscal válida ANTES de tentar gerar NFCe
        const hasValidFiscalConfig = await this.fiscalService.hasValidFiscalConfig(companyId);
        
        if (!hasValidFiscalConfig) {
          // Se não tiver configuração válida, imprimir cupom não fiscal diretamente
          this.logger.warn(`⚠️ Empresa ${companyId} não tem configuração fiscal válida. Emitindo cupom não fiscal.`);
          
          const receiptData: any = {
            company: {
              name: completeSale.company.name,
              cnpj: completeSale.company.cnpj || '',
              address: `${completeSale.company.street || ''}, ${completeSale.company.number || ''} - ${completeSale.company.district || ''}`,
            },
            sale: {
              id: completeSale.id,
              date: completeSale.saleDate,
              total: Number(completeSale.total),
              paymentMethods: completeSale.paymentMethods.map(pm => pm.method),
              change: Number(completeSale.change),
            },
            items: completeSale.items.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
            })),
            seller: {
              name: completeSale.seller.name,
            },
            client: completeSale.clientName || completeSale.clientCpfCnpj ? {
              name: completeSale.clientName || undefined,
              cpfCnpj: completeSale.clientCpfCnpj || undefined,
            } : undefined,
            metadata: {
              clientTimeInfo,
            },
          };

          // Gerar conteúdo de impressão para retornar ao cliente
          let printContent: string | null = null;
          try {
            printContent = await this.printerService.getNonFiscalReceiptContent(receiptData, true, clientTimeInfo);
          } catch (generateError) {
            this.logger.warn('Erro ao gerar conteúdo de cupom não fiscal, continuando sem conteúdo:', generateError);
          }

          // Tentar imprimir no servidor (opcional)
          try {
            const printResult = await this.printerService.printNonFiscalReceipt(receiptData, companyId, true, computerId, clientTimeInfo);
            if (!printResult.success) {
              this.logger.warn(`⚠️ Falha na impressão do cupom não fiscal no servidor para venda: ${completeSale.id}`);
              this.logger.warn(`Erro: ${printResult.error}`);
              // Não falha a venda, apenas registra o aviso
            } else {
              this.logger.log(`✅ Cupom não fiscal impresso no servidor para venda: ${completeSale.id}`);
            }
          } catch (printError) {
            // Erro de impressão no servidor não deve falhar a venda
            this.logger.warn('Erro ao imprimir cupom não fiscal no servidor (continuando):', printError);
          }

          // Adicionar conteúdo de impressão à resposta
          if (printContent) {
            (completeSale as any).printContent = printContent;
            (completeSale as any).printType = 'non-fiscal';
          }
          
          // Adicionar aviso na resposta da venda
          (completeSale as any).warning = 'Cupom não fiscal emitido. Configure os dados fiscais para emitir NFCe válida.';
        } else {
          // Se tiver configuração válida, proceder com a geração de NFCe
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
              ncm: item.product.ncm || undefined,
              cfop: item.product.cfop || undefined,
              unitOfMeasure: item.product.unitOfMeasure || undefined,
            })),
            totalValue: Number(completeSale.total),
            payments: completeSale.paymentMethods.map(pm => ({
              method: pm.method,
              amount: Number(pm.amount),
            })),
            saleId: completeSale.id,
            sellerName: completeSale.seller.name,
            operationNature: 'Venda de mercadoria',
            source: 'SALE',
            metadata: {
              saleId: completeSale.id,
            },
          };

          const fiscalDocument = await this.fiscalService.generateNFCe(nfceData);

          // Verificar se é mock (status MOCK ou flag isMock)
          const isMocked = fiscalDocument.status === 'MOCK' || (fiscalDocument as any).isMock === true;

          // Calcular tributos usando IBPT
          let totalTaxes = 0;
          try {
            const taxCalculations = await Promise.all(
              completeSale.items.map(item =>
                this.ibptService.calculateProductTax(
                  item.product.ncm || '99999999',
                  Number(item.totalPrice),
                  completeSale.company.state || 'SC'
                )
              )
            );
            totalTaxes = taxCalculations.reduce((sum, calc) => sum + calc.taxValue, 0);
            this.logger.log(`Tributos calculados via IBPT: R$ ${totalTaxes.toFixed(2)}`);
          } catch (error) {
            this.logger.warn('Erro ao calcular tributos via IBPT, usando estimativa:', error);
            totalTaxes = Number(completeSale.total) * 0.1665; // Fallback
          }

          // Print NFCe (ou cupom não fiscal se mockado)
          const nfcePrintData = {
            company: {
              name: completeSale.company.name,
              cnpj: completeSale.company.cnpj,
              inscricaoEstadual: completeSale.company.stateRegistration,
              address: `${completeSale.company.street || ''}, ${completeSale.company.number || ''} - ${completeSale.company.district || ''}`,
              phone: completeSale.company.phone,
              email: completeSale.company.email,
            },
            fiscal: {
              documentNumber: fiscalDocument.documentNumber,
              accessKey: fiscalDocument.accessKey,
              emissionDate: fiscalDocument.emissionDate,
              status: fiscalDocument.status,
              protocol: fiscalDocument.protocol || undefined,
              qrCodeUrl: fiscalDocument.qrCodeUrl || undefined,
              serieNumber: fiscalDocument.serieNumber || '1',
              isMock: isMocked, // Flag para identificar como mock
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
              totalTaxes: totalTaxes,
            },
            items: completeSale.items.map(item => ({
              productName: item.product.name,
              barcode: item.product.barcode,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
              ncm: item.product.ncm || '99999999',
              cfop: item.product.cfop || '5102',
            })),
            customFooter: completeSale.company.customFooter,
            metadata: {
              clientTimeInfo,
            },
          };

          // Gerar conteúdo de impressão para retornar ao cliente
          let printContent: string | null = null;
          try {
            printContent = await this.printerService.generatePrintContent(nfcePrintData, companyId, clientTimeInfo);
          } catch (generateError) {
            this.logger.warn('Erro ao gerar conteúdo de impressão, continuando sem conteúdo:', generateError);
          }

          // Tentar imprimir no servidor (opcional, pode falhar se não houver impressora)
          try {
            const printResult = await this.printerService.printNFCe(nfcePrintData, companyId, computerId, clientTimeInfo);
            if (!printResult.success) {
              this.logger.warn(`⚠️ Falha na impressão no servidor para venda: ${completeSale.id}`);
              this.logger.warn(`Erro: ${printResult.error}`);
              // Não falha a venda, apenas registra o aviso
            } else {
              this.logger.log(`✅ NFCe impressa no servidor para venda: ${completeSale.id}`);
            }
          } catch (printError) {
            // Erro de impressão no servidor não deve falhar a venda
            this.logger.warn('Erro ao imprimir no servidor (continuando):', printError);
          }

          // Adicionar conteúdo de impressão à resposta
          if (printContent) {
            (completeSale as any).printContent = printContent;
            (completeSale as any).printType = isMocked ? 'non-fiscal' : 'nfce';
          }
          
          if (isMocked) {
            this.logger.warn(`⚠️ Cupom não fiscal gerado para venda: ${completeSale.id} (empresa sem configuração fiscal)`);
            (completeSale as any).warning = 'Cupom não fiscal emitido. Configure os dados fiscais para emitir NFCe válida.';
          } else {
            this.logger.log(`✅ NFCe gerada com sucesso para venda: ${completeSale.id}`);
          }
        }
      } catch (fiscalError) {
        // Se for erro de impressão (BadRequestException), propaga com a mensagem detalhada
        if (fiscalError instanceof BadRequestException) {
          throw fiscalError;
        }
        this.logger.warn('Failed to generate or print NFCe:', fiscalError);
        // Continue with sale even if NFCe fails (mas não propaga o erro)
        }
      } else {
        this.logger.log(`NFCe printing skipped for sale: ${completeSale.id} (skipPrint=true)`);
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
              customer.company.name,
              clientTimeInfo,
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
          include: PRODUCT_EXCHANGE_INCLUDE,
          orderBy: {
            exchangeDate: 'desc',
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Venda não encontrada');
    }

    const mappedExchanges = (sale.exchanges ?? [])
      .map((exchange) => this.mapExchange(exchange))
      .filter(Boolean);

    return {
      ...sale,
      exchanges: mappedExchanges,
    };
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

  async processExchange(
    companyId: string,
    processExchangeDto: ProcessExchangeDto,
    processedById?: string,
  ) {
    try {
      const {
        originalSaleId,
        returnedItems,
        newItems = [],
        payments = [],
        refunds = [],
        reason,
        note,
        issueStoreCredit = false,
      } = processExchangeDto;

      if (!returnedItems || returnedItems.length === 0) {
        throw new BadRequestException('Informe ao menos um item para devolução.');
      }

      const sale = await this.prisma.sale.findFirst({
        where: {
          id: originalSaleId,
          companyId,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  stockQuantity: true,
                  price: true,
                  barcode: true,
                  ncm: true,
                  cfop: true,
                  unitOfMeasure: true,
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
              state: true,
              city: true,
            },
          },
        },
      });

      if (!sale) {
        throw new NotFoundException('Venda original não encontrada');
      }

      const normalizedPayments = (payments ?? []).map((payment) => ({
        method: payment.method,
        amount: this.roundCurrency(payment.amount),
        additionalInfo: payment.additionalInfo,
      }));

      const normalizedRefunds = (refunds ?? []).map((refund) => ({
        method: refund.method,
        amount: this.roundCurrency(refund.amount),
        additionalInfo: refund.additionalInfo,
      }));

      const saleItemMap = new Map(
        sale.items.map((item) => [item.id, item]),
      );

      const uniqueSaleItemIds = Array.from(
        new Set(returnedItems.map((item) => item.saleItemId)),
      );

      const previousReturnedItems = uniqueSaleItemIds.length
        ? await this.prisma.productExchangeItem.findMany({
            where: {
              saleItemId: { in: uniqueSaleItemIds },
              type: ExchangeItemType.RETURNED,
              exchange: {
                originalSaleId,
              },
            },
            select: {
              saleItemId: true,
              quantity: true,
            },
          })
        : [];

      const alreadyReturnedMap = new Map<string, number>();
      for (const record of previousReturnedItems) {
        const current = alreadyReturnedMap.get(record.saleItemId) ?? 0;
        alreadyReturnedMap.set(record.saleItemId, current + record.quantity);
      }

      let returnedTotal = 0;
      const validatedReturnedItems = returnedItems.map((item) => {
        const saleItem = saleItemMap.get(item.saleItemId);
        if (!saleItem) {
          throw new BadRequestException('Item da venda não encontrado para devolução.');
        }

        if (saleItem.productId !== item.productId) {
          throw new BadRequestException(
            'Produto informado não corresponde ao item da venda original.',
          );
        }

        const alreadyReturned = alreadyReturnedMap.get(item.saleItemId) ?? 0;
        const remaining = saleItem.quantity - alreadyReturned;

        if (remaining <= 0) {
          throw new BadRequestException(
            `O item ${saleItem.product?.name ?? ''} já foi totalmente devolvido.`,
          );
        }

        if (item.quantity > remaining) {
          throw new BadRequestException(
            `Quantidade de devolução (${item.quantity}) excede o disponível (${remaining}) para o item ${saleItem.product?.name ?? ''}.`,
          );
        }

        const unitPrice = this.toNumber(saleItem.unitPrice);
        const totalPrice = this.roundCurrency(unitPrice * item.quantity);

        returnedTotal = this.roundCurrency(returnedTotal + totalPrice);
        alreadyReturnedMap.set(item.saleItemId, alreadyReturned + item.quantity);

        return {
          saleItem,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        };
      });

      let deliveredTotal = 0;
      const validatedDeliveredItems: {
        product: {
          id: string;
          name: string;
          stockQuantity: number;
          price: Prisma.Decimal;
          barcode: string | null;
          ncm: string | null;
          cfop: string | null;
          unitOfMeasure: string | null;
        };
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }[] = [];

      if (newItems.length > 0) {
        const productIds = Array.from(new Set(newItems.map((item) => item.productId)));
        const products = await this.prisma.product.findMany({
          where: {
            id: { in: productIds },
            companyId,
          },
          select: {
            id: true,
            name: true,
            stockQuantity: true,
            price: true,
            barcode: true,
            ncm: true,
            cfop: true,
            unitOfMeasure: true,
          },
        });

        const productMap = new Map(products.map((product) => [product.id, product]));

        for (const item of newItems) {
          const product = productMap.get(item.productId);

          if (!product) {
            throw new NotFoundException(`Produto ${item.productId} não encontrado para entrega`);
          }

          const unitPrice = item.unitPrice ?? this.toNumber(product.price);
          if (unitPrice < 0) {
            throw new BadRequestException(`Preço inválido para o produto ${product.name}`);
          }

          if (product.stockQuantity < item.quantity) {
            throw new BadRequestException(
              `Estoque insuficiente para o produto ${product.name}`,
            );
          }

          const totalPrice = this.roundCurrency(unitPrice * item.quantity);
          deliveredTotal = this.roundCurrency(deliveredTotal + totalPrice);

          validatedDeliveredItems.push({
            product,
            quantity: item.quantity,
            unitPrice,
            totalPrice,
          });
        }
      }

      const tolerance = 0.01;
      const difference = this.roundCurrency(deliveredTotal - returnedTotal);
      const amountToReceive = difference > 0 ? difference : 0;
      const amountToReturn = difference < 0 ? Math.abs(difference) : 0;

      const paymentsTotal = this.roundCurrency(
        normalizedPayments.reduce((sum, payment) => sum + payment.amount, 0),
      );
      const refundsTotal = this.roundCurrency(
        normalizedRefunds.reduce((sum, refund) => sum + refund.amount, 0),
      );

      let storeCreditApplied = this.roundCurrency(deliveredTotal - paymentsTotal);
      if (storeCreditApplied < tolerance) {
        storeCreditApplied = 0;
      }
      const availableCredit = Math.max(
        0,
        this.roundCurrency(returnedTotal - refundsTotal),
      );
      if (storeCreditApplied > availableCredit) {
        storeCreditApplied = availableCredit;
      }

      let storeCreditAmount = 0;

      if (difference > tolerance) {
        if (issueStoreCredit) {
          throw new BadRequestException(
            'Crédito em loja só pode ser gerado quando há valor a devolver ao cliente.',
          );
        }

        if (refundsTotal > 0) {
          throw new BadRequestException(
            'Não é possível registrar reembolso quando há valor pendente de pagamento.',
          );
        }

        if (paymentsTotal <= 0) {
          throw new BadRequestException(
            'Informe as formas de pagamento para cobrir a diferença da troca.',
          );
        }

        if (Math.abs(paymentsTotal - amountToReceive) > tolerance) {
          throw new BadRequestException(
            `Total dos pagamentos (${paymentsTotal.toFixed(
              2,
            )}) não coincide com o valor devido (${amountToReceive.toFixed(2)}).`,
          );
        }
      } else if (difference < -tolerance) {
        if (paymentsTotal > 0) {
          throw new BadRequestException(
            'Não é possível registrar pagamento quando há valor a devolver.',
          );
        }

        if (issueStoreCredit) {
          if (refundsTotal - amountToReturn > tolerance) {
            throw new BadRequestException(
              'Os reembolsos informados não podem exceder o valor a devolver.',
            );
          }

          storeCreditAmount = this.roundCurrency(amountToReturn - refundsTotal);
        } else {
          if (refundsTotal <= 0) {
            throw new BadRequestException(
              'Informe as formas de reembolso para devolver a diferença ao cliente.',
            );
          }

          if (Math.abs(refundsTotal - amountToReturn) > tolerance) {
            throw new BadRequestException(
              `Total dos reembolsos (${refundsTotal.toFixed(
                2,
              )}) não coincide com o valor devido (${amountToReturn.toFixed(2)}).`,
            );
          }
        }
      } else {
        if (paymentsTotal > tolerance || refundsTotal > tolerance) {
          throw new BadRequestException(
            'Não é possível registrar pagamento ou reembolso sem diferença de valores.',
          );
        }

        if (issueStoreCredit) {
          throw new BadRequestException('Não há valor para gerar crédito em loja.');
        }
      }

      const exchange = await this.prisma.$transaction(async (tx) => {
        const createdExchange = await tx.productExchange.create({
          data: {
            reason,
            note,
            companyId,
            originalSaleId,
            processedById: processedById ?? null,
            returnedTotal,
            deliveredTotal,
            difference,
            storeCreditAmount,
          },
        });

        for (const returned of validatedReturnedItems) {
          await tx.productExchangeItem.create({
            data: {
              exchangeId: createdExchange.id,
              type: ExchangeItemType.RETURNED,
              quantity: returned.quantity,
              unitPrice: returned.unitPrice,
              totalPrice: returned.totalPrice,
              productId: returned.saleItem.productId,
              saleItemId: returned.saleItem.id,
            },
          });

          await tx.product.update({
            where: { id: returned.saleItem.productId },
            data: {
              stockQuantity: {
                increment: returned.quantity,
              },
            },
          });
        }

        for (const delivered of validatedDeliveredItems) {
          await tx.productExchangeItem.create({
            data: {
              exchangeId: createdExchange.id,
              type: ExchangeItemType.DELIVERED,
              quantity: delivered.quantity,
              unitPrice: delivered.unitPrice,
              totalPrice: delivered.totalPrice,
              productId: delivered.product.id,
            },
          });

          await tx.product.update({
            where: { id: delivered.product.id },
            data: {
              stockQuantity: {
                decrement: delivered.quantity,
              },
            },
          });
        }

        for (const payment of normalizedPayments) {
          await tx.productExchangePayment.create({
            data: {
              exchangeId: createdExchange.id,
              type: ExchangePaymentType.PAYMENT,
              method: payment.method,
              amount: payment.amount,
              additionalInfo: payment.additionalInfo,
            },
          });
        }

        for (const refund of normalizedRefunds) {
          await tx.productExchangePayment.create({
            data: {
              exchangeId: createdExchange.id,
              type: ExchangePaymentType.REFUND,
              method: refund.method,
              amount: refund.amount,
              additionalInfo: refund.additionalInfo,
            },
          });
        }

        return createdExchange;
      });

      this.logger.log(`Exchange processed: ${exchange.id} for sale: ${originalSaleId}`);

      // Criar transação de crédito se houver valor de crédito gerado
      if (storeCreditAmount > tolerance && sale.clientCpfCnpj) {
        try {
          // Buscar ou criar cliente pelo CPF/CNPJ
          let customer = await this.prisma.customer.findFirst({
            where: {
              cpfCnpj: sale.clientCpfCnpj,
              companyId,
            },
          });

          if (!customer) {
            // Criar cliente se não existir
            customer = await this.prisma.customer.create({
              data: {
                name: sale.clientName || 'Cliente',
                cpfCnpj: sale.clientCpfCnpj,
                companyId,
              },
            });
          }

          // Adicionar crédito
          await this.storeCreditService.addCredit(
            companyId,
            customer.id,
            storeCreditAmount,
            `Crédito gerado pela troca #${exchange.id}`,
            exchange.id,
            processedById || undefined,
          );

          this.logger.log(
            `Store credit added: Customer ${customer.id}, Amount: ${storeCreditAmount}, Exchange: ${exchange.id}`,
          );
        } catch (creditError) {
          this.logger.error(
            `Error adding store credit for exchange ${exchange.id}:`,
            creditError,
          );
          // Não falha a troca se houver erro ao adicionar crédito, apenas loga
        }
      }

      const fiscalWarnings: string[] = [];
      const fiscalErrors: string[] = [];

      const hasValidFiscalConfig = await this.fiscalService.hasValidFiscalConfig(companyId);

      if (!hasValidFiscalConfig) {
        fiscalWarnings.push(
          'Empresa não possui configuração fiscal válida. NFC-e não foi emitida para esta troca.',
        );
        await this.prisma.productExchange.update({
          where: { id: exchange.id },
          data: { status: ExchangeStatus.PENDING },
        });
      } else {
        const originalFiscalDocument = await this.prisma.fiscalDocument.findFirst({
          where: {
            companyId,
            saleId: originalSaleId,
            documentType: 'NFCe',
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (!originalFiscalDocument) {
          fiscalWarnings.push(
            'Documento fiscal original não encontrado. A devolução será emitida sem referência.',
          );
        }

        if (returnedTotal > tolerance) {
          const returnItemsForFiscal = validatedReturnedItems.map((returned) => ({
            productId: returned.saleItem.productId,
            productName: returned.saleItem.product?.name || 'Produto',
            barcode: returned.saleItem.product?.barcode || '',
            quantity: returned.quantity,
            unitPrice: returned.unitPrice,
            totalPrice: returned.totalPrice,
            ncm: returned.saleItem.product?.ncm || undefined,
            cfop: '1202',
            unitOfMeasure: returned.saleItem.product?.unitOfMeasure || 'UN',
          }));

          const returnPaymentsBase = [
            ...normalizedRefunds.map((refund) => ({
              method: refund.method,
              amount: refund.amount,
            })),
          ];

          if (storeCreditApplied > tolerance) {
            returnPaymentsBase.push({
              method: PaymentMethod.STORE_CREDIT,
              amount: storeCreditApplied,
            });
          }

          if (storeCreditAmount > tolerance) {
            returnPaymentsBase.push({
              method: PaymentMethod.STORE_CREDIT,
              amount: storeCreditAmount,
            });
          }

          const returnPaymentsForFiscal = this.adjustPaymentTotals(returnPaymentsBase, returnedTotal);

          try {
            await this.fiscalService.generateNFCe({
              companyId,
              clientCpfCnpj: sale.clientCpfCnpj || undefined,
              clientName: sale.clientName || undefined,
              items: returnItemsForFiscal,
              totalValue: returnedTotal,
              payments: returnPaymentsForFiscal,
              saleId: originalSaleId,
              apiReference: `${originalSaleId}-return-${exchange.id}`,
              sellerName: sale.seller?.name || 'Troca',
              operationNature: 'Devolução de mercadorias',
              emissionPurpose: 4,
              referenceAccessKey: originalFiscalDocument?.accessKey || undefined,
              documentType: 0,
              additionalInfo: note || undefined,
              productExchangeId: exchange.id,
              source: 'EXCHANGE_RETURN',
              metadata: {
                exchangeId: exchange.id,
                role: 'return',
                originalSaleId,
                payments: returnPaymentsForFiscal,
                storeCreditApplied,
                storeCreditAmount,
              },
            });
          } catch (fiscalError) {
            const message = this.extractErrorMessage(fiscalError);
            fiscalErrors.push(`Erro ao emitir NFC-e de devolução: ${message}`);
            this.logger.error('Erro ao emitir NFC-e de devolução para troca', fiscalError);
          }
        }

        if (deliveredTotal > tolerance) {
          const deliveryItemsForFiscal = validatedDeliveredItems.map((delivered) => ({
            productId: delivered.product.id,
            productName: delivered.product.name,
            barcode: delivered.product.barcode || '',
            quantity: delivered.quantity,
            unitPrice: delivered.unitPrice,
            totalPrice: delivered.totalPrice,
            ncm: (delivered.product as any).ncm || undefined,
            cfop: (delivered.product as any).cfop || '5102',
            unitOfMeasure: (delivered.product as any).unitOfMeasure || 'UN',
          }));

          const deliveryPaymentsBase = [
            ...normalizedPayments.map((payment) => ({
              method: payment.method,
              amount: payment.amount,
            })),
          ];

          if (storeCreditApplied > tolerance) {
            deliveryPaymentsBase.push({
              method: PaymentMethod.STORE_CREDIT,
              amount: storeCreditApplied,
            });
          }

          const deliveryPaymentsForFiscal = this.adjustPaymentTotals(
            deliveryPaymentsBase,
            deliveredTotal,
          );

          try {
            await this.fiscalService.generateNFCe({
              companyId,
              clientCpfCnpj: sale.clientCpfCnpj || undefined,
              clientName: sale.clientName || undefined,
              items: deliveryItemsForFiscal,
              totalValue: deliveredTotal,
              payments: deliveryPaymentsForFiscal,
              saleId: originalSaleId,
              apiReference: `${originalSaleId}-delivery-${exchange.id}`,
              sellerName: sale.seller?.name || 'Troca',
              operationNature: 'Saída de mercadorias - troca',
              emissionPurpose: 1,
              documentType: 1,
              additionalInfo: note || undefined,
              productExchangeId: exchange.id,
              source: 'EXCHANGE_DELIVERY',
              metadata: {
                exchangeId: exchange.id,
                role: 'delivery',
                originalSaleId,
                payments: deliveryPaymentsForFiscal,
                storeCreditApplied,
                difference,
              },
            });
          } catch (fiscalError) {
            const message = this.extractErrorMessage(fiscalError);
            fiscalErrors.push(`Erro ao emitir NFC-e dos itens entregues: ${message}`);
            this.logger.error('Erro ao emitir NFC-e dos itens entregues na troca', fiscalError);
          }
        }
      }

      if (fiscalErrors.length) {
        await this.prisma.productExchange.update({
          where: { id: exchange.id },
          data: { status: ExchangeStatus.PENDING },
        });
        fiscalWarnings.push(...fiscalErrors);
      }

      const exchangeWithRelations = await this.prisma.productExchange.findUnique({
        where: { id: exchange.id },
        include: PRODUCT_EXCHANGE_INCLUDE,
      });

      const mappedExchange = this.mapExchange(exchangeWithRelations);
      if (mappedExchange) {
        mappedExchange.fiscalWarnings = fiscalWarnings;
      }
      return mappedExchange;
    } catch (error) {
      this.logger.error('Error processing exchange:', error);
      throw error;
    }
  }

  private toNumber(value: Prisma.Decimal | number | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }

    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) {
      return 0;
    }

    return numericValue;
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private adjustPaymentTotals(
    payments: Array<{ method: string; amount: number }>,
    expectedTotal: number,
  ) {
    const roundedExpected = this.roundCurrency(expectedTotal);
    const normalized = payments
      .map((payment) => ({
        method: payment.method,
        amount: this.roundCurrency(payment.amount),
      }))
      .filter((payment) => payment.amount > 0);

    if (normalized.length === 0 && roundedExpected > 0) {
      normalized.push({
        method: PaymentMethod.CASH,
        amount: roundedExpected,
      });
      return normalized;
    }

    if (normalized.length === 0) {
      return normalized;
    }

    const total = this.roundCurrency(
      normalized.reduce((sum, payment) => sum + payment.amount, 0),
    );
    const diff = this.roundCurrency(roundedExpected - total);

    if (Math.abs(diff) > 0.01) {
      const lastIndex = normalized.length - 1;
      normalized[lastIndex].amount = this.roundCurrency(
        Math.max(0, normalized[lastIndex].amount + diff),
      );
    }

    return normalized;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof BadRequestException) {
      const response: any = (error as any).response ?? error.getResponse?.();
      if (response) {
        if (Array.isArray(response.message)) {
          return response.message.join('; ');
        }
        if (response.message) {
          return response.message;
        }
        if (response.error) {
          return response.error;
        }
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return 'Erro desconhecido';
  }

  private mapExchange(exchange?: ProductExchangeWithRelations | null) {
    if (!exchange) {
      return null;
    }

    const returnedItems = [];
    const deliveredItems = [];

    for (const item of exchange.items ?? []) {
      const baseItem = {
        id: item.id,
        quantity: item.quantity,
        unitPrice: this.toNumber(item.unitPrice),
        totalPrice: this.toNumber(item.totalPrice),
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              barcode: item.product.barcode,
            }
          : null,
        saleItemId: item.saleItemId,
      };

      if (item.type === ExchangeItemType.RETURNED) {
        returnedItems.push({
          ...baseItem,
          saleItem: item.saleItem
            ? {
                id: item.saleItem.id,
                quantity: item.saleItem.quantity,
                unitPrice: this.toNumber(item.saleItem.unitPrice),
                product: item.saleItem.product
                  ? {
                      id: item.saleItem.product.id,
                      name: item.saleItem.product.name,
                      barcode: item.saleItem.product.barcode,
                    }
                  : null,
              }
            : null,
        });
      } else {
        deliveredItems.push(baseItem);
      }
    }

    const payments = (exchange.payments ?? [])
      .filter((payment) => payment.type === ExchangePaymentType.PAYMENT)
      .map((payment) => ({
        id: payment.id,
        method: payment.method,
        amount: this.toNumber(payment.amount),
        additionalInfo: payment.additionalInfo,
        createdAt: payment.createdAt,
      }));

    const refunds = (exchange.payments ?? [])
      .filter((payment) => payment.type === ExchangePaymentType.REFUND)
      .map((payment) => ({
        id: payment.id,
        method: payment.method,
        amount: this.toNumber(payment.amount),
        additionalInfo: payment.additionalInfo,
        createdAt: payment.createdAt,
      }));

    const fiscalDocuments = (exchange.fiscalDocuments ?? []).map((document) => ({
      id: document.id,
      documentType: document.documentType,
      origin: document.origin,
      documentNumber: document.documentNumber,
      accessKey: document.accessKey,
      status: document.status,
      totalValue: this.toNumber(document.totalValue),
      pdfUrl: document.pdfUrl,
      qrCodeUrl: document.qrCodeUrl,
      createdAt: document.createdAt,
      metadata: (document.metadata as Record<string, any>) || undefined,
    }));

    const returnFiscalDocument = fiscalDocuments.find(
      (document) => document.origin === 'EXCHANGE_RETURN',
    );
    const deliveryFiscalDocument = fiscalDocuments.find(
      (document) => document.origin === 'EXCHANGE_DELIVERY',
    );

    return {
      id: exchange.id,
      reason: exchange.reason,
      note: exchange.note,
      exchangeDate: exchange.exchangeDate,
      returnedTotal: this.toNumber(exchange.returnedTotal),
      deliveredTotal: this.toNumber(exchange.deliveredTotal),
      difference: this.toNumber(exchange.difference),
      storeCreditAmount: this.toNumber(exchange.storeCreditAmount),
      status: exchange.status,
      processedBy: exchange.processedBy
        ? {
            id: exchange.processedBy.id,
            name: exchange.processedBy.name,
          }
        : null,
      returnedItems,
      deliveredItems,
      payments,
      refunds,
      createdAt: exchange.createdAt,
      fiscalDocuments,
      returnFiscalDocument: returnFiscalDocument || null,
      deliveryFiscalDocument: deliveryFiscalDocument || null,
      fiscalWarnings: [],
    };
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

  async reprintReceipt(
    id: string,
    companyId?: string,
    computerId?: string | null,
    clientTimeInfo?: ClientTimeInfo,
  ) {
    // Buscar venda com todas as relações necessárias
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        paymentMethods: true,
        seller: true,
        company: true,
      },
    });

    if (!sale) {
      throw new BadRequestException('Venda não encontrada');
    }

    if (companyId && sale.companyId !== companyId) {
      throw new BadRequestException('Venda não pertence à empresa');
    }
    
    try {
      // Buscar documento fiscal associado à venda
      const fiscalDocument = await this.prisma.fiscalDocument.findFirst({
        where: {
          companyId: sale.companyId,
          // Buscar pela venda através do xmlContent ou outro campo
          // Como não temos um campo direto de saleId, vamos gerar a NFCe novamente
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Verificar se a empresa tem configuração fiscal válida ANTES de tentar gerar NFCe
      const hasValidFiscalConfig = await this.fiscalService.hasValidFiscalConfig(sale.companyId);
      
      // Se não houver documento fiscal ou não tiver configuração válida, gerar cupom não fiscal
      if (!fiscalDocument || !hasValidFiscalConfig) {
        if (!hasValidFiscalConfig) {
          this.logger.warn(`⚠️ Empresa ${sale.companyId} não tem configuração fiscal válida. Emitindo cupom não fiscal para reimpressão.`);
        } else {
          this.logger.warn(`No fiscal document found for sale ${id}, attempting to generate new NFCe`);
        }
        
        // Se não tiver configuração válida, imprimir cupom não fiscal diretamente
        if (!hasValidFiscalConfig) {
          const receiptData: any = {
            company: {
              name: sale.company.name,
              cnpj: sale.company.cnpj || '',
              address: `${sale.company.street || ''}, ${sale.company.number || ''} - ${sale.company.district || ''}`,
            },
            sale: {
              id: sale.id,
              date: sale.saleDate,
              total: Number(sale.total),
              paymentMethods: sale.paymentMethods.map(pm => pm.method),
              change: Number(sale.change),
            },
            items: sale.items.map(item => ({
              name: item.product.name,
              quantity: item.quantity,
              unitPrice: Number(item.unitPrice),
              totalPrice: Number(item.totalPrice),
            })),
            seller: {
              name: sale.seller.name,
            },
            client: sale.clientName || sale.clientCpfCnpj ? {
              name: sale.clientName || undefined,
              cpfCnpj: sale.clientCpfCnpj || undefined,
            } : undefined,
            metadata: {
              clientTimeInfo,
            },
          };

          // Gerar conteúdo de impressão para retornar ao cliente
          let printContent: string | null = null;
          try {
            printContent = await this.printerService.getNonFiscalReceiptContent(receiptData, true, clientTimeInfo);
          } catch (generateError) {
            this.logger.warn('Erro ao gerar conteúdo de cupom não fiscal para reprint, continuando sem conteúdo:', generateError);
          }

          // Tentar imprimir no servidor (opcional)
          try {
            const printResult = await this.printerService.printNonFiscalReceipt(receiptData, sale.companyId, true, computerId, clientTimeInfo);
            if (!printResult.success) {
              // Não falha se a impressão no servidor falhar, apenas registra
              this.logger.warn(`⚠️ Falha na reimpressão do cupom não fiscal no servidor para venda: ${sale.id}`);
              this.logger.warn(`Erro: ${printResult.error}`);
            } else {
              this.logger.log(`✅ Cupom não fiscal reimpresso no servidor para venda: ${sale.id}`);
            }
          } catch (printError) {
            // Não falha se a impressão no servidor falhar, apenas registra
            this.logger.warn('Erro ao reimprimir cupom não fiscal no servidor (continuando):', printError);
          }

          this.logger.log(`✅ Conteúdo de cupom não fiscal gerado para reprint da venda: ${sale.id}`);
          return { 
            message: 'Cupom não fiscal reimpresso com sucesso',
            warning: 'Cupom não fiscal emitido. Configure os dados fiscais para emitir NFCe válida.',
            printContent: printContent || undefined,
            printType: 'non-fiscal',
          };
        }
        
        // Gerar NFCe (se tiver configuração válida mas não tiver documento)
        const nfceData: NFCeData = {
          companyId: sale.companyId,
          clientCpfCnpj: sale.clientCpfCnpj,
          clientName: sale.clientName,
          items: sale.items.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            barcode: item.product.barcode,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
            ncm: item.product.ncm || undefined,
            cfop: item.product.cfop || undefined,
            unitOfMeasure: item.product.unitOfMeasure || undefined,
          })),
          totalValue: Number(sale.total),
          payments: sale.paymentMethods.map((pm) => ({
            method: pm.method,
            amount: this.toNumber(pm.amount),
          })),
          saleId: sale.id,
          sellerName: sale.seller.name,
        };

        const newFiscalDocument = await this.fiscalService.generateNFCe(nfceData);
        
        // Verificar se é mock
        const isMocked = newFiscalDocument.status === 'MOCK' || (newFiscalDocument as any).isMock === true;
        
        // Imprimir NFCe
        const nfcePrintData = {
          company: {
            name: sale.company.name,
            cnpj: sale.company.cnpj,
            inscricaoEstadual: sale.company.stateRegistration,
            address: `${sale.company.street || ''}, ${sale.company.number || ''} - ${sale.company.district || ''}`,
            phone: sale.company.phone,
            email: sale.company.email,
          },
          fiscal: {
            documentNumber: newFiscalDocument.documentNumber,
            accessKey: newFiscalDocument.accessKey,
            emissionDate: newFiscalDocument.emissionDate || new Date(),
            status: newFiscalDocument.status,
            protocol: newFiscalDocument.protocol || undefined,
            qrCodeUrl: newFiscalDocument.qrCodeUrl || undefined,
            serieNumber: newFiscalDocument.serieNumber || '1',
            isMock: isMocked, // Flag para identificar como mock
          },
          sale: {
            id: sale.id,
            total: Number(sale.total),
            clientName: sale.clientName,
            clientCpfCnpj: sale.clientCpfCnpj,
            paymentMethod: sale.paymentMethods.map(pm => pm.method),
            change: Number(sale.change),
            saleDate: sale.saleDate,
            sellerName: sale.seller.name,
            totalTaxes: Number(sale.total) * 0.1665, // Estimativa 16.65%
          },
          items: sale.items.map(item => ({
            productName: item.product.name,
            barcode: item.product.barcode,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
            ncm: item.product.ncm || '99999999',
            cfop: item.product.cfop || '5102',
          })),
          customFooter: sale.company.customFooter,
          metadata: {
            clientTimeInfo,
          },
        };

        const printResult = await this.printerService.printNFCe(nfcePrintData, sale.companyId, computerId, clientTimeInfo);
        
        if (!printResult.success) {
          const errorMessage = printResult.details?.reason || printResult.error || 'Erro ao reimprimir NFC-e';
          this.logger.error(`Erro ao reimprimir NFC-e para venda ${sale.id}: ${errorMessage}`);
          throw new BadRequestException(errorMessage);
        }
      } else {
        // Verificar se é mock
        const isMocked = fiscalDocument.status === 'MOCK' || (fiscalDocument as any).isMock === true;

        // Imprimir com documento fiscal existente
        const nfcePrintData = {
          company: {
            name: sale.company.name,
            cnpj: sale.company.cnpj,
            inscricaoEstadual: sale.company.stateRegistration,
            address: `${sale.company.street || ''}, ${sale.company.number || ''} - ${sale.company.district || ''}`,
            phone: sale.company.phone,
            email: sale.company.email,
          },
          fiscal: {
            documentNumber: fiscalDocument.documentNumber,
            accessKey: fiscalDocument.accessKey,
            emissionDate: fiscalDocument.emissionDate || new Date(),
            status: fiscalDocument.status,
            protocol: fiscalDocument.protocol || undefined,
            qrCodeUrl: fiscalDocument.qrCodeUrl || undefined,
            serieNumber: fiscalDocument.serieNumber || '1',
            isMock: isMocked, // Flag para identificar como mock
          },
          sale: {
            id: sale.id,
            total: Number(sale.total),
            clientName: sale.clientName,
            clientCpfCnpj: sale.clientCpfCnpj,
            paymentMethod: sale.paymentMethods.map(pm => pm.method),
            change: Number(sale.change),
            saleDate: sale.saleDate,
            sellerName: sale.seller.name,
            totalTaxes: Number(sale.total) * 0.1665, // Estimativa 16.65%
          },
          items: sale.items.map(item => ({
            productName: item.product.name,
            barcode: item.product.barcode,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
            ncm: item.product.ncm || '99999999',
            cfop: item.product.cfop || '5102',
          })),
          customFooter: sale.company.customFooter,
          metadata: {
            clientTimeInfo,
          },
        };

                  // Gerar conteúdo de impressão para retornar ao cliente
          let printContent: string | null = null;
          try {
            printContent = await this.printerService.generatePrintContent(nfcePrintData, sale.companyId, clientTimeInfo);
          } catch (generateError) {
            this.logger.warn('Erro ao gerar conteúdo de impressão para reprint, continuando sem conteúdo:', generateError);
          }

          // Tentar imprimir no servidor (opcional)
          try {
        const printResult = await this.printerService.printNFCe(nfcePrintData, sale.companyId, computerId, clientTimeInfo);
            if (!printResult.success) {
              // Não falha se a impressão no servidor falhar, apenas registra
              const errorMessage = printResult.details?.reason || printResult.error || 'Erro ao reimprimir NFC-e no servidor';
              this.logger.warn(`Aviso ao reimprimir NFC-e no servidor para venda ${sale.id}: ${errorMessage}`);
            } else {
              this.logger.log(`✅ NFCe reimpressa no servidor para venda: ${sale.id}`);
            }
          } catch (printError) {
            // Não falha se a impressão no servidor falhar, apenas registra
            this.logger.warn('Erro ao reimprimir NFC-e no servidor (continuando):', printError);
          }

          this.logger.log(`✅ Conteúdo de impressão gerado para reprint da venda: ${sale.id}`);
          return { 
            message: 'NFC-e reimpresso com sucesso',
            printContent: printContent || undefined,
            printType: 'nfce',
          };
      }
    } catch (error) {
      // Se já é BadRequestException (erro detalhado de impressão), apenas propaga
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Caso contrário, cria uma mensagem genérica
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Error reprinting NFCe:', error);
      throw new BadRequestException(`Erro ao reimprimir NFC-e: ${errorMessage}`);
    }
  }

  /**
   * Gera conteúdo de impressão para venda (para impressão local no cliente)
   */
  async getPrintContent(
    id: string,
    companyId?: string,
    clientTimeInfo?: ClientTimeInfo,
  ): Promise<{ content: string; isMock: boolean }> {
    // Buscar venda com todas as relações necessárias
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        paymentMethods: true,
        seller: true,
        company: true,
      },
    });

    if (!sale) {
      throw new BadRequestException('Venda não encontrada');
    }

    if (companyId && sale.companyId !== companyId) {
      throw new BadRequestException('Venda não pertence à empresa');
    }
    
    try {
      // Buscar documento fiscal associado à venda
      const fiscalDocument = await this.prisma.fiscalDocument.findFirst({
        where: {
          companyId: sale.companyId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Verificar se a empresa tem configuração fiscal válida
      const hasValidFiscalConfig = await this.fiscalService.hasValidFiscalConfig(sale.companyId);
      
      // Se não houver documento fiscal ou não tiver configuração válida, gerar cupom não fiscal
      if (!fiscalDocument || !hasValidFiscalConfig) {
        const receiptData: any = {
          company: {
            name: sale.company.name,
            cnpj: sale.company.cnpj || '',
            address: `${sale.company.street || ''}, ${sale.company.number || ''} - ${sale.company.district || ''}`,
          },
          sale: {
            id: sale.id,
            date: sale.saleDate,
            total: Number(sale.total),
            paymentMethods: sale.paymentMethods.map(pm => pm.method),
            change: Number(sale.change),
          },
          items: sale.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
          })),
          seller: {
            name: sale.seller.name,
          },
          client: sale.clientName || sale.clientCpfCnpj ? {
            name: sale.clientName || undefined,
            cpfCnpj: sale.clientCpfCnpj || undefined,
          } : undefined,
          metadata: {
            clientTimeInfo,
          },
        };

        const content = await this.printerService.getNFCeContent({
          company: receiptData.company,
          fiscal: { status: 'MOCK', documentNumber: '', accessKey: '', emissionDate: new Date(), isMock: true },
          sale: {
            id: receiptData.sale.id,
            total: receiptData.sale.total,
            clientName: receiptData.client?.name,
            clientCpfCnpj: receiptData.client?.cpfCnpj,
            paymentMethod: receiptData.sale.paymentMethods,
            change: receiptData.sale.change,
            saleDate: receiptData.sale.date,
            sellerName: receiptData.seller.name,
          },
          items: receiptData.items.map((item: any) => ({
            productName: item.name,
            barcode: '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
          metadata: {
            clientTimeInfo,
          },
        }, clientTimeInfo);
        
        return { content, isMock: true };
      }

      // Verificar se é mock
      const isMocked = fiscalDocument.status === 'MOCK' || (fiscalDocument as any).isMock === true;

      // Gerar conteúdo com documento fiscal existente
      const nfcePrintData = {
        company: {
          name: sale.company.name,
          cnpj: sale.company.cnpj,
          inscricaoEstadual: sale.company.stateRegistration,
          address: `${sale.company.street || ''}, ${sale.company.number || ''} - ${sale.company.district || ''}`,
          phone: sale.company.phone,
          email: sale.company.email,
        },
        fiscal: {
          documentNumber: fiscalDocument.documentNumber,
          accessKey: fiscalDocument.accessKey,
          emissionDate: fiscalDocument.emissionDate || new Date(),
          status: fiscalDocument.status,
          protocol: fiscalDocument.protocol || undefined,
          qrCodeUrl: fiscalDocument.qrCodeUrl || undefined,
          serieNumber: fiscalDocument.serieNumber || '1',
          isMock: isMocked,
        },
        sale: {
          id: sale.id,
          total: Number(sale.total),
          clientName: sale.clientName,
          clientCpfCnpj: sale.clientCpfCnpj,
          paymentMethod: sale.paymentMethods.map(pm => pm.method),
          change: Number(sale.change),
          saleDate: sale.saleDate,
          sellerName: sale.seller.name,
          totalTaxes: Number(sale.total) * 0.1665,
        },
        items: sale.items.map(item => ({
          productName: item.product.name,
          barcode: item.product.barcode,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          ncm: item.product.ncm || '99999999',
          cfop: item.product.cfop || '5102',
        })),
        customFooter: sale.company.customFooter,
        metadata: {
          clientTimeInfo,
        },
      };

      const content = await this.printerService.getNFCeContent(nfcePrintData, clientTimeInfo);
      return { content, isMock: isMocked };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Error generating print content:', error);
      throw new BadRequestException(`Erro ao gerar conteúdo de impressão: ${errorMessage}`);
    }
  }
}
