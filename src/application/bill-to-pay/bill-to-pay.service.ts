import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateBillToPayDto } from './dto/create-bill-to-pay.dto';
import { UpdateBillToPayDto } from './dto/update-bill-to-pay.dto';
import { MarkAsPaidDto } from './dto/mark-as-paid.dto';
import { PlanLimitsService } from '../../shared/services/plan-limits.service';

@Injectable()
export class BillToPayService {
  private readonly logger = new Logger(BillToPayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async create(companyId: string, createBillToPayDto: CreateBillToPayDto) {
    try {
      // Validar limite de contas a pagar do plano
      await this.planLimitsService.validateBillToPayLimit(companyId);
      
      // Converter dueDate de string para Date
      // Se a string estiver no formato YYYY-MM-DD, garantir que seja tratada como UTC
      let dueDate: Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(createBillToPayDto.dueDate)) {
        // Formato YYYY-MM-DD - criar data no meio-dia UTC para evitar problemas de timezone
        const [year, month, day] = createBillToPayDto.dueDate.split('-').map(Number);
        dueDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      } else {
        // Outros formatos - tentar parsear diretamente
        dueDate = new Date(createBillToPayDto.dueDate);
      }
      
      if (isNaN(dueDate.getTime())) {
        throw new BadRequestException('Data de vencimento inválida');
      }
      
      const bill = await this.prisma.billToPay.create({
        data: {
          title: createBillToPayDto.title,
          amount: createBillToPayDto.amount,
          dueDate,
          barcode: createBillToPayDto.barcode,
          paymentInfo: createBillToPayDto.paymentInfo,
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

      this.logger.log(`Bill to pay created: ${bill.id} for company: ${companyId}`);
      return bill;
    } catch (error) {
      this.logger.error('Error creating bill to pay:', error);
      throw error;
    }
  }

  async findAll(companyId?: string, page = 1, limit = 10, isPaid?: boolean, startDate?: string, endDate?: string) {
    const where: any = {};
    
    if (companyId) {
      where.companyId = companyId;
    }

    if (isPaid !== undefined) {
      where.isPaid = isPaid;
    }

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) {
        where.dueDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.dueDate.lte = new Date(endDate);
      }
    }

    const [bills, total] = await Promise.all([
      this.prisma.billToPay.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { isPaid: 'asc' },
          { dueDate: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.billToPay.count({ where }),
    ]);

    return {
      bills,
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

    const bill = await this.prisma.billToPay.findUnique({
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

    if (!bill) {
      throw new NotFoundException('Conta a pagar não encontrada');
    }

    return bill;
  }

  async update(id: string, updateBillToPayDto: UpdateBillToPayDto, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingBill = await this.prisma.billToPay.findUnique({
        where,
      });

      if (!existingBill) {
        throw new NotFoundException('Conta a pagar não encontrada');
      }

      if (existingBill.isPaid) {
        throw new BadRequestException('Não é possível editar conta já paga');
      }

      const bill = await this.prisma.billToPay.update({
        where: { id },
        data: updateBillToPayDto,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`Bill to pay updated: ${bill.id}`);
      return bill;
    } catch (error) {
      this.logger.error('Error updating bill to pay:', error);
      throw error;
    }
  }

  async remove(id: string, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingBill = await this.prisma.billToPay.findUnique({
        where,
      });

      if (!existingBill) {
        throw new NotFoundException('Conta a pagar não encontrada');
      }

      // Removida a restrição de excluir contas pagas
      // Agora é possível excluir qualquer conta, independente do status

      await this.prisma.billToPay.delete({
        where: { id },
      });

      this.logger.log(`Bill to pay deleted: ${id}`);
      return { message: 'Conta a pagar removida com sucesso' };
    } catch (error) {
      this.logger.error('Error deleting bill to pay:', error);
      throw error;
    }
  }

  async markAsPaid(id: string, markAsPaidDto: MarkAsPaidDto, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingBill = await this.prisma.billToPay.findUnique({
        where,
      });

      if (!existingBill) {
        throw new NotFoundException('Conta a pagar não encontrada');
      }

      if (existingBill.isPaid) {
        throw new BadRequestException('Conta já está marcada como paga');
      }

      const bill = await this.prisma.billToPay.update({
        where: { id },
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentInfo: markAsPaidDto.paymentInfo,
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

      this.logger.log(`Bill to pay marked as paid: ${bill.id}`);
      return bill;
    } catch (error) {
      this.logger.error('Error marking bill as paid:', error);
      throw error;
    }
  }

  async getOverdueBills(companyId?: string) {
    const where: any = {
      isPaid: false,
      dueDate: {
        lt: new Date(),
      },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.billToPay.findMany({
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
        dueDate: 'asc',
      },
    });
  }

  async getUpcomingBills(companyId?: string, days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const where: any = {
      isPaid: false,
      dueDate: {
        gte: new Date(),
        lte: futureDate,
      },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.billToPay.findMany({
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
        dueDate: 'asc',
      },
    });
  }

  async getBillStats(companyId?: string) {
    const where = companyId ? { companyId } : {};

    const [totalBills, paidBills, pendingBills, overdueBills, totalPendingAmount, totalPaidAmount] = await Promise.all([
      this.prisma.billToPay.count({ where }),
      this.prisma.billToPay.count({
        where: {
          ...where,
          isPaid: true,
        },
      }),
      this.prisma.billToPay.count({
        where: {
          ...where,
          isPaid: false,
        },
      }),
      this.prisma.billToPay.count({
        where: {
          ...where,
          isPaid: false,
          dueDate: {
            lt: new Date(),
          },
        },
      }),
      this.prisma.billToPay.aggregate({
        where: {
          ...where,
          isPaid: false,
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.billToPay.aggregate({
        where: {
          ...where,
          isPaid: true,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      totalBills,
      paidBills,
      pendingBills,
      overdueBills,
      totalPendingAmount: totalPendingAmount._sum.amount || 0,
      totalPaidAmount: totalPaidAmount._sum.amount || 0,
    };
  }
}
