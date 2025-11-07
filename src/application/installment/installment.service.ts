import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateInstallmentDto } from './dto/create-installment.dto';
import { UpdateInstallmentDto } from './dto/update-installment.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { BulkPayInstallmentsDto } from './dto/bulk-pay-installments.dto';

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

    // Usar retry automático para evitar erros de conexão
    const installments = await this.prisma.withRetry(
      async () => {
        return await this.prisma.installment.findMany({
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
      },
      'InstallmentService.findOverdue'
    );

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
      const normalizedRemainingAmount = Math.max(0, Math.round(newRemainingAmount * 100) / 100);

      let nextDueDate: Date | undefined;
      if (!isPaid) {
        const now = new Date();
        const referenceDate = installment.dueDate > now ? installment.dueDate : now;
        nextDueDate = new Date(referenceDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      const updatedInstallment = await this.prisma.installment.update({
        where: { id },
        data: {
          remainingAmount: normalizedRemainingAmount,
          isPaid,
          paidAt: isPaid ? new Date() : undefined,
          ...(nextDueDate ? { dueDate: nextDueDate } : {}),
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
          : `Pagamento de ${payInstallmentDto.amount.toFixed(2)} registrado. Restam ${normalizedRemainingAmount.toFixed(2)} a pagar. Novo vencimento em ${updatedInstallment.dueDate.toISOString().split('T')[0]}.`,
      };
    } catch (error) {
      this.logger.error('Error paying installment:', error);
      throw error;
    }
  }

  async payCustomerInstallments(
    customerId: string,
    bulkPayInstallmentsDto: BulkPayInstallmentsDto,
    companyId?: string,
  ) {
    try {
      const { payAll, installments, paymentMethod, notes } = bulkPayInstallmentsDto;

      if (!payAll && (!installments || installments.length === 0)) {
        throw new BadRequestException('Selecione ao menos uma parcela para pagamento.');
      }

      if (!paymentMethod) {
        throw new BadRequestException('Método de pagamento é obrigatório.');
      }

      const baseWhere: any = {
        customerId,
        isPaid: false,
      };

      if (companyId) {
        baseWhere.companyId = companyId;
      }

      let targetInstallments = [];

      if (payAll) {
        targetInstallments = await this.prisma.installment.findMany({
          where: baseWhere,
        });
      } else {
        const installmentIds = installments!.map((item) => item.installmentId);
        targetInstallments = await this.prisma.installment.findMany({
          where: {
            ...baseWhere,
            id: {
              in: installmentIds,
            },
          },
        });

        if (targetInstallments.length === 0) {
          throw new NotFoundException('Nenhuma parcela encontrada para pagamento.');
        }

        if (targetInstallments.length !== installmentIds.length) {
          const foundIds = new Set(targetInstallments.map((inst) => inst.id));
          const missing = installmentIds.filter((id) => !foundIds.has(id));
          throw new NotFoundException(
            `Parcela(s) não encontrada(s) ou já quitada(s): ${missing.join(', ')}`,
          );
        }
      }

      if (targetInstallments.length === 0) {
        throw new BadRequestException('Não há parcelas pendentes para este cliente.');
      }

      const toNumber = (value: any): number => {
        if (value === null || value === undefined) {
          return 0;
        }
        if (typeof value === 'number') {
          return value;
        }
        if (typeof value === 'string') {
          return Number(value);
        }
        if (typeof value === 'object' && typeof value.toNumber === 'function') {
          return value.toNumber();
        }
        return Number(value);
      };

      const detailMap = new Map<string, { amount?: number }>();
      installments?.forEach((item) => {
        detailMap.set(item.installmentId, {
          amount: item.amount,
        });
      });

      const responses: Array<{
        installmentId: string;
        amountPaid: number;
        remainingAmount: number;
        isPaid: boolean;
        dueDate: Date | null;
        message: string;
      }> = [];
      let totalPaid = 0;

      for (const installment of targetInstallments) {
        const remaining = toNumber(installment.remainingAmount);
        if (remaining <= 0) {
          continue;
        }

        const detail = detailMap.get(installment.id);
        const rawAmount = detail?.amount ?? remaining;
        const amountToPay = Math.round(rawAmount * 100) / 100;

        if (amountToPay <= 0) {
          throw new BadRequestException(
            `Valor inválido para pagamento da parcela ${installment.installmentNumber}.`,
          );
        }

        if (amountToPay > remaining + 0.0001) {
          throw new BadRequestException(
            `Valor do pagamento (${amountToPay.toFixed(2)}) é maior que o valor restante (${remaining.toFixed(2)}) da parcela ${installment.installmentNumber}.`,
          );
        }

        const result = await this.payInstallment(
          installment.id,
          {
            amount: amountToPay,
            paymentMethod,
            notes,
          },
          companyId,
        );

        totalPaid += amountToPay;

        responses.push({
          installmentId: result.installment.id,
          amountPaid: toNumber(result.payment.amount),
          remainingAmount: toNumber(result.installment.remainingAmount),
          isPaid: result.installment.isPaid,
          dueDate: result.installment.dueDate ?? null,
          message: result.message,
        });
      }

      const roundedTotal = Math.round(totalPaid * 100) / 100;

      return {
        message: payAll
          ? 'Todas as dívidas do cliente foram processadas com sucesso.'
          : `${responses.length} parcela(s) foram pagas com sucesso.`,
        customerId,
        totalPaid: roundedTotal,
        payments: responses,
      };
    } catch (error) {
      this.logger.error('Error paying multiple installments:', error);
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

