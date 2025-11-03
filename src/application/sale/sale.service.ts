import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ProductService } from '../product/product.service';
import { PrinterService } from '../printer/printer.service';
import { FiscalService, NFCeData } from '../fiscal/fiscal.service';
import { EmailService } from '../../shared/services/email.service';
import { IBPTService } from '../../shared/services/ibpt.service';
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
    private readonly ibptService: IBPTService,
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
            firstDueDate = new Date();
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
          };

          const printResult = await this.printerService.printNonFiscalReceipt(receiptData, companyId, true);
          
          if (!printResult.success) {
            this.logger.warn(`⚠️ Falha na impressão do cupom não fiscal para venda: ${completeSale.id}`);
            this.logger.warn(`Erro: ${printResult.error}`);
          } else {
            this.logger.log(`✅ Cupom não fiscal impresso com sucesso para venda: ${completeSale.id}`);
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
            })),
            totalValue: Number(completeSale.total),
            paymentMethod: completeSale.paymentMethods.map(pm => pm.method),
            saleId: completeSale.id,
            sellerName: completeSale.seller.name,
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
          };

          const printResult = await this.printerService.printNFCe(nfcePrintData, companyId);
          
          if (!printResult.success) {
            this.logger.warn(`⚠️ Falha na impressão para venda: ${completeSale.id}`);
            this.logger.warn(`Erro: ${printResult.error}`);
            if (printResult.details?.reason) {
              this.logger.warn(`Detalhes: ${printResult.details.reason}`);
            }
            // Continue with sale even if printing fails, but store the error for response
            throw new BadRequestException(
              printResult.details?.reason || printResult.error || 'Erro ao imprimir NFC-e'
            );
          }
          
          if (isMocked) {
            this.logger.warn(`⚠️ Cupom não fiscal impresso para venda: ${completeSale.id} (empresa sem configuração fiscal)`);
            (completeSale as any).warning = 'Cupom não fiscal emitido. Configure os dados fiscais para emitir NFCe válida.';
          } else {
            this.logger.log(`NFCe printed successfully for sale: ${completeSale.id}`);
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
          };

          const printResult = await this.printerService.printNonFiscalReceipt(receiptData, sale.companyId, true);
          
          if (!printResult.success) {
            this.logger.warn(`⚠️ Falha na reimpressão do cupom não fiscal para venda: ${sale.id}`);
            throw new BadRequestException(printResult.error || 'Erro ao reimprimir cupom não fiscal');
          }
          
          return { 
            message: 'Cupom não fiscal reimpresso com sucesso',
            warning: 'Cupom não fiscal emitido. Configure os dados fiscais para emitir NFCe válida.'
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
          })),
          totalValue: Number(sale.total),
          paymentMethod: sale.paymentMethods.map(pm => pm.method),
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
        };

        const printResult = await this.printerService.printNFCe(nfcePrintData, sale.companyId);
        
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
        };

        const printResult = await this.printerService.printNFCe(nfcePrintData, sale.companyId);
        
        if (!printResult.success) {
          const errorMessage = printResult.details?.reason || printResult.error || 'Erro ao reimprimir NFC-e';
          this.logger.error(`Erro ao reimprimir NFC-e para venda ${sale.id}: ${errorMessage}`);
          throw new BadRequestException(errorMessage);
        }
      }

      this.logger.log(`NFCe reprinted successfully for sale: ${sale.id}`);
      return { message: 'NFC-e reimpresso com sucesso' };
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
  async getPrintContent(id: string, companyId?: string): Promise<{ content: string; isMock: boolean }> {
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
        });
        
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
      };

      const content = await this.printerService.getNFCeContent(nfcePrintData);
      return { content, isMock: isMocked };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Error generating print content:', error);
      throw new BadRequestException(`Erro ao gerar conteúdo de impressão: ${errorMessage}`);
    }
  }
}
