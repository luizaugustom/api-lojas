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
var InstallmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
let InstallmentService = InstallmentService_1 = class InstallmentService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(InstallmentService_1.name);
    }
    async create(companyId, createInstallmentDto) {
        try {
            const sale = await this.prisma.sale.findFirst({
                where: {
                    id: createInstallmentDto.saleId,
                    companyId,
                },
            });
            if (!sale) {
                throw new common_1.NotFoundException('Venda não encontrada');
            }
            const customer = await this.prisma.customer.findFirst({
                where: {
                    id: createInstallmentDto.customerId,
                    companyId,
                },
            });
            if (!customer) {
                throw new common_1.NotFoundException('Cliente não encontrado');
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
        }
        catch (error) {
            this.logger.error('Error creating installment:', error);
            throw error;
        }
    }
    async findAll(companyId, customerId, isPaid) {
        const where = {};
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
    async findOverdue(companyId, customerId) {
        const where = {
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
        const installments = await this.prisma.withRetry(async () => {
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
        }, 'InstallmentService.findOverdue');
        return installments;
    }
    async findOne(id, companyId) {
        const where = { id };
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
            throw new common_1.NotFoundException('Parcela não encontrada');
        }
        return installment;
    }
    async update(id, updateInstallmentDto, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const existingInstallment = await this.prisma.installment.findFirst({
                where,
            });
            if (!existingInstallment) {
                throw new common_1.NotFoundException('Parcela não encontrada');
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
        }
        catch (error) {
            this.logger.error('Error updating installment:', error);
            throw error;
        }
    }
    async remove(id, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const existingInstallment = await this.prisma.installment.findFirst({
                where,
            });
            if (!existingInstallment) {
                throw new common_1.NotFoundException('Parcela não encontrada');
            }
            await this.prisma.installment.delete({
                where: { id },
            });
            this.logger.log(`Installment deleted: ${id}`);
            return { message: 'Parcela removida com sucesso' };
        }
        catch (error) {
            this.logger.error('Error deleting installment:', error);
            throw error;
        }
    }
    async payInstallment(id, payInstallmentDto, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const installment = await this.prisma.installment.findFirst({
                where,
            });
            if (!installment) {
                throw new common_1.NotFoundException('Parcela não encontrada');
            }
            if (installment.isPaid) {
                throw new common_1.BadRequestException('Parcela já foi paga completamente');
            }
            if (payInstallmentDto.amount > installment.remainingAmount.toNumber()) {
                throw new common_1.BadRequestException(`Valor do pagamento (${payInstallmentDto.amount}) é maior que o valor restante (${installment.remainingAmount})`);
            }
            const payment = await this.prisma.installmentPayment.create({
                data: {
                    amount: payInstallmentDto.amount,
                    paymentMethod: payInstallmentDto.paymentMethod,
                    notes: payInstallmentDto.notes,
                    installmentId: id,
                },
            });
            const newRemainingAmount = installment.remainingAmount.toNumber() - payInstallmentDto.amount;
            const isPaid = newRemainingAmount <= 0.01;
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
        }
        catch (error) {
            this.logger.error('Error paying installment:', error);
            throw error;
        }
    }
    async getCustomerDebtSummary(customerId, companyId) {
        const where = {
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
    async getCompanyStats(companyId) {
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
};
exports.InstallmentService = InstallmentService;
exports.InstallmentService = InstallmentService = InstallmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InstallmentService);
//# sourceMappingURL=installment.service.js.map