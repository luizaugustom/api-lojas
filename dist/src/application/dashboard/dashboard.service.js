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
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
let DashboardService = DashboardService_1 = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(DashboardService_1.name);
    }
    async getCompanyMetrics(companyId) {
        try {
            this.logger.log(`Getting metrics for company: ${companyId}`);
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                select: { id: true, name: true, isActive: true }
            });
            if (!company) {
                throw new common_1.NotFoundException('Empresa não encontrada');
            }
            if (!company.isActive) {
                throw new common_1.NotFoundException('Empresa inativa');
            }
            const [totalProducts, totalCustomers, totalSellers, totalSales, totalBillsToPay, totalSalesValue, pendingBillsValue, paidBillsValue, salesThisMonth, salesValueThisMonth, salesLastMonth, salesValueLastMonth, lowStockProducts, expiringProducts, totalStockValue, currentCashClosure, closedCashClosures, totalFiscalDocuments, fiscalDocumentsThisMonth, topSellers, topProducts, totalCostOfSales, totalLosses, totalLossesValue, billsToPayThisMonth] = await Promise.all([
                this.prisma.product.count({ where: { companyId } }),
                this.prisma.customer.count({ where: { companyId } }),
                this.prisma.seller.count({ where: { companyId } }),
                this.prisma.sale.count({ where: { companyId } }),
                this.prisma.billToPay.count({ where: { companyId } }),
                this.prisma.sale.aggregate({
                    where: { companyId },
                    _sum: { total: true }
                }),
                this.prisma.billToPay.aggregate({
                    where: { companyId, isPaid: false },
                    _sum: { amount: true }
                }),
                this.prisma.billToPay.aggregate({
                    where: { companyId, isPaid: true },
                    _sum: { amount: true }
                }),
                this.getSalesThisMonth(companyId),
                this.getSalesValueThisMonth(companyId),
                this.getSalesLastMonth(companyId),
                this.getSalesValueLastMonth(companyId),
                this.prisma.product.count({
                    where: { companyId, stockQuantity: { lte: 10 } }
                }),
                this.prisma.product.count({
                    where: {
                        companyId,
                        expirationDate: {
                            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            gte: new Date()
                        }
                    }
                }),
                this.prisma.product.aggregate({
                    where: { companyId },
                    _sum: {
                        stockQuantity: true,
                        price: true
                    }
                }),
                this.prisma.cashClosure.findFirst({
                    where: { companyId, isClosed: false },
                    orderBy: { openingDate: 'desc' }
                }),
                this.prisma.cashClosure.count({
                    where: { companyId, isClosed: true }
                }),
                this.prisma.fiscalDocument.count({ where: { companyId } }),
                this.getFiscalDocumentsThisMonth(companyId),
                this.getTopSellers(companyId),
                this.getTopProducts(companyId),
                this.getTotalCostOfSales(companyId),
                this.getTotalLosses(companyId),
                this.getTotalLossesValue(companyId),
                this.getBillsToPayThisMonth(companyId)
            ]);
            const salesGrowth = this.calculateGrowthPercentage(salesValueThisMonth, salesValueLastMonth);
            const salesCountGrowth = this.calculateGrowthPercentage(salesThisMonth, salesLastMonth);
            const averageTicket = totalSales > 0 ?
                Number(totalSalesValue._sum.total || 0) / totalSales : 0;
            const averageTicketThisMonth = salesThisMonth > 0 ?
                salesValueThisMonth / salesThisMonth : 0;
            const stockValue = Number(totalStockValue._sum.price || 0) *
                Number(totalStockValue._sum.stockQuantity || 0);
            return {
                company: {
                    id: company.id,
                    name: company.name,
                    isActive: company.isActive
                },
                counts: {
                    products: totalProducts,
                    customers: totalCustomers,
                    sellers: totalSellers,
                    sales: totalSales,
                    billsToPay: totalBillsToPay,
                    fiscalDocuments: totalFiscalDocuments,
                    closedCashClosures: closedCashClosures
                },
                financial: {
                    totalSalesValue: Number(totalSalesValue._sum.total || 0),
                    pendingBillsValue: Number(pendingBillsValue._sum.amount || 0),
                    paidBillsValue: Number(paidBillsValue._sum.amount || 0),
                    stockValue: stockValue,
                    totalCostOfSales: totalCostOfSales,
                    totalLossesValue: totalLossesValue,
                    billsToPayThisMonth: billsToPayThisMonth,
                    netProfit: Number(totalSalesValue._sum.total || 0) - totalCostOfSales - billsToPayThisMonth - totalLossesValue,
                    netRevenue: Number(totalSalesValue._sum.total || 0) - Number(paidBillsValue._sum.amount || 0)
                },
                sales: {
                    thisMonth: {
                        count: salesThisMonth,
                        value: salesValueThisMonth,
                        averageTicket: averageTicketThisMonth
                    },
                    lastMonth: {
                        count: salesLastMonth,
                        value: salesValueLastMonth
                    },
                    total: {
                        count: totalSales,
                        value: Number(totalSalesValue._sum.total || 0),
                        averageTicket: averageTicket
                    },
                    growth: {
                        countPercentage: salesCountGrowth,
                        valuePercentage: salesGrowth
                    }
                },
                products: {
                    total: totalProducts,
                    lowStock: lowStockProducts,
                    expiring: expiringProducts,
                    stockValue: stockValue,
                    lowStockPercentage: totalProducts > 0 ? (lowStockProducts / totalProducts) * 100 : 0,
                    expiringPercentage: totalProducts > 0 ? (expiringProducts / totalProducts) * 100 : 0
                },
                cash: {
                    currentClosure: currentCashClosure ? {
                        id: currentCashClosure.id,
                        openingDate: currentCashClosure.openingDate,
                        openingAmount: Number(currentCashClosure.openingAmount),
                        totalSales: Number(currentCashClosure.totalSales),
                        isClosed: currentCashClosure.isClosed
                    } : null,
                    closedClosures: closedCashClosures
                },
                fiscal: {
                    totalDocuments: totalFiscalDocuments,
                    documentsThisMonth: fiscalDocumentsThisMonth,
                    documentsGrowth: this.calculateGrowthPercentage(fiscalDocumentsThisMonth, totalFiscalDocuments - fiscalDocumentsThisMonth)
                },
                rankings: {
                    topSellers: topSellers,
                    topProducts: topProducts
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    period: {
                        thisMonth: this.getMonthPeriod(),
                        lastMonth: this.getLastMonthPeriod()
                    }
                }
            };
        }
        catch (error) {
            this.logger.error('Error getting company metrics:', error);
            throw error;
        }
    }
    async getSalesThisMonth(companyId) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        return this.prisma.sale.count({
            where: {
                companyId,
                saleDate: { gte: startOfMonth }
            }
        });
    }
    async getSalesValueThisMonth(companyId) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const result = await this.prisma.sale.aggregate({
            where: {
                companyId,
                saleDate: { gte: startOfMonth }
            },
            _sum: { total: true }
        });
        return Number(result._sum.total || 0);
    }
    async getSalesLastMonth(companyId) {
        const startOfLastMonth = new Date();
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        startOfLastMonth.setDate(1);
        startOfLastMonth.setHours(0, 0, 0, 0);
        const endOfLastMonth = new Date();
        endOfLastMonth.setDate(0);
        endOfLastMonth.setHours(23, 59, 59, 999);
        return this.prisma.sale.count({
            where: {
                companyId,
                saleDate: {
                    gte: startOfLastMonth,
                    lte: endOfLastMonth
                }
            }
        });
    }
    async getSalesValueLastMonth(companyId) {
        const startOfLastMonth = new Date();
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        startOfLastMonth.setDate(1);
        startOfLastMonth.setHours(0, 0, 0, 0);
        const endOfLastMonth = new Date();
        endOfLastMonth.setDate(0);
        endOfLastMonth.setHours(23, 59, 59, 999);
        const result = await this.prisma.sale.aggregate({
            where: {
                companyId,
                saleDate: {
                    gte: startOfLastMonth,
                    lte: endOfLastMonth
                }
            },
            _sum: { total: true }
        });
        return Number(result._sum.total || 0);
    }
    async getFiscalDocumentsThisMonth(companyId) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        return this.prisma.fiscalDocument.count({
            where: {
                companyId,
                emissionDate: { gte: startOfMonth }
            }
        });
    }
    async getTopSellers(companyId, limit = 5) {
        const sellers = await this.prisma.seller.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { sales: true }
                },
                sales: {
                    select: {
                        total: true
                    }
                }
            }
        });
        return sellers
            .map(seller => ({
            id: seller.id,
            name: seller.name,
            salesCount: seller._count.sales,
            totalValue: seller.sales.reduce((sum, sale) => sum + Number(sale.total), 0)
        }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, limit);
    }
    async getTopProducts(companyId, limit = 5) {
        const products = await this.prisma.product.findMany({
            where: { companyId },
            include: {
                saleItems: {
                    select: {
                        quantity: true,
                        totalPrice: true
                    }
                }
            }
        });
        return products
            .map(product => ({
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            salesCount: product.saleItems.reduce((sum, item) => sum + item.quantity, 0),
            totalValue: product.saleItems.reduce((sum, item) => sum + Number(item.totalPrice), 0),
            stockQuantity: product.stockQuantity
        }))
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, limit);
    }
    calculateGrowthPercentage(current, previous) {
        if (previous === 0) {
            return current > 0 ? 100 : 0;
        }
        return ((current - previous) / previous) * 100;
    }
    getMonthPeriod() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            start: startOfMonth.toISOString(),
            end: endOfMonth.toISOString(),
            label: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        };
    }
    getLastMonthPeriod() {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
            start: lastMonth.toISOString(),
            end: endOfLastMonth.toISOString(),
            label: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
        };
    }
    async getTotalCostOfSales(companyId) {
        const sales = await this.prisma.sale.findMany({
            where: { companyId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                costPrice: true,
                                price: true,
                            },
                        },
                    },
                },
            },
        });
        let totalCost = 0;
        for (const sale of sales) {
            for (const item of sale.items) {
                const unitCost = item.product.costPrice
                    ? Number(item.product.costPrice)
                    : Number(item.product.price);
                totalCost += unitCost * item.quantity;
            }
        }
        return totalCost;
    }
    async getTotalLosses(companyId) {
        const result = await this.prisma.productLoss.aggregate({
            where: { companyId },
            _sum: { quantity: true },
        });
        return result._sum.quantity || 0;
    }
    async getTotalLossesValue(companyId) {
        const result = await this.prisma.productLoss.aggregate({
            where: { companyId },
            _sum: { totalCost: true },
        });
        return Number(result._sum.totalCost || 0);
    }
    async getBillsToPayThisMonth(companyId) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);
        const result = await this.prisma.billToPay.aggregate({
            where: {
                companyId,
                dueDate: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
                isPaid: false,
            },
            _sum: { amount: true },
        });
        return Number(result._sum.amount || 0);
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map