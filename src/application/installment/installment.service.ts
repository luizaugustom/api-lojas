import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateInstallmentDto } from './dto/create-installment.dto';
import { UpdateInstallmentDto } from './dto/update-installment.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';

@Injectable()
export class InstallmentService {
  private readonly logger = new Logger(InstallmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, createInstallmentDto: CreateInstallmentDto) {
    try {
      // Verificar se a venda existe e pertence à empresa
      const sale = await this.prisma.sale.findFirst({
        where: {
          id: createInstallmentDto.saleId,
          companyId,
        },
      });

      if (!sale) {
        throw new NotFoundException('Venda não encontrada');
      }

      // Verificar se o cliente existe e pertence à empresa
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: createInstallmentDto.customerId,
          companyId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }

      const installment = await this.prisma.installment.create({
        data: {
          installmentNumber: createInstallmentDto.installmentNumber,
          totalInstallments: createInstallmentDto.totalInstallments,
          amount: createInstallmentDto.amount,
          remainingAmount: createInstallmentDto.amount,
          dueDate: createInstallmentDto.dueDate,
          description: createInstallmentDto.description,
          saleId: createInstallmentDto.saleId,
          customerId: createInstallmentDto.customerId,
          companyId,
        },
        include: {
          sale: {
            select: {
              id: true,
              total: true,
              saleDate: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              cpfCnpj: true,
            },
          },
          payments: true,
        },
      });

      this.logger.log(`Installment created: ${installment.id} for company: ${companyId}`);
      return installment;
    } catch (error) {
      this.logger.error('Error creating installment:', error);
      throw error;
    }
  }

  async findAll(companyId?: string, customerId?: string, isPaid?: boolean) {
    const where: any = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (isPaid !== undefined) {
      where.isPaid = isPaid;
    }

    const installments = await this.prisma.installment.findMany({
      where,
      include: {
        sale: {
          select: {
            id: true,
            total: true,
            saleDate: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
            phone: true,
            email: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return installments;
  }

  async findOverdue(companyId?: string, customerId?: string) {
    const where: any = {
      isPaid: false,
      dueDate: {
        lt: new Date(),
      },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const installments = await this.prisma.installment.findMany({
      where,
      include: {
        sale: {
          select: {
            id: true,
            total: true,
            saleDate: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
            phone: true,
            email: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return installments;
  }

  async findOne(id: string, companyId?: string) {
    const where: any = { id };
    if (companyId) {
      where.companyId = companyId;
    }

    const installment = await this.prisma.installment.findFirst({
      where,
      include: {
        sale: {
          select: {
            id: true,
            total: true,
            saleDate: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
            phone: true,
            email: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });

    if (!installment) {
      throw new NotFoundException('Parcela não encontrada');
    }

    return installment;
  }

  async update(id: string, updateInstallmentDto: UpdateInstallmentDto, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingInstallment = await this.prisma.installment.findFirst({
        where,
      });

      if (!existingInstallment) {
        throw new NotFoundException('Parcela não encontrada');
      }

      const installment = await this.prisma.installment.update({
        where: { id },
        data: updateInstallmentDto,
        include: {
          sale: {
            select: {
              id: true,
              total: true,
              saleDate: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              cpfCnpj: true,
            },
          },
          payments: true,
        },
      });

      this.logger.log(`Installment updated: ${installment.id}`);
      return installment;
    } catch (error) {
      this.logger.error('Error updating installment:', error);
      throw error;
    }
  }

  async remove(id: string, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingInstallment = await this.prisma.installment.findFirst({
        where,
      });

      if (!existingInstallment) {
        throw new NotFoundException('Parcela não encontrada');
      }

      await this.prisma.installment.delete({
        where: { id },
      });

      this.logger.log(`Installment deleted: ${id}`);
      return { message: 'Parcela removida com sucesso' };
    } catch (error) {
      this.logger.error('Error deleting installment:', error);
      throw error;
    }
  }

  async payInstallment(id: string, payInstallmentDto: PayInstallmentDto, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const installment = await this.prisma.installment.findFirst({
        where,
      });

      if (!installment) {
        throw new NotFoundException('Parcela não encontrada');
      }

      if (installment.isPaid) {
        throw new BadRequestException('Parcela já foi paga completamente');
      }

      if (payInstallmentDto.amount > installment.remainingAmount.toNumber()) {
        throw new BadRequestException(
          `Valor do pagamento (${payInstallmentDto.amount}) é maior que o valor restante (${installment.remainingAmount})`
        );
      }

      // Criar o registro de pagamento
      const payment = await this.prisma.installmentPayment.create({
        data: {
          amount: payInstallmentDto.amount,
          paymentMethod: payInstallmentDto.paymentMethod,
          notes: payInstallmentDto.notes,
          installmentId: id,
        },
      });

      // Atualizar o valor restante da parcela
      const newRemainingAmount = installment.remainingAmount.toNumber() - payInstallmentDto.amount;
      const isPaid = newRemainingAmount <= 0.01; // Considera pago se restar menos de 1 centavo

      const updatedInstallment = await this.prisma.installment.update({
        where: { id },
        data: {
          remainingAmount: Math.max(0, newRemainingAmount),
          isPaid,
          paidAt: isPaid ? new Date() : undefined,
        },
        include: {
          sale: {
            select: {
              id: true,
              total: true,
              saleDate: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              cpfCnpj: true,
            },
          },
          payments: {
            orderBy: {
              paymentDate: 'desc',
            },
          },
        },
      });

      this.logger.log(`Payment registered for installment ${id}: ${payInstallmentDto.amount}`);

      return {
        installment: updatedInstallment,
        payment,
        message: isPaid 
          ? 'Parcela paga completamente!' 
          : `Pagamento de ${payInstallmentDto.amount} registrado. Restam ${newRemainingAmount.toFixed(2)} a pagar.`,
      };
    } catch (error) {
      this.logger.error('Error paying installment:', error);
      throw error;
    }
  }

  async getCustomerDebtSummary(customerId: string, companyId?: string) {
    const where: any = {
      customerId,
      isPaid: false,
    };

    if (companyId) {
      where.companyId = companyId;
    }

    const installments = await this.prisma.installment.findMany({
      where,
      select: {
        id: true,
        amount: true,
        remainingAmount: true,
        dueDate: true,
        installmentNumber: true,
        totalInstallments: true,
      },
    });

    const totalDebt = installments.reduce((sum, inst) => sum + inst.remainingAmount.toNumber(), 0);
    const overdueInstallments = installments.filter(inst => inst.dueDate < new Date());
    const overdueAmount = overdueInstallments.reduce((sum, inst) => sum + inst.remainingAmount.toNumber(), 0);

    return {
      totalDebt,
      totalInstallments: installments.length,
      overdueInstallments: overdueInstallments.length,
      overdueAmount,
      installments,
    };
  }

  async getCompanyStats(companyId: string) {
    const [totalInstallments, paidInstallments, overdueInstallments] = await Promise.all([
      this.prisma.installment.count({
        where: { companyId },
      }),
      this.prisma.installment.count({
        where: { companyId, isPaid: true },
      }),
      this.prisma.installment.count({
        where: {
          companyId,
          isPaid: false,
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const totalReceivable = await this.prisma.installment.aggregate({
      where: {
        companyId,
        isPaid: false,
      },
      _sum: {
        remainingAmount: true,
      },
    });

    const overdueAmount = await this.prisma.installment.aggregate({
      where: {
        companyId,
        isPaid: false,
        dueDate: { lt: new Date() },
      },
      _sum: {
        remainingAmount: true,
      },
    });

    return {
      totalInstallments,
      paidInstallments,
      pendingInstallments: totalInstallments - paidInstallments,
      overdueInstallments,
      totalReceivable: totalReceivable._sum.remainingAmount?.toNumber() || 0,
      overdueAmount: overdueAmount._sum.remainingAmount?.toNumber() || 0,
    };
  }
}

