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
var BillToPayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillToPayService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const plan_limits_service_1 = require("../../shared/services/plan-limits.service");
let BillToPayService = BillToPayService_1 = class BillToPayService {
    constructor(prisma, planLimitsService) {
        this.prisma = prisma;
        this.planLimitsService = planLimitsService;
        this.logger = new common_1.Logger(BillToPayService_1.name);
    }
    async create(companyId, createBillToPayDto) {
        try {
            await this.planLimitsService.validateBillToPayLimit(companyId);
            let dueDate;
            if (/^\d{4}-\d{2}-\d{2}$/.test(createBillToPayDto.dueDate)) {
                const [year, month, day] = createBillToPayDto.dueDate.split('-').map(Number);
                dueDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
            }
            else {
                dueDate = new Date(createBillToPayDto.dueDate);
            }
            if (isNaN(dueDate.getTime())) {
                throw new common_1.BadRequestException('Data de vencimento inválida');
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
        }
        catch (error) {
            this.logger.error('Error creating bill to pay:', error);
            throw error;
        }
    }
    async findAll(companyId, page = 1, limit = 10, isPaid, startDate, endDate) {
        const where = {};
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
    async findOne(id, companyId) {
        const where = { id };
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
            throw new common_1.NotFoundException('Conta a pagar não encontrada');
        }
        return bill;
    }
    async update(id, updateBillToPayDto, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const existingBill = await this.prisma.billToPay.findUnique({
                where,
            });
            if (!existingBill) {
                throw new common_1.NotFoundException('Conta a pagar não encontrada');
            }
            if (existingBill.isPaid) {
                throw new common_1.BadRequestException('Não é possível editar conta já paga');
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
        }
        catch (error) {
            this.logger.error('Error updating bill to pay:', error);
            throw error;
        }
    }
    async remove(id, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const existingBill = await this.prisma.billToPay.findUnique({
                where,
            });
            if (!existingBill) {
                throw new common_1.NotFoundException('Conta a pagar não encontrada');
            }
            await this.prisma.billToPay.delete({
                where: { id },
            });
            this.logger.log(`Bill to pay deleted: ${id}`);
            return { message: 'Conta a pagar removida com sucesso' };
        }
        catch (error) {
            this.logger.error('Error deleting bill to pay:', error);
            throw error;
        }
    }
    async markAsPaid(id, markAsPaidDto, companyId) {
        try {
            const where = { id };
            if (companyId) {
                where.companyId = companyId;
            }
            const existingBill = await this.prisma.billToPay.findUnique({
                where,
            });
            if (!existingBill) {
                throw new common_1.NotFoundException('Conta a pagar não encontrada');
            }
            if (existingBill.isPaid) {
                throw new common_1.BadRequestException('Conta já está marcada como paga');
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
        }
        catch (error) {
            this.logger.error('Error marking bill as paid:', error);
            throw error;
        }
    }
    async getOverdueBills(companyId) {
        const where = {
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
    async getUpcomingBills(companyId, days = 7) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const where = {
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
    async getBillStats(companyId) {
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
};
exports.BillToPayService = BillToPayService;
exports.BillToPayService = BillToPayService = BillToPayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        plan_limits_service_1.PlanLimitsService])
], BillToPayService);
//# sourceMappingURL=bill-to-pay.service.js.map