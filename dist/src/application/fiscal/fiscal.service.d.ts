import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ValidationService } from '../../shared/services/validation.service';
import { FiscalApiService } from '../../shared/services/fiscal-api.service';
export interface NFeData {
    companyId: string;
    saleId?: string;
    recipient?: {
        document: string;
        name: string;
        email?: string;
        phone?: string;
        address?: {
            zipCode?: string;
            street?: string;
            number?: string;
            complement?: string;
            district?: string;
            city?: string;
            state?: string;
        };
    };
    items?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        ncm?: string;
        cfop: string;
        unitOfMeasure: string;
    }>;
    payment?: {
        method: string;
    };
    additionalInfo?: string;
}
export interface NFCeData {
    companyId: string;
    clientCpfCnpj?: string;
    clientName?: string;
    items: Array<{
        productId: string;
        productName: string;
        barcode: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    totalValue: number;
    paymentMethod: string[];
    saleId: string;
    sellerName: string;
}
export interface NFSeData {
    companyId: string;
    clientCpfCnpj?: string;
    clientName?: string;
    serviceDescription: string;
    serviceValue: number;
    paymentMethod: string[];
}
export declare class FiscalService {
    private readonly configService;
    private readonly prisma;
    private readonly fiscalApiService;
    private readonly validationService;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, fiscalApiService: FiscalApiService, validationService: ValidationService);
    generateNFe(nfeData: NFeData): Promise<any>;
    hasValidFiscalConfig(companyId: string): Promise<boolean>;
    generateMockNFCe(nfceData: NFCeData): Promise<any>;
    private generateMockAccessKey;
    generateNFCe(nfceData: NFCeData): Promise<any>;
    generateNFSe(nfseData: NFSeData): Promise<any>;
    getFiscalDocuments(companyId?: string, page?: number, limit?: number, documentType?: string): Promise<{
        documents: ({
            company: {
                id: string;
                name: string;
                cnpj: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            documentNumber: string;
            accessKey: string;
            status: string;
            xmlContent: string | null;
            pdfUrl: string | null;
            qrCodeUrl: string | null;
            documentType: string;
            totalValue: import("@prisma/client/runtime/library").Decimal | null;
            supplierName: string | null;
            protocol: string | null;
            serieNumber: string | null;
            emissionDate: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getFiscalDocument(id: string, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
            cnpj: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        documentNumber: string;
        accessKey: string;
        status: string;
        xmlContent: string | null;
        pdfUrl: string | null;
        qrCodeUrl: string | null;
        documentType: string;
        totalValue: import("@prisma/client/runtime/library").Decimal | null;
        supplierName: string | null;
        protocol: string | null;
        serieNumber: string | null;
        emissionDate: Date;
    }>;
    cancelFiscalDocument(id: string, reason: string, companyId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        documentNumber: string;
        accessKey: string;
        status: string;
        xmlContent: string | null;
        pdfUrl: string | null;
        qrCodeUrl: string | null;
        documentType: string;
        totalValue: import("@prisma/client/runtime/library").Decimal | null;
        supplierName: string | null;
        protocol: string | null;
        serieNumber: string | null;
        emissionDate: Date;
    }>;
    downloadFiscalDocument(id: string, format: 'xml' | 'pdf', companyId?: string): Promise<{
        content: string;
        filename: string;
        mimetype: string;
        contentType: string;
        size: number;
        downloadUrl: string;
        url?: undefined;
        isExternal?: undefined;
    } | {
        content: Buffer<ArrayBufferLike>;
        filename: string;
        mimetype: string;
        contentType: string;
        size: number;
        downloadUrl: string;
        url?: undefined;
        isExternal?: undefined;
    } | {
        url: string;
        filename: string;
        mimetype: string;
        contentType: string;
        downloadUrl: string;
        isExternal: boolean;
        content?: undefined;
        size?: undefined;
    }>;
    private generatePdfFromDocument;
    getFiscalStats(companyId?: string): Promise<{
        totalDocuments: number;
        nfeCount: number;
        nfseCount: number;
        cancelledCount: number;
        totalValue: number;
    }>;
    getFiscalDocumentByAccessKey(accessKey: string, companyId?: string): Promise<{
        company: {
            id: string;
            name: string;
            cnpj: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        documentNumber: string;
        accessKey: string;
        status: string;
        xmlContent: string | null;
        pdfUrl: string | null;
        qrCodeUrl: string | null;
        documentType: string;
        totalValue: import("@prisma/client/runtime/library").Decimal | null;
        supplierName: string | null;
        protocol: string | null;
        serieNumber: string | null;
        emissionDate: Date;
    }>;
    getFiscalApiStatus(): Promise<any>;
    uploadCertificate(certificatePath: string, password: string): Promise<boolean>;
    validateCompanyFiscalData(companyId: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    processXmlFile(file: Express.Multer.File, companyId: string): Promise<{
        id: string;
        documentNumber: string;
        documentType: string;
        accessKey: string;
        emissionDate: Date;
        status: string;
        totalValue: import("@prisma/client/runtime/library").Decimal;
        message: string;
    }>;
    private extractDocumentInfo;
    createInboundInvoice(companyId: string, data: {
        accessKey?: string;
        supplierName: string;
        totalValue: number;
        documentNumber?: string;
        pdfUrl?: string;
    }): Promise<{
        id: string;
        documentNumber: string;
        documentType: string;
        accessKey: string;
        status: string;
        totalValue: import("@prisma/client/runtime/library").Decimal;
        supplierName: string;
        emissionDate: Date;
        message: string;
    }>;
    updateInboundInvoice(id: string, companyId: string, data: {
        accessKey?: string | null;
        supplierName?: string;
        totalValue?: number;
        documentNumber?: string;
    }): Promise<{
        id: string;
        documentNumber: string;
        documentType: string;
        accessKey: string;
        status: string;
        totalValue: import("@prisma/client/runtime/library").Decimal;
        supplierName: string;
        emissionDate: Date;
        message: string;
    }>;
    deleteInboundInvoice(id: string, companyId: string): Promise<{
        message: string;
        deletedId: string;
        documentNumber: string;
        accessKey: string;
    }>;
}
