import { PrismaService } from '../../infrastructure/database/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getCompanyMetrics(companyId: string): Promise<{
        company: {
            id: string;
            name: string;
            isActive: true;
        };
        counts: {
            products: number;
            customers: number;
            sellers: number;
            sales: number;
            billsToPay: number;
            fiscalDocuments: number;
            closedCashClosures: number;
        };
        financial: {
            totalSalesValue: number;
            pendingBillsValue: number;
            paidBillsValue: number;
            stockValue: number;
            totalCostOfSales: number;
            totalLossesValue: number;
            billsToPayThisMonth: number;
            netProfit: number;
            netRevenue: number;
        };
        sales: {
            thisMonth: {
                count: number;
                value: number;
                averageTicket: number;
            };
            lastMonth: {
                count: number;
                value: number;
            };
            total: {
                count: number;
                value: number;
                averageTicket: number;
            };
            growth: {
                countPercentage: number;
                valuePercentage: number;
            };
        };
        products: {
            total: number;
            lowStock: number;
            expiring: number;
            stockValue: number;
            lowStockPercentage: number;
            expiringPercentage: number;
        };
        cash: {
            currentClosure: {
                id: string;
                openingDate: Date;
                openingAmount: number;
                totalSales: number;
                isClosed: boolean;
            };
            closedClosures: number;
        };
        fiscal: {
            totalDocuments: number;
            documentsThisMonth: number;
            documentsGrowth: number;
        };
        rankings: {
            topSellers: {
                id: string;
                name: string;
                salesCount: number;
                totalValue: number;
            }[];
            topProducts: {
                id: string;
                name: string;
                barcode: string;
                salesCount: number;
                totalValue: number;
                stockQuantity: number;
            }[];
        };
        metadata: {
            generatedAt: string;
            period: {
                thisMonth: {
                    start: string;
                    end: string;
                    label: string;
                };
                lastMonth: {
                    start: string;
                    end: string;
                    label: string;
                };
            };
        };
    }>;
    private getSalesThisMonth;
    private getSalesValueThisMonth;
    private getSalesLastMonth;
    private getSalesValueLastMonth;
    private getFiscalDocumentsThisMonth;
    private getTopSellers;
    private getTopProducts;
    private calculateGrowthPercentage;
    private getMonthPeriod;
    private getLastMonthPeriod;
    private getTotalCostOfSales;
    private getTotalLosses;
    private getTotalLossesValue;
    private getBillsToPayThisMonth;
}
