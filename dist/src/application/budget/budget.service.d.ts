import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { PrinterService } from '../printer/printer.service';
import { SaleService } from '../sale/sale.service';
import { ClientTimeInfo } from '../../shared/utils/client-time.util';
export interface BudgetPrintData {
    company: {
        id: string;
        name: string;
        cnpj: string;
        address?: string;
        phone?: string;
        email?: string;
        logoUrl?: string;
    };
    budget: {
        id: string;
        budgetNumber: number;
        budgetDate: Date;
        validUntil: Date;
        total: number;
        status: string;
        notes?: string;
    };
    client?: {
        name?: string;
        phone?: string;
        email?: string;
        cpfCnpj?: string;
    };
    items: Array<{
        productName: string;
        barcode: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    seller?: {
        name: string;
    };
    metadata?: {
        clientTimeInfo?: ClientTimeInfo;
    };
}
export declare class BudgetService {
    private readonly prisma;
    private readonly printerService;
    private readonly saleService;
    private readonly logger;
    constructor(prisma: PrismaService, printerService: PrinterService, saleService: SaleService);
    create(companyId: string, sellerId: string | undefined, createBudgetDto: CreateBudgetDto): Promise<{
        company: {
            number: string;
            id: string;
            name: string;
            cnpj: string;
            email: string;
            phone: string;
            logoUrl: string;
            district: string;
            street: string;
        };
        seller: {
            id: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                barcode: string;
                price: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            budgetId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        sellerId: string | null;
        clientEmail: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        clientCpfCnpj: string | null;
        clientName: string | null;
        status: string;
        notes: string | null;
        validUntil: Date;
        clientPhone: string | null;
        budgetNumber: number;
        budgetDate: Date;
    }>;
    findAll(companyId: string, sellerId?: string, status?: string, startDate?: string, endDate?: string): Promise<({
        seller: {
            id: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                barcode: string;
                price: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            budgetId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        sellerId: string | null;
        clientEmail: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        clientCpfCnpj: string | null;
        clientName: string | null;
        status: string;
        notes: string | null;
        validUntil: Date;
        clientPhone: string | null;
        budgetNumber: number;
        budgetDate: Date;
    })[]>;
    findOne(id: string, companyId?: string): Promise<{
        company: {
            number: string;
            id: string;
            name: string;
            cnpj: string;
            email: string;
            phone: string;
            logoUrl: string;
            state: string;
            city: string;
            district: string;
            street: string;
        };
        seller: {
            id: string;
            name: string;
        };
        items: ({
            product: {
                id: string;
                name: string;
                barcode: string;
                price: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            budgetId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        sellerId: string | null;
        clientEmail: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        clientCpfCnpj: string | null;
        clientName: string | null;
        status: string;
        notes: string | null;
        validUntil: Date;
        clientPhone: string | null;
        budgetNumber: number;
        budgetDate: Date;
    }>;
    update(id: string, companyId: string, updateBudgetDto: UpdateBudgetDto): Promise<{
        seller: {
            id: string;
            login: string;
            password: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            phone: string | null;
            defaultDataPeriod: import(".prisma/client").$Enums.DataPeriodFilter;
            cpf: string | null;
            birthDate: Date | null;
            commissionRate: import("@prisma/client/runtime/library").Decimal;
            hasIndividualCash: boolean;
            companyId: string;
        };
        items: ({
            product: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                companyId: string;
                barcode: string;
                photos: string[];
                size: string | null;
                stockQuantity: number;
                price: import("@prisma/client/runtime/library").Decimal;
                category: string | null;
                expirationDate: Date | null;
                ncm: string | null;
                cfop: string | null;
                unitOfMeasure: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            budgetId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        sellerId: string | null;
        clientEmail: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        clientCpfCnpj: string | null;
        clientName: string | null;
        status: string;
        notes: string | null;
        validUntil: Date;
        clientPhone: string | null;
        budgetNumber: number;
        budgetDate: Date;
    }>;
    remove(id: string, companyId: string): Promise<{
        message: string;
    }>;
    printBudget(id: string, companyId?: string, computerId?: string | null, clientTimeInfo?: ClientTimeInfo): Promise<{
        message: string;
    }>;
    generatePdf(id: string, companyId?: string, clientTimeInfo?: ClientTimeInfo): Promise<Buffer>;
    private generatePdfContent;
    private translateStatus;
    convertToSale(id: string, companyId: string, sellerId: string): Promise<{
        message: string;
        budgetData: {
            items: {
                productId: string;
                quantity: number;
            }[];
            clientName: string;
            clientCpfCnpj: string;
        };
    }>;
}
