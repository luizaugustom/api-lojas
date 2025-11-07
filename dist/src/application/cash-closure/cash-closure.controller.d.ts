import { Request } from 'express';
import { CashClosureService } from './cash-closure.service';
import { CreateCashClosureDto } from './dto/create-cash-closure.dto';
import { CloseCashClosureDto } from './dto/close-cash-closure.dto';
export declare class CashClosureController {
    private readonly cashClosureService;
    constructor(cashClosureService: CashClosureService);
    create(user: any, createCashClosureDto: CreateCashClosureDto): Promise<{
        company: {
            id: string;
            name: string;
        };
        seller: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        openingDate: Date;
        closingDate: Date | null;
        openingAmount: import("@prisma/client/runtime/library").Decimal;
        closingAmount: import("@prisma/client/runtime/library").Decimal;
        totalSales: import("@prisma/client/runtime/library").Decimal;
        totalWithdrawals: import("@prisma/client/runtime/library").Decimal;
        isClosed: boolean;
        sellerId: string | null;
    }>;
    findAll(user: any, page?: number, limit?: number, isClosed?: boolean): Promise<{
        closures: ({
            company: {
                id: string;
                name: string;
            };
            _count: {
                sales: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            openingDate: Date;
            closingDate: Date | null;
            openingAmount: import("@prisma/client/runtime/library").Decimal;
            closingAmount: import("@prisma/client/runtime/library").Decimal;
            totalSales: import("@prisma/client/runtime/library").Decimal;
            totalWithdrawals: import("@prisma/client/runtime/library").Decimal;
            isClosed: boolean;
            sellerId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getCurrent(user: any): Promise<{
        sales: ({
            seller: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            sellerId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            change: import("@prisma/client/runtime/library").Decimal;
            clientCpfCnpj: string | null;
            clientName: string | null;
            isInstallment: boolean;
            saleDate: Date;
            cashClosureId: string | null;
        })[];
        company: {
            id: string;
            name: string;
        };
        seller: {
            id: string;
            name: string;
        };
        _count: {
            sales: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        openingDate: Date;
        closingDate: Date | null;
        openingAmount: import("@prisma/client/runtime/library").Decimal;
        closingAmount: import("@prisma/client/runtime/library").Decimal;
        totalSales: import("@prisma/client/runtime/library").Decimal;
        totalWithdrawals: import("@prisma/client/runtime/library").Decimal;
        isClosed: boolean;
        sellerId: string | null;
    }>;
    getStats(user: any): Promise<{
        hasOpenClosure: boolean;
        message: string;
        openingDate?: undefined;
        openingAmount?: undefined;
        totalSales?: undefined;
        totalCashSales?: undefined;
        salesCount?: undefined;
        salesByPaymentMethod?: undefined;
        salesBySeller?: undefined;
        isIndividualCash?: undefined;
    } | {
        hasOpenClosure: boolean;
        openingDate: Date;
        openingAmount: number;
        totalSales: number;
        totalCashSales: any;
        salesCount: number;
        salesByPaymentMethod: {};
        salesBySeller: {};
        isIndividualCash: boolean;
        message?: undefined;
    }>;
    getHistory(user: any, page?: number, limit?: number): Promise<{
        closures: {
            reportData: import("../printer/printer.service").CashClosureReportData;
            id: string;
            openingDate: Date;
            closingDate: Date;
            isClosed: boolean;
            openingAmount: number;
            closingAmount: number;
            totalSales: number;
            totalWithdrawals: number;
            totalChange: number;
            totalCashSales: number;
            expectedClosing: number;
            difference: number;
            salesCount: number;
            seller: {
                id: string;
                name: string;
            };
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, user: any): Promise<{
        sales: ({
            seller: {
                id: string;
                name: string;
            };
            items: ({
                product: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                createdAt: Date;
                saleId: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                productId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            sellerId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            change: import("@prisma/client/runtime/library").Decimal;
            clientCpfCnpj: string | null;
            clientName: string | null;
            isInstallment: boolean;
            saleDate: Date;
            cashClosureId: string | null;
        })[];
        company: {
            id: string;
            name: string;
        };
        _count: {
            sales: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        openingDate: Date;
        closingDate: Date | null;
        openingAmount: import("@prisma/client/runtime/library").Decimal;
        closingAmount: import("@prisma/client/runtime/library").Decimal;
        totalSales: import("@prisma/client/runtime/library").Decimal;
        totalWithdrawals: import("@prisma/client/runtime/library").Decimal;
        isClosed: boolean;
        sellerId: string | null;
    }>;
    close(user: any, closeCashClosureDto: CloseCashClosureDto, req: Request): Promise<{
        closure: {
            id: string;
            openingDate: Date;
            closingDate: Date;
            isClosed: boolean;
            openingAmount: number;
            closingAmount: number;
            totalSales: number;
            totalWithdrawals: number;
            totalChange: number;
            totalCashSales: number;
            expectedClosing: number;
            difference: number;
            salesCount: number;
            seller: {
                id: string;
                name: string;
            };
        };
        reportData: import("../printer/printer.service").CashClosureReportData;
        reportContent: string;
        printRequested: boolean;
        printResult: import("../printer/printer.service").PrintResult;
        id: string;
        openingDate: Date;
        closingDate: Date;
        isClosed: boolean;
        openingAmount: number;
        closingAmount: number;
        totalSales: number;
        totalWithdrawals: number;
        totalChange: number;
        totalCashSales: number;
        expectedClosing: number;
        difference: number;
        salesCount: number;
        seller: {
            id: string;
            name: string;
        };
    }>;
    reprintReport(id: string, user: any, req: Request): Promise<{
        closure: {
            id: string;
            openingDate: Date;
            closingDate: Date;
            isClosed: boolean;
            openingAmount: number;
            closingAmount: number;
            totalSales: number;
            totalWithdrawals: number;
            totalChange: number;
            totalCashSales: number;
            expectedClosing: number;
            difference: number;
            salesCount: number;
            seller: {
                id: string;
                name: string;
            };
        };
        reportData: import("../printer/printer.service").CashClosureReportData;
        reportContent: string;
        printResult: import("../printer/printer.service").PrintResult;
        id: string;
        openingDate: Date;
        closingDate: Date;
        isClosed: boolean;
        openingAmount: number;
        closingAmount: number;
        totalSales: number;
        totalWithdrawals: number;
        totalChange: number;
        totalCashSales: number;
        expectedClosing: number;
        difference: number;
        salesCount: number;
        seller: {
            id: string;
            name: string;
        };
        closureId: string;
    }>;
    getPrintContent(id: string, user: any): Promise<{
        closure: {
            id: string;
            openingDate: Date;
            closingDate: Date;
            isClosed: boolean;
            openingAmount: number;
            closingAmount: number;
            totalSales: number;
            totalWithdrawals: number;
            totalChange: number;
            totalCashSales: number;
            expectedClosing: number;
            difference: number;
            salesCount: number;
            seller: {
                id: string;
                name: string;
            };
        };
        reportData: import("../printer/printer.service").CashClosureReportData;
        reportContent: string;
        id: string;
        openingDate: Date;
        closingDate: Date;
        isClosed: boolean;
        openingAmount: number;
        closingAmount: number;
        totalSales: number;
        totalWithdrawals: number;
        totalChange: number;
        totalCashSales: number;
        expectedClosing: number;
        difference: number;
        salesCount: number;
        seller: {
            id: string;
            name: string;
        };
        closureId: string;
    }>;
}
