import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PrinterService, CashClosureReportData, PrintResult } from '../printer/printer.service';
import { CreateCashClosureDto } from './dto/create-cash-closure.dto';
import { CloseCashClosureDto } from './dto/close-cash-closure.dto';
export declare class CashClosureService {
    private readonly prisma;
    private readonly printerService;
    private readonly logger;
    constructor(prisma: PrismaService, printerService: PrinterService);
    private parseClientDate;
    create(companyId: string, createCashClosureDto: CreateCashClosureDto, sellerId?: string): Promise<{
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
        openingAmount: Prisma.Decimal;
        closingAmount: Prisma.Decimal;
        totalSales: Prisma.Decimal;
        totalWithdrawals: Prisma.Decimal;
        isClosed: boolean;
        sellerId: string | null;
    }>;
    findAll(companyId?: string, page?: number, limit?: number, isClosed?: boolean): Promise<{
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
            openingAmount: Prisma.Decimal;
            closingAmount: Prisma.Decimal;
            totalSales: Prisma.Decimal;
            totalWithdrawals: Prisma.Decimal;
            isClosed: boolean;
            sellerId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, companyId?: string): Promise<{
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
                unitPrice: Prisma.Decimal;
                totalPrice: Prisma.Decimal;
                productId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            sellerId: string;
            total: Prisma.Decimal;
            change: Prisma.Decimal;
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
        openingAmount: Prisma.Decimal;
        closingAmount: Prisma.Decimal;
        totalSales: Prisma.Decimal;
        totalWithdrawals: Prisma.Decimal;
        isClosed: boolean;
        sellerId: string | null;
    }>;
    getCurrentClosure(companyId: string, sellerId?: string): Promise<{
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
            total: Prisma.Decimal;
            change: Prisma.Decimal;
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
        openingAmount: Prisma.Decimal;
        closingAmount: Prisma.Decimal;
        totalSales: Prisma.Decimal;
        totalWithdrawals: Prisma.Decimal;
        isClosed: boolean;
        sellerId: string | null;
    }>;
    close(companyId: string, closeCashClosureDto: CloseCashClosureDto, sellerId?: string, computerId?: string | null): Promise<{
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
        reportData: CashClosureReportData;
        reportContent: string;
        printRequested: boolean;
        printResult: PrintResult;
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
    getCashClosureStats(companyId: string, sellerId?: string): Promise<{
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
    getClosureHistory(companyId: string, page?: number, limit?: number): Promise<{
        closures: {
            reportData: CashClosureReportData;
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
    reprintReport(id: string, companyId?: string, computerId?: string | null): Promise<{
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
        reportData: CashClosureReportData;
        reportContent: string;
        printResult: PrintResult;
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
    getReportContent(id: string, companyId?: string): Promise<{
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
        reportData: CashClosureReportData;
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
    private loadClosureWithDetails;
    private buildCompanyAddress;
    private buildCashClosureReportData;
    private buildClosureSummary;
}
