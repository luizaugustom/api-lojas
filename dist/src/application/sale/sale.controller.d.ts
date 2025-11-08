import { Request } from 'express';
import { SaleService } from './sale.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { ProcessExchangeDto } from './dto/process-exchange.dto';
export declare class SaleController {
    private readonly saleService;
    constructor(saleService: SaleService);
    create(user: any, createSaleDto: CreateSaleDto, req: Request): Promise<{
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
                price: import("@prisma/client/runtime/library").Decimal;
                ncm: string;
                cfop: string;
                unitOfMeasure: string;
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
        sellerId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        change: import("@prisma/client/runtime/library").Decimal;
        clientCpfCnpj: string | null;
        clientName: string | null;
        isInstallment: boolean;
        saleDate: Date;
        cashClosureId: string | null;
    }>;
    findAll(user: any, page?: number, limit?: number, sellerId?: string, startDate?: string, endDate?: string): Promise<{
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
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
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
            sellerId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            change: import("@prisma/client/runtime/library").Decimal;
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
    getStats(user: any, sellerId?: string, startDate?: string, endDate?: string): Promise<{
        totalSales: number;
        totalValue: number | import("@prisma/client/runtime/library").Decimal;
        averageTicket: number | import("@prisma/client/runtime/library").Decimal;
        salesByPaymentMethod: {};
    }>;
    getMySales(user: any, page?: number, limit?: number, startDate?: string, endDate?: string): Promise<{
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
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
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
            sellerId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            change: import("@prisma/client/runtime/library").Decimal;
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
    getMyStats(user: any, startDate?: string, endDate?: string): Promise<{
        totalSales: number;
        totalValue: number | import("@prisma/client/runtime/library").Decimal;
        averageTicket: number | import("@prisma/client/runtime/library").Decimal;
        salesByPaymentMethod: {};
    }>;
    findOne(id: string, user: any): Promise<{
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
                price: import("@prisma/client/runtime/library").Decimal;
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
        paymentMethods: {
            id: string;
            createdAt: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            method: string;
            saleId: string;
            additionalInfo: string | null;
        }[];
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
    }>;
    processExchange(user: any, processExchangeDto: ProcessExchangeDto): Promise<{
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
    reprintReceipt(id: string, user: any, req: Request): Promise<{
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
    getPrintContent(id: string, user: any, req: Request): Promise<{
        content: string;
        isMock: boolean;
    }>;
    update(id: string, updateSaleDto: UpdateSaleDto, user: any): Promise<{
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
    }>;
    remove(id: string, user: any): Promise<{
        message: string;
    }>;
}
