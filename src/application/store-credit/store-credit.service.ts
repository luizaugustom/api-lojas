import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class StoreCreditService {
  private readonly logger = new Logger(StoreCreditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adiciona crédito ao saldo do cliente
   */
  async addCredit(
    companyId: string,
    customerId: string,
    amount: number,
    description?: string,
    exchangeId?: string,
    createdById?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('O valor do crédito deve ser maior que zero.');
    }

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    const balanceBefore = Number(customer.storeCreditBalance);
    const balanceAfter = this.roundCurrency(balanceBefore + amount);

    const transaction = await this.prisma.$transaction(async (tx) => {
      // Atualizar saldo do cliente
      await tx.customer.update({
        where: { id: customerId },
        data: {
          storeCreditBalance: balanceAfter,
        },
      });

      // Criar transação
      const creditTransaction = await tx.storeCreditTransaction.create({
        data: {
          type: 'CREDIT',
          amount: this.roundCurrency(amount),
          balanceBefore,
          balanceAfter,
          description: description || `Crédito adicionado`,
          customerId,
          companyId,
          exchangeId: exchangeId || null,
          createdById: createdById || null,
        },
      });

      return creditTransaction;
    });

    this.logger.log(
      `Crédito adicionado: Cliente ${customerId}, Valor: ${amount}, Saldo anterior: ${balanceBefore}, Saldo novo: ${balanceAfter}`,
    );

    return transaction;
  }

  /**
   * Usa crédito do saldo do cliente
   */
  async useCredit(
    companyId: string,
    customerId: string,
    amount: number,
    description?: string,
    saleId?: string,
    createdById?: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('O valor a usar deve ser maior que zero.');
    }

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    const balanceBefore = Number(customer.storeCreditBalance);
    const amountToUse = this.roundCurrency(amount);

    if (balanceBefore < amountToUse) {
      throw new BadRequestException(
        `Saldo insuficiente. Saldo disponível: ${this.formatCurrency(balanceBefore)}, Valor solicitado: ${this.formatCurrency(amountToUse)}`,
      );
    }

    const balanceAfter = this.roundCurrency(balanceBefore - amountToUse);

    const transaction = await this.prisma.$transaction(async (tx) => {
      // Atualizar saldo do cliente
      await tx.customer.update({
        where: { id: customerId },
        data: {
          storeCreditBalance: balanceAfter,
        },
      });

      // Criar transação
      const debitTransaction = await tx.storeCreditTransaction.create({
        data: {
          type: 'DEBIT',
          amount: amountToUse,
          balanceBefore,
          balanceAfter,
          description: description || `Crédito utilizado`,
          customerId,
          companyId,
          saleId: saleId || null,
          createdById: createdById || null,
        },
      });

      return debitTransaction;
    });

    this.logger.log(
      `Crédito utilizado: Cliente ${customerId}, Valor: ${amountToUse}, Saldo anterior: ${balanceBefore}, Saldo novo: ${balanceAfter}`,
    );

    return transaction;
  }

  /**
   * Consulta o saldo de crédito do cliente
   */
  async getBalance(companyId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
      select: {
        id: true,
        name: true,
        storeCreditBalance: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return {
      customerId: customer.id,
      customerName: customer.name,
      balance: Number(customer.storeCreditBalance),
    };
  }

  /**
   * Lista transações de crédito do cliente
   */
  async getTransactions(
    companyId: string,
    customerId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.storeCreditTransaction.findMany({
        where: {
          customerId,
          companyId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.storeCreditTransaction.count({
        where: {
          customerId,
          companyId,
        },
      }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
        description: t.description,
        createdAt: t.createdAt,
        exchangeId: t.exchangeId,
        saleId: t.saleId,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca cliente por CPF/CNPJ e retorna saldo
   */
  async getBalanceByCpfCnpj(companyId: string, cpfCnpj: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        cpfCnpj,
        companyId,
      },
      select: {
        id: true,
        name: true,
        cpfCnpj: true,
        storeCreditBalance: true,
      },
    });

    if (!customer) {
      return null;
    }

    return {
      customerId: customer.id,
      customerName: customer.name,
      cpfCnpj: customer.cpfCnpj,
      balance: Number(customer.storeCreditBalance),
    };
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}

