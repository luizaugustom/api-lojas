import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PrinterService } from '../printer/printer.service';
import { CreateCashClosureDto } from './dto/create-cash-closure.dto';
import { CloseCashClosureDto } from './dto/close-cash-closure.dto';
export declare class CashClosureService {
    private readonly prisma;
    private readonly printerService;
    private readonly logger;
    constructor(prisma: PrismaService, printerService: PrinterService);
    create(companyId: string, createCashClosureDto: CreateCashClosureDto): Promise<{
        company: {
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
            openingAmount: import("@prisma/client/runtime/library").Decimal;
            closingAmount: import("@prisma/client/runtime/library").Decimal;
            totalSales: import("@prisma/client/runtime/library").Decimal;
            totalWithdrawals: import("@prisma/client/runtime/library").Decimal;
            isClosed: boolean;
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
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                saleId: string;
                productId: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            change: import("@prisma/client/runtime/library").Decimal;
            clientCpfCnpj: string | null;
            clientName: string | null;
            isInstallment: boolean;
            saleDate: Date;
            sellerId: string;
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
    }>;
    getCurrentClosure(companyId: string): Promise<{
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
            total: import("@prisma/client/runtime/library").Decimal;
            change: import("@prisma/client/runtime/library").Decimal;
            clientCpfCnpj: string | null;
            clientName: string | null;
            isInstallment: boolean;
            saleDate: Date;
            sellerId: string;
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
    }>;
    close(companyId: string, closeCashClosureDto: CloseCashClosureDto): Promise<{
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
            total: import("@prisma/client/runtime/library").Decimal;
            change: import("@prisma/client/runtime/library").Decimal;
            clientCpfCnpj: string | null;
            clientName: string | null;
            isInstallment: boolean;
            saleDate: Date;
            sellerId: string;
            cashClosureId: string | null;
        })[];
        company: {
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
    }>;
    getCashClosureStats(companyId: string): Promise<{
        hasOpenClosure: boolean;
        message: string;
        openingDate?: undefined;
        openingAmount?: undefined;
        totalSales?: undefined;
        salesCount?: undefined;
        salesByPaymentMethod?: undefined;
        salesBySeller?: undefined;
    } | {
        hasOpenClosure: boolean;
        openingDate: Date;
        openingAmount: number;
        totalSales: number;
        salesCount: number;
        salesByPaymentMethod: {};
        salesBySeller: {};
        message?: undefined;
    }>;
    getClosureHistory(companyId: string, page?: number, limit?: number): Promise<{
        closures: ({
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
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    reprintReport(id: string, companyId?: string): Promise<{
        message: string;
    }>;
}
