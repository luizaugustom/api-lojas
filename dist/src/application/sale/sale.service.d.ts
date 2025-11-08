import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ProductService } from '../product/product.service';
import { PrinterService } from '../printer/printer.service';
import { FiscalService } from '../fiscal/fiscal.service';
import { EmailService } from '../../shared/services/email.service';
import { IBPTService } from '../../shared/services/ibpt.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ProcessExchangeDto } from './dto/process-exchange.dto';
import { ClientTimeInfo } from '../../shared/utils/client-time.util';
export declare class SaleService {
    private readonly prisma;
    private readonly productService;
    private readonly printerService;
    private readonly fiscalService;
    private readonly emailService;
    private readonly ibptService;
    private readonly logger;
    constructor(prisma: PrismaService, productService: ProductService, printerService: PrinterService, fiscalService: FiscalService, emailService: EmailService, ibptService: IBPTService);
    create(companyId: string, sellerId: string, createSaleDto: CreateSaleDto, computerId?: string | null, clientTimeInfo?: ClientTimeInfo): Promise<{
        company: {
            number: string;
            id: string;
            name: string;
            cnpj: string;
            email: string;
            phone: string;
            stateRegistration: string;
            customFooter: string;
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
                price: Prisma.Decimal;
                ncm: string;
                cfop: string;
                unitOfMeasure: string;
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
        paymentMethods: {
            id: string;
            createdAt: Date;
            amount: Prisma.Decimal;
            method: string;
            saleId: string;
            additionalInfo: string | null;
        }[];
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
                saleId: string;
                quantity: number;
                unitPrice: Prisma.Decimal;
                totalPrice: Prisma.Decimal;
                productId: string;
            })[];
            paymentMethods: {
                id: string;
                createdAt: Date;
                amount: Prisma.Decimal;
                method: string;
                saleId: string;
                additionalInfo: string | null;
            }[];
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
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, companyId?: string): Promise<{
        exchanges: {
            id: string;
            reason: string;
            note: string;
            exchangeDate: Date;
            returnedTotal: number;
            deliveredTotal: number;
            difference: number;
            storeCreditAmount: number;
            status: import(".prisma/client").$Enums.ExchangeStatus;
            processedBy: {
                id: string;
                name: string;
            };
            returnedItems: any[];
            deliveredItems: any[];
            payments: {
                id: string;
                method: string;
                amount: number;
                additionalInfo: string;
                createdAt: Date;
            }[];
            refunds: {
                id: string;
                method: string;
                amount: number;
                additionalInfo: string;
                createdAt: Date;
            }[];
            createdAt: Date;
            fiscalDocuments: {
                id: string;
                documentType: string;
                origin: string;
                documentNumber: string;
                accessKey: string;
                status: string;
                totalValue: number;
                pdfUrl: string;
                qrCodeUrl: string;
                createdAt: Date;
                metadata: Record<string, any>;
            }[];
            returnFiscalDocument: {
                id: string;
                documentType: string;
                origin: string;
                documentNumber: string;
                accessKey: string;
                status: string;
                totalValue: number;
                pdfUrl: string;
                qrCodeUrl: string;
                createdAt: Date;
                metadata: Record<string, any>;
            };
            deliveryFiscalDocument: {
                id: string;
                documentType: string;
                origin: string;
                documentNumber: string;
                accessKey: string;
                status: string;
                totalValue: number;
                pdfUrl: string;
                qrCodeUrl: string;
                createdAt: Date;
                metadata: Record<string, any>;
            };
            fiscalWarnings: any[];
        }[];
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
                price: Prisma.Decimal;
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
        paymentMethods: {
            id: string;
            createdAt: Date;
            amount: Prisma.Decimal;
            method: string;
            saleId: string;
            additionalInfo: string | null;
        }[];
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
                price: Prisma.Decimal;
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
    }>;
    remove(id: string, companyId?: string): Promise<{
        message: string;
    }>;
    processExchange(companyId: string, processExchangeDto: ProcessExchangeDto, processedById?: string): Promise<{
        id: string;
        reason: string;
        note: string;
        exchangeDate: Date;
        returnedTotal: number;
        deliveredTotal: number;
        difference: number;
        storeCreditAmount: number;
        status: import(".prisma/client").$Enums.ExchangeStatus;
        processedBy: {
            id: string;
            name: string;
        };
        returnedItems: any[];
        deliveredItems: any[];
        payments: {
            id: string;
            method: string;
            amount: number;
            additionalInfo: string;
            createdAt: Date;
        }[];
        refunds: {
            id: string;
            method: string;
            amount: number;
            additionalInfo: string;
            createdAt: Date;
        }[];
        createdAt: Date;
        fiscalDocuments: {
            id: string;
            documentType: string;
            origin: string;
            documentNumber: string;
            accessKey: string;
            status: string;
            totalValue: number;
            pdfUrl: string;
            qrCodeUrl: string;
            createdAt: Date;
            metadata: Record<string, any>;
        }[];
        returnFiscalDocument: {
            id: string;
            documentType: string;
            origin: string;
            documentNumber: string;
            accessKey: string;
            status: string;
            totalValue: number;
            pdfUrl: string;
            qrCodeUrl: string;
            createdAt: Date;
            metadata: Record<string, any>;
        };
        deliveryFiscalDocument: {
            id: string;
            documentType: string;
            origin: string;
            documentNumber: string;
            accessKey: string;
            status: string;
            totalValue: number;
            pdfUrl: string;
            qrCodeUrl: string;
            createdAt: Date;
            metadata: Record<string, any>;
        };
        fiscalWarnings: any[];
    }>;
    private toNumber;
    private roundCurrency;
    private adjustPaymentTotals;
    private extractErrorMessage;
    private mapExchange;
    getSalesStats(companyId?: string, sellerId?: string, startDate?: string, endDate?: string): Promise<{
        totalSales: number;
        totalValue: number | Prisma.Decimal;
        averageTicket: number | Prisma.Decimal;
        salesByPaymentMethod: {};
    }>;
    reprintReceipt(id: string, companyId?: string, computerId?: string | null, clientTimeInfo?: ClientTimeInfo): Promise<{
        message: string;
        warning: string;
        printContent: string;
        printType: string;
    } | {
        message: string;
        printContent: string;
        printType: string;
        warning?: undefined;
    }>;
    getPrintContent(id: string, companyId?: string, clientTimeInfo?: ClientTimeInfo): Promise<{
        content: string;
        isMock: boolean;
    }>;
}
