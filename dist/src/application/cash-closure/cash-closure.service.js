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
const client_time_util_1 = require("../../shared/utils/client-time.util");
const CASH_CLOSURE_REPORT_INCLUDE = {
    company: {
        select: {
            id: true,
            name: true,
            cnpj: true,
            street: true,
            number: true,
            district: true,
            city: true,
            state: true,
            zipCode: true,
        },
    },
    seller: {
        select: {
            id: true,
            name: true,
        },
    },
    sales: {
        orderBy: {
            saleDate: 'asc',
        },
        include: {
            seller: {
                select: {
                    id: true,
                    name: true,
                },
            },
            paymentMethods: true,
            _count: {
                select: {
                    items: true,
                },
            },
        },
    },
};
let CashClosureService = CashClosureService_1 = class CashClosureService {
    constructor(prisma, printerService) {
        this.prisma = prisma;
        this.printerService = printerService;
        this.logger = new common_1.Logger(CashClosureService_1.name);
    }
    parseClientDate(value, clientTimeInfo) {
        if (value) {
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
            this.logger.warn(`Data inválida recebida do cliente: ${value}`);
        }
        if (clientTimeInfo?.currentDate && !Number.isNaN(clientTimeInfo.currentDate.getTime())) {
            return clientTimeInfo.currentDate;
        }
        return undefined;
    }
    async create(companyId, createCashClosureDto, sellerId, clientTimeInfo) {
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
            const openingDate = this.parseClientDate(createCashClosureDto.openingDate, clientTimeInfo) ?? (0, client_time_util_1.getClientNow)(clientTimeInfo);
            const openingAmount = Number(createCashClosureDto.openingAmount ?? 0);
            const cashClosure = await this.prisma.cashClosure.create({
                data: {
                    openingAmount,
                    openingDate,
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
    async close(companyId, closeCashClosureDto, sellerId, computerId, clientTimeInfo) {
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
                include: CASH_CLOSURE_REPORT_INCLUDE,
            });
            if (!existingClosure) {
                throw new common_1.NotFoundException('Não há fechamento de caixa aberto');
            }
            const existingClosureDetailed = existingClosure;
            const closureSales = await this.fetchSalesForClosure(existingClosureDetailed);
            const totalSales = closureSales.reduce((sum, sale) => sum + Number(sale.total), 0);
            const totalWithdrawals = Number(closeCashClosureDto.withdrawals ?? 0);
            const closingAmount = Number(closeCashClosureDto.closingAmount ?? 0);
            const shouldPrint = closeCashClosureDto.printReport ?? false;
            const closingDate = this.parseClientDate(closeCashClosureDto.closingDate, clientTimeInfo) ?? (0, client_time_util_1.getClientNow)(clientTimeInfo);
            const includeSaleDetails = closeCashClosureDto.includeSaleDetails ?? false;
            const updatedClosure = await this.prisma.cashClosure.update({
                where: { id: existingClosure.id },
                data: {
                    closingDate,
                    totalSales,
                    totalWithdrawals,
                    closingAmount,
                    isClosed: true,
                },
                include: CASH_CLOSURE_REPORT_INCLUDE,
            });
            const reportData = await this.buildCashClosureReportData(updatedClosure, {
                includeSaleDetails,
                clientTimeInfo,
            });
            const reportContent = this.printerService.generateCashClosureReportContent(reportData, clientTimeInfo);
            let printResult = null;
            if (shouldPrint) {
                try {
                    printResult = await this.printerService.printCashClosureReport(reportData, companyId, computerId, reportContent, clientTimeInfo);
                    if (!printResult.success) {
                        this.logger.warn(`Falha ao imprimir relatório de fechamento ${updatedClosure.id}: ${printResult.error}`);
                    }
                }
                catch (printError) {
                    this.logger.warn(`Erro ao tentar imprimir relatório de fechamento ${updatedClosure.id}:`, printError);
                    printResult = {
                        success: false,
                        error: printError instanceof Error ? printError.message : String(printError),
                    };
                }
            }
            const summary = this.buildClosureSummary(updatedClosure, reportData);
            const diff = reportData.closure.difference;
            const diffLabel = Math.abs(diff) < 0.01 ? 'sem diferença' : diff > 0 ? 'sobra' : 'falta';
            this.logger.log(`Fechamento ${updatedClosure.id} concluído para empresa ${companyId} (${diffLabel}: ${diff.toFixed(2)})`);
            return {
                ...summary,
                closure: summary,
                reportData,
                reportContent,
                printRequested: shouldPrint,
                printResult,
            };
        }
        catch (error) {
            this.logger.error('Erro ao fechar caixa:', error);
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
        let sales = await this.prisma.sale.findMany({
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
        if (sales.length === 0) {
            sales = await this.prisma.sale.findMany({
                where: {
                    companyId,
                    ...(targetSellerId ? { sellerId: targetSellerId } : {}),
                    saleDate: {
                        gte: currentClosure.openingDate,
                    },
                },
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
        }
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
        const [closuresRaw, total] = await Promise.all([
            this.prisma.cashClosure.findMany({
                where: {
                    companyId,
                    isClosed: true,
                },
                include: CASH_CLOSURE_REPORT_INCLUDE,
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
        const closures = await Promise.all(closuresRaw.map(async (closure) => {
            const detailedClosure = closure;
            const reportData = await this.buildCashClosureReportData(detailedClosure, { includeSaleDetails: false });
            const summary = this.buildClosureSummary(detailedClosure, reportData);
            return {
                ...summary,
                reportData,
            };
        }));
        return {
            closures,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async reprintReport(id, companyId, computerId, includeSaleDetails = false, clientTimeInfo) {
        try {
            const closure = await this.loadClosureWithDetails(id, companyId);
            if (!closure.isClosed) {
                throw new common_1.BadRequestException('Não é possível imprimir relatório de fechamento em aberto');
            }
            const reportData = await this.buildCashClosureReportData(closure, { includeSaleDetails, clientTimeInfo });
            const reportContent = this.printerService.generateCashClosureReportContent(reportData, clientTimeInfo);
            const printResult = await this.printerService.printCashClosureReport(reportData, closure.companyId, computerId, reportContent, clientTimeInfo);
            if (!printResult.success) {
                this.logger.warn(`Falha ao reimprimir relatório do fechamento ${closure.id}: ${printResult.error}`);
            }
            const summary = this.buildClosureSummary(closure, reportData);
            return {
                closureId: closure.id,
                ...summary,
                closure: summary,
                reportData,
                reportContent,
                printResult,
            };
        }
        catch (error) {
            this.logger.error(`Erro ao reimprimir relatório do fechamento ${id}:`, error);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao reimprimir relatório');
        }
    }
    async getReportContent(id, companyId, includeSaleDetails = false, clientTimeInfo) {
        const closure = await this.loadClosureWithDetails(id, companyId);
        if (!closure.isClosed) {
            throw new common_1.BadRequestException('O relatório completo só fica disponível após o fechamento do caixa');
        }
        const reportData = await this.buildCashClosureReportData(closure, { includeSaleDetails, clientTimeInfo });
        const reportContent = this.printerService.generateCashClosureReportContent(reportData, clientTimeInfo);
        const summary = this.buildClosureSummary(closure, reportData);
        return {
            closureId: closure.id,
            ...summary,
            closure: summary,
            reportData,
            reportContent,
        };
    }
    async loadClosureWithDetails(id, companyId) {
        const closure = await this.prisma.cashClosure.findFirst({
            where: {
                id,
                ...(companyId ? { companyId } : {}),
            },
            include: CASH_CLOSURE_REPORT_INCLUDE,
        });
        if (!closure) {
            throw new common_1.NotFoundException('Fechamento de caixa não encontrado');
        }
        return closure;
    }
    async fetchSalesForClosure(closure) {
        const baseInclude = {
            seller: {
                select: {
                    id: true,
                    name: true,
                },
            },
            paymentMethods: true,
        };
        const relationSales = await this.prisma.sale.findMany({
            where: {
                companyId: closure.companyId,
                cashClosureId: closure.id,
                ...(closure.sellerId ? { sellerId: closure.sellerId } : {}),
            },
            include: baseInclude,
            orderBy: {
                saleDate: 'asc',
            },
        });
        if (relationSales.length > 0) {
            return relationSales;
        }
        const periodEnd = closure.closingDate ?? new Date();
        return this.prisma.sale.findMany({
            where: {
                companyId: closure.companyId,
                ...(closure.sellerId ? { sellerId: closure.sellerId } : {}),
                saleDate: {
                    gte: closure.openingDate,
                    lte: periodEnd,
                },
            },
            include: baseInclude,
            orderBy: {
                saleDate: 'asc',
            },
        });
    }
    buildCompanyAddress(company) {
        const street = [company.street, company.number].filter(Boolean).join(', ');
        const district = company.district;
        const cityState = company.city && company.state ? `${company.city}/${company.state}` : company.city || company.state;
        const zip = company.zipCode ? `CEP: ${company.zipCode}` : undefined;
        const parts = [street, district, cityState, zip].filter((part) => part && part.trim().length > 0);
        if (!parts.length) {
            return undefined;
        }
        return parts.join(' - ');
    }
    async buildCashClosureReportData(closure, options = {}) {
        const includeSaleDetails = options.includeSaleDetails ?? true;
        const clientTimeInfo = options.clientTimeInfo;
        const sales = await this.fetchSalesForClosure(closure);
        const totalChange = sales.reduce((sum, sale) => sum + Number(sale.change || 0), 0);
        const paymentSummaryMap = new Map();
        const sellersMap = new Map();
        sales.forEach((sale) => {
            sale.paymentMethods.forEach((payment) => {
                const currentTotal = paymentSummaryMap.get(payment.method) || 0;
                paymentSummaryMap.set(payment.method, currentTotal + Number(payment.amount));
            });
            const sellerId = sale.seller?.id || 'sem-vendedor';
            const sellerName = sale.seller?.name || 'Sem Vendedor';
            if (!sellersMap.has(sellerId)) {
                sellersMap.set(sellerId, {
                    id: sellerId,
                    name: sellerName,
                    totalSales: 0,
                    totalChange: 0,
                    sales: [],
                });
            }
            const sellerData = sellersMap.get(sellerId);
            sellerData.totalSales += Number(sale.total);
            sellerData.totalChange += Number(sale.change || 0);
            sellerData.sales.push({
                id: sale.id,
                date: sale.saleDate,
                total: Number(sale.total),
                change: Number(sale.change || 0),
                clientName: sale.clientName,
                paymentMethods: sale.paymentMethods.map((payment) => ({
                    method: payment.method,
                    amount: Number(payment.amount),
                })),
            });
        });
        const paymentSummary = Array.from(paymentSummaryMap.entries())
            .map(([method, total]) => ({ method, total }))
            .sort((a, b) => b.total - a.total);
        const sellers = Array.from(sellersMap.values()).map((seller) => ({
            ...seller,
            sales: (includeSaleDetails
                ? seller.sales.sort((a, b) => a.date.getTime() - b.date.getTime())
                : []),
        })).sort((a, b) => b.totalSales - a.totalSales);
        const totalCashSales = paymentSummary.find((entry) => entry.method === 'cash')?.total || 0;
        const openingAmount = Number(closure.openingAmount || 0);
        const closingAmount = Number(closure.closingAmount || 0);
        const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const totalWithdrawals = Number(closure.totalWithdrawals || 0);
        const expectedClosing = openingAmount + totalCashSales - totalWithdrawals;
        const difference = closingAmount - expectedClosing;
        return {
            company: {
                name: closure.company.name,
                cnpj: closure.company.cnpj,
                address: this.buildCompanyAddress(closure.company),
            },
            closure: {
                id: closure.id,
                openingDate: closure.openingDate,
                closingDate: closure.closingDate ?? (0, client_time_util_1.getClientNow)(clientTimeInfo),
                openingAmount,
                closingAmount,
                totalSales,
                totalWithdrawals,
                totalChange,
                totalCashSales,
                expectedClosing,
                difference,
                salesCount: sales.length,
                seller: closure.seller ? { id: closure.seller.id, name: closure.seller.name } : null,
            },
            paymentSummary,
            sellers,
            includeSaleDetails,
            metadata: clientTimeInfo ? { clientTimeInfo } : undefined,
        };
    }
    buildClosureSummary(closure, reportData) {
        return {
            id: closure.id,
            openingDate: closure.openingDate,
            closingDate: closure.closingDate,
            isClosed: closure.isClosed,
            openingAmount: reportData.closure.openingAmount,
            closingAmount: reportData.closure.closingAmount,
            totalSales: reportData.closure.totalSales,
            totalWithdrawals: reportData.closure.totalWithdrawals,
            totalChange: reportData.closure.totalChange,
            totalCashSales: reportData.closure.totalCashSales,
            expectedClosing: reportData.closure.expectedClosing,
            difference: reportData.closure.difference,
            salesCount: reportData.closure.salesCount,
            seller: reportData.closure.seller,
            includeSaleDetails: reportData.includeSaleDetails,
        };
    }
};
exports.CashClosureService = CashClosureService;
exports.CashClosureService = CashClosureService = CashClosureService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        printer_service_1.PrinterService])
], CashClosureService);
//# sourceMappingURL=cash-closure.service.js.map