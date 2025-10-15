import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, createCustomerDto: CreateCustomerDto) {
    try {
      const customer = await this.prisma.customer.create({
        data: {
          ...createCustomerDto,
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

      this.logger.log(`Customer created: ${customer.id} for company: ${companyId}`);
      return customer;
    } catch (error) {
      this.logger.error('Error creating customer:', error);
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
        { cpfCnpj: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
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
      this.prisma.customer.count({ where }),
    ]);

    return {
      customers,
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

    const customer = await this.prisma.customer.findUnique({
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

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }

  async findByCpfCnpj(cpfCnpj: string, companyId?: string) {
    const where: any = { cpfCnpj };
    if (companyId) {
      where.companyId = companyId;
    }

    const customer = await this.prisma.customer.findFirst({
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

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingCustomer = await this.prisma.customer.findUnique({
        where,
      });

      if (!existingCustomer) {
        throw new NotFoundException('Cliente não encontrado');
      }

      const customer = await this.prisma.customer.update({
        where: { id },
        data: updateCustomerDto,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(`Customer updated: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error('Error updating customer:', error);
      throw error;
    }
  }

  async remove(id: string, companyId?: string) {
    try {
      const where: any = { id };
      if (companyId) {
        where.companyId = companyId;
      }

      const existingCustomer = await this.prisma.customer.findUnique({
        where,
      });

      if (!existingCustomer) {
        throw new NotFoundException('Cliente não encontrado');
      }

      await this.prisma.customer.delete({
        where: { id },
      });

      this.logger.log(`Customer deleted: ${id}`);
      return { message: 'Cliente removido com sucesso' };
    } catch (error) {
      this.logger.error('Error deleting customer:', error);
      throw error;
    }
  }

  async getCustomerStats(companyId?: string) {
    const where = companyId ? { companyId } : {};

    const [totalCustomers, customersWithCpf, customersWithCnpj] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.count({
        where: {
          ...where,
          cpfCnpj: {
            not: null,
          },
        },
      }),
      this.prisma.customer.count({
        where: {
          ...where,
          cpfCnpj: {
            not: null,
          },
        },
      }),
    ]);

    return {
      totalCustomers,
      customersWithCpf,
      customersWithCnpj,
    };
  }

  async getCustomerInstallments(customerId: string, companyId?: string) {
    const where: any = { 
      clientCpfCnpj: customerId,
      isInstallment: true,
    };
    
    if (companyId) {
      where.companyId = companyId;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
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
    });

    return sales;
  }
}
