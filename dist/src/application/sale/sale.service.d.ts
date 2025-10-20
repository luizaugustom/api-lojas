import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ProductService } from '../product/product.service';
import { PrinterService } from '../printer/printer.service';
import { FiscalService } from '../fiscal/fiscal.service';
import { EmailService } from '../../shared/services/email.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ProcessExchangeDto } from './dto/process-exchange.dto';
export declare class SaleService {
    private readonly prisma;
    private readonly productService;
    private readonly printerService;
    private readonly fiscalService;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, productService: ProductService, printerService: PrinterService, fiscalService: FiscalService, emailService: EmailService);
    create(companyId: string, sellerId: string, createSaleDto: CreateSaleDto): Promise<{
        company: {
            number: string;
            id: string;
            name: string;
            cnpj: string;
            email: string;
            phone: string;
            customFooter: string;
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
            saleId: string;
            productId: string;
        })[];
        paymentMethods: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            method: string;
            saleId: string;
            additionalInfo: string | null;
        }[];
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
    }>;
    findAll(companyId?: string, page?: number, limit?: number, sellerId?: string, startDate?: string, endDate?: string): Promise<{
        sales: ({
            seller: {
                id: string;
                name: string;
            };
            items: ({
                product: {
                    id: string;
                    name: string;
                    barcode: string;
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
            paymentMethods: {
                id: string;
                createdAt: Date;
                amount: import("@prisma/client/runtime/library").Decimal;
                method: string;
                saleId: string;
                additionalInfo: string | null;
            }[];
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
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
            cnpj: string;
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
            saleId: string;
            productId: string;
        })[];
        paymentMethods: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            method: string;
            saleId: string;
            additionalInfo: string | null;
        }[];
        exchanges: ({
            product: {
                id: string;
                name: string;
                barcode: string;
            };
        } & {
            id: string;
            createdAt: Date;
            productId: string;
            originalSaleId: string;
            reason: string;
            exchangeDate: Date;
            originalQuantity: number;
            exchangedQuantity: number;
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
    }>;
    update(id: string, updateSaleDto: UpdateSaleDto, companyId?: string): Promise<{
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
    }>;
    remove(id: string, companyId?: string): Promise<{
        message: string;
    }>;
    processExchange(companyId: string, processExchangeDto: ProcessExchangeDto): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        originalSaleId: string;
        reason: string;
        exchangeDate: Date;
        originalQuantity: number;
        exchangedQuantity: number;
    }>;
    getSalesStats(companyId?: string, sellerId?: string, startDate?: string, endDate?: string): Promise<{
        totalSales: number;
        totalValue: number | import("@prisma/client/runtime/library").Decimal;
        averageTicket: number | import("@prisma/client/runtime/library").Decimal;
        salesByPaymentMethod: {};
    }>;
    reprintReceipt(id: string, companyId?: string): Promise<{
        message: string;
    }>;
}
