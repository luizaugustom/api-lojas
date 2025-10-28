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
var CashClosureService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashClosureService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const printer_service_1 = require("../printer/printer.service");
let CashClosureService = CashClosureService_1 = class CashClosureService {
    constructor(prisma, printerService) {
        this.prisma = prisma;
        this.printerService = printerService;
        this.logger = new common_1.Logger(CashClosureService_1.name);
    }
    async create(companyId, createCashClosureDto, sellerId) {
        try {
            let targetSellerId = null;
            if (sellerId) {
                const seller = await this.prisma.seller.findUnique({
                    where: { id: sellerId },
                    select: { hasIndividualCash: true },
                });
                if (seller?.hasIndividualCash) {
                    targetSellerId = sellerId;
                }
            }
            const existingOpenClosure = await this.prisma.cashClosure.findFirst({
                where: {
                    companyId,
                    isClosed: false,
                    sellerId: targetSellerId,
                },
            });
            if (existingOpenClosure) {
                const msg = targetSellerId
                    ? 'Você já tem um fechamento de caixa aberto'
                    : 'Já existe um fechamento de caixa compartilhado aberto';
                throw new common_1.BadRequestException(msg);
            }
            const cashClosure = await this.prisma.cashClosure.create({
                data: {
                    ...createCashClosureDto,
                    companyId,
                    sellerId: targetSellerId,
                },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    seller: targetSellerId ? {
                        select: {
                            id: true,
                            name: true,
                        },
                    } : undefined,
                },
            });
            const logMsg = targetSellerId
                ? `Individual cash closure created: ${cashClosure.id} for seller: ${targetSellerId}`
                : `Shared cash closure created: ${cashClosure.id} for company: ${companyId}`;
            this.logger.log(logMsg);
            return cashClosure;
        }
        catch (error) {
            this.logger.error('Error creating cash closure:', error);
            throw error;
        }
    }
    async findAll(companyId, page = 1, limit = 10, isClosed) {
        const where = {};
        if (companyId) {
            where.companyId = companyId;
        }
        if (isClosed !== undefined) {
            where.isClosed = isClosed;
        }
        const [closures, total] = await Promise.all([
            this.prisma.cashClosure.findMany({
                where,
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    _count: {
                        select: {
                            sales: true,
                        },
                    },
                },
                orderBy: {
                    openingDate: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.cashClosure.count({ where }),
        ]);
        return {
            closures,
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
        const closure = await this.prisma.cashClosure.findUnique({
            where,
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                sales: {
                    include: {
                        seller: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
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
                    },
                },
                _count: {
                    select: {
                        sales: true,
                    },
                },
            },
        });
        if (!closure) {
            throw new common_1.NotFoundException('Fechamento de caixa não encontrado');
        }
        return closure;
    }
    async getCurrentClosure(companyId, sellerId) {
        let targetSellerId = null;
        if (sellerId) {
            const seller = await this.prisma.seller.findUnique({
                where: { id: sellerId },
                select: { hasIndividualCash: true },
            });
            if (seller?.hasIndividualCash) {
                targetSellerId = sellerId;
            }
        }
        const closure = await this.prisma.cashClosure.findFirst({
            where: {
                companyId,
                isClosed: false,
                sellerId: targetSellerId,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                seller: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                sales: {
                    include: {
                        seller: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        sales: true,
                    },
                },
            },
        });
        if (!closure) {
            throw new common_1.NotFoundException('Não há fechamento de caixa aberto');
        }
        return closure;
    }
    async close(companyId, closeCashClosureDto, sellerId) {
        try {
            let targetSellerId = null;
            if (sellerId) {
                const seller = await this.prisma.seller.findUnique({
                    where: { id: sellerId },
                    select: { hasIndividualCash: true },
                });
                if (seller?.hasIndividualCash) {
                    targetSellerId = sellerId;
                }
            }
            const existingClosure = await this.prisma.cashClosure.findFirst({
                where: {
                    companyId,
                    isClosed: false,
                    sellerId: targetSellerId,
                },
                include: {
                    sales: true,
                },
            });
            if (!existingClosure) {
                throw new common_1.NotFoundException('Não há fechamento de caixa aberto');
            }
            const totalSales = existingClosure.sales.reduce((sum, sale) => sum + Number(sale.total), 0);
            const totalWithdrawals = closeCashClosureDto.withdrawals || 0;
            const closingAmount = closeCashClosureDto.closingAmount || 0;
            const closure = await this.prisma.cashClosure.update({
                where: { id: existingClosure.id },
                data: {
                    closingDate: new Date(),
                    totalSales,
                    totalWithdrawals,
                    closingAmount,
                    isClosed: true,
                },
                include: {
                    company: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    seller: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    sales: {
                        include: {
                            seller: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });
            try {
            }
            catch (printError) {
                this.logger.warn('Failed to print cash closure report:', printError);
            }
            this.logger.log(`Cash closure closed: ${closure.id} for company: ${companyId}`);
            return closure;
        }
        catch (error) {
            this.logger.error('Error closing cash closure:', error);
            throw error;
        }
    }
    async getCashClosureStats(companyId, sellerId) {
        let targetSellerId = null;
        if (sellerId) {
            const seller = await this.prisma.seller.findUnique({
                where: { id: sellerId },
                select: { hasIndividualCash: true },
            });
            if (seller?.hasIndividualCash) {
                targetSellerId = sellerId;
            }
        }
        const currentClosure = await this.prisma.cashClosure.findFirst({
            where: {
                companyId,
                isClosed: false,
                sellerId: targetSellerId,
            },
        });
        if (!currentClosure) {
            return {
                hasOpenClosure: false,
                message: 'Não há fechamento de caixa aberto',
            };
        }
        const salesWhere = {
            companyId,
            cashClosureId: currentClosure.id,
        };
        const sales = await this.prisma.sale.findMany({
            where: salesWhere,
            include: {
                paymentMethods: true,
                seller: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const salesByPaymentMethod = sales.reduce((acc, sale) => {
            sale.paymentMethods.forEach(paymentMethod => {
                const method = paymentMethod.method;
                acc[method] = (acc[method] || 0) + Number(paymentMethod.amount);
            });
            return acc;
        }, {});
        const totalCashSales = salesByPaymentMethod['cash'] || 0;
        const salesBySeller = sales.reduce((acc, sale) => {
            const sellerName = sale.seller.name;
            acc[sellerName] = (acc[sellerName] || 0) + Number(sale.total);
            return acc;
        }, {});
        return {
            hasOpenClosure: true,
            openingDate: currentClosure.openingDate,
            openingAmount: Number(currentClosure.openingAmount),
            totalSales,
            totalCashSales,
            salesCount: sales.length,
            salesByPaymentMethod,
            salesBySeller,
            isIndividualCash: !!targetSellerId,
        };
    }
    async getClosureHistory(companyId, page = 1, limit = 10) {
        const [closures, total] = await Promise.all([
            this.prisma.cashClosure.findMany({
                where: {
                    companyId,
                    isClosed: true,
                },
                include: {
                    _count: {
                        select: {
                            sales: true,
                        },
                    },
                },
                orderBy: {
                    closingDate: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.cashClosure.count({
                where: {
                    companyId,
                    isClosed: true,
                },
            }),
        ]);
        return {
            closures,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async reprintReport(id, companyId) {
        const closure = await this.findOne(id, companyId);
        if (!closure.isClosed) {
            throw new common_1.BadRequestException('Não é possível imprimir relatório de fechamento em aberto');
        }
        try {
            return { message: 'Relatório reimpresso com sucesso' };
        }
        catch (error) {
            this.logger.error('Error reprinting cash closure report:', error);
            throw new common_1.BadRequestException('Erro ao reimprimir relatório');
        }
    }
};
exports.CashClosureService = CashClosureService;
exports.CashClosureService = CashClosureService = CashClosureService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        printer_service_1.PrinterService])
], CashClosureService);
//# sourceMappingURL=cash-closure.service.js.map