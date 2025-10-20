import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getMetrics(user: any): Promise<{
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
    getMetricsSummary(user: any): Promise<{
        totalSales: number;
        salesThisMonth: number;
        salesGrowth: number;
        totalProducts: number;
        lowStockProducts: number;
        totalCustomers: number;
        totalSellers: number;
        pendingBills: number;
        netRevenue: number;
    }>;
    getMetricsTrends(user: any, period?: '7d' | '30d' | '90d'): Promise<{
        salesTrend: any[];
        productsTrend: any[];
        period: "7d" | "30d" | "90d";
        message: string;
    }>;
}
