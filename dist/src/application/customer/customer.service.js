"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CustomerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const email_service_1 = require("../../shared/services/email.service");
let CustomerService = CustomerService_1 = class CustomerService {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.logger = new common_1.Logger(CustomerService_1.name);
    }
    async create(companyId, createCustomerDto) {
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
            if (customer.email) {
                try {
                    await this.emailService.sendWelcomeEmail(customer.email, customer.name, customer.company.name);
                    this.logger.log(`Welcome email sent to customer: ${customer.email}`);
                }
                catch (emailError) {
                    this.logger.error(`Failed to send welcome email to ${customer.email}:`, emailError);
                }
            }
            return customer;
        }
        catch (error) {
            this.logger.error('Error creating customer:', error);
            throw error;
        }
    }
    async findAll(companyId, page = 1, limit = 10, search) {
        const where = {};
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
    async findOne(id, companyId) {
        const where = { id };
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
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        return customer;
    }
    async findByCpfCnpj(cpfCnpj, companyId) {
        const where = { cpfCnpj };
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
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        return customer;
    }
    async update(id, updateCustomerDto, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const existingCustomer = await this.prisma.customer.findUnique({
                where,
            });
            if (!existingCustomer) {
                throw new common_1.NotFoundException('Cliente não encontrado');
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
        }
        catch (error) {
            this.logger.error('Error updating customer:', error);
            throw error;
        }
    }
    async remove(id, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const existingCustomer = await this.prisma.customer.findUnique({
                where,
            });
            if (!existingCustomer) {
                throw new common_1.NotFoundException('Cliente não encontrado');
            }
            await this.prisma.customer.delete({
                where: { id },
            });
            this.logger.log(`Customer deleted: ${id}`);
            return { message: 'Cliente removido com sucesso' };
        }
        catch (error) {
            this.logger.error('Error deleting customer:', error);
            throw error;
        }
    }
    async getCustomerStats(companyId) {
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
    async getCustomerInstallments(customerId, companyId) {
        const where = {
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
    async sendPromotionalEmail(customerId, promotionData) {
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
                throw new common_1.NotFoundException('Cliente não encontrado');
            }
            if (!customer.email) {
                this.logger.warn(`Customer ${customerId} does not have email address`);
                return false;
            }
            const success = await this.emailService.sendPromotionalEmail(customer.email, customer.name, promotionData, customer.company.name);
            if (success) {
                this.logger.log(`Promotional email sent to customer: ${customer.email}`);
            }
            return success;
        }
        catch (error) {
            this.logger.error(`Error sending promotional email to customer ${customerId}:`, error);
            return false;
        }
    }
    async sendSaleConfirmationEmail(customerId, saleId) {
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
                throw new common_1.NotFoundException('Cliente não encontrado');
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
                throw new common_1.NotFoundException('Venda não encontrada');
            }
            const success = await this.emailService.sendSaleConfirmationEmail(customer.email, customer.name, sale, customer.company.name);
            if (success) {
                this.logger.log(`Sale confirmation email sent to customer: ${customer.email}`);
            }
            return success;
        }
        catch (error) {
            this.logger.error(`Error sending sale confirmation email to customer ${customerId}:`, error);
            return false;
        }
    }
    async sendBulkPromotionalEmail(companyId, promotionData) {
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
                    const success = await this.emailService.sendPromotionalEmail(customer.email, customer.name, promotionData, customer.company.name);
                    if (success) {
                        sent++;
                        this.logger.log(`Promotional email sent to customer: ${customer.email}`);
                    }
                    else {
                        failed++;
                    }
                }
                catch (error) {
                    failed++;
                    this.logger.error(`Failed to send promotional email to ${customer.email}:`, error);
                }
            }
            this.logger.log(`Bulk promotional email completed. Sent: ${sent}, Failed: ${failed}`);
            return { sent, failed };
        }
        catch (error) {
            this.logger.error(`Error sending bulk promotional email for company ${companyId}:`, error);
            return { sent: 0, failed: 0 };
        }
    }
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = CustomerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], CustomerService);
//# sourceMappingURL=customer.service.js.map