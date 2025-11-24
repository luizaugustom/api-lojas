import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EmailService } from '../../shared/services/email.service';
import { PlanLimitsService } from '../../shared/services/plan-limits.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ClientTimeInfo } from '../../shared/utils/client-time.util';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async create(companyId: string, createCustomerDto: CreateCustomerDto) {
    try {
      // Validar limite de clientes do plano
      await this.planLimitsService.validateCustomerLimit(companyId);

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

      // Enviar email de boas-vindas se o cliente tiver email
      if (customer.email) {
        try {
          await this.emailService.sendWelcomeEmail(
            customer.email,
            customer.name,
            customer.company.name
          );
          this.logger.log(`Welcome email sent to customer: ${customer.email}`);
        } catch (emailError) {
          this.logger.error(`Failed to send welcome email to ${customer.email}:`, emailError);
          // Não falha a criação do cliente se o email falhar
        }
      }

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
      customerId: customerId,
    };
    
    if (companyId) {
      where.companyId = companyId;
    }

    const installments = await this.prisma.installment.findMany({
      where,
      include: {
        sale: {
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

    return { data: installments };
  }

  async sendPromotionalEmail(
    customerId: string,
    promotionData: any,
    clientTimeInfo?: ClientTimeInfo,
  ): Promise<boolean> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }

      if (!customer.email) {
        this.logger.warn(`Customer ${customerId} does not have email address`);
        return false;
      }

      const success = await this.emailService.sendPromotionalEmail(
        customer.email,
        customer.name,
        promotionData,
        customer.company.name,
        clientTimeInfo,
      );

      if (success) {
        this.logger.log(`Promotional email sent to customer: ${customer.email}`);
      }

      return success;
    } catch (error) {
      this.logger.error(`Error sending promotional email to customer ${customerId}:`, error);
      return false;
    }
  }

  async sendSaleConfirmationEmail(
    customerId: string,
    saleId: string,
    clientTimeInfo?: ClientTimeInfo,
  ): Promise<boolean> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }

      if (!customer.email) {
        this.logger.warn(`Customer ${customerId} does not have email address`);
        return false;
      }

      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!sale) {
        throw new NotFoundException('Venda não encontrada');
      }

      const success = await this.emailService.sendSaleConfirmationEmail(
        customer.email,
        customer.name,
        sale,
        customer.company.name,
        clientTimeInfo,
      );

      if (success) {
        this.logger.log(`Sale confirmation email sent to customer: ${customer.email}`);
      }

      return success;
    } catch (error) {
      this.logger.error(`Error sending sale confirmation email to customer ${customerId}:`, error);
      return false;
    }
  }

  async sendBulkPromotionalEmail(
    companyId: string,
    promotionData: any,
    clientTimeInfo?: ClientTimeInfo,
  ): Promise<{ sent: number; failed: number }> {
    try {
      const customers = await this.prisma.customer.findMany({
        where: {
          companyId,
          email: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      let sent = 0;
      let failed = 0;

      for (const customer of customers) {
        try {
          const success = await this.emailService.sendPromotionalEmail(
            customer.email!,
            customer.name,
            promotionData,
            customer.company.name,
            clientTimeInfo,
          );

          if (success) {
            sent++;
            this.logger.log(`Promotional email sent to customer: ${customer.email}`);
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
          this.logger.error(`Failed to send promotional email to ${customer.email}:`, error);
        }
      }

      this.logger.log(`Bulk promotional email completed. Sent: ${sent}, Failed: ${failed}`);
      return { sent, failed };
    } catch (error) {
      this.logger.error(`Error sending bulk promotional email for company ${companyId}:`, error);
      return { sent: 0, failed: 0 };
    }
  }
}
