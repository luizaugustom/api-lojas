import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { ValidationService } from '../../shared/services/validation.service';
import { IBPTService } from '../../shared/services/ibpt.service';
import { PlanLimitsService } from '../../shared/services/plan-limits.service';
import { FiscalApiService } from '../../shared/services/fiscal-api.service';
import { UploadService } from '../upload/upload.service';
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
export interface NFCeItemData {
    productId: string;
    productName: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    ncm?: string;
    cfop?: string;
    unitOfMeasure?: string;
}
export interface NFCePaymentData {
    method: string;
    amount: number;
}
export interface NFCeData {
    companyId: string;
    clientCpfCnpj?: string;
    clientName?: string;
    items: NFCeItemData[];
    totalValue: number;
    payments: NFCePaymentData[];
    saleId: string;
    sellerName: string;
    apiReference?: string;
    operationNature?: string;
    emissionPurpose?: number;
    referenceAccessKey?: string;
    documentType?: number;
    additionalInfo?: string;
    productExchangeId?: string;
    source?: string;
    metadata?: Record<string, any>;
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
    private readonly ibptService;
    private readonly planLimitsService;
    private readonly uploadService;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, fiscalApiService: FiscalApiService, validationService: ValidationService, ibptService: IBPTService, planLimitsService: PlanLimitsService, uploadService: UploadService);
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
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            origin: string;
            status: string;
            saleId: string | null;
            documentNumber: string;
            accessKey: string | null;
            xmlContent: string | null;
            pdfUrl: string | null;
            qrCodeUrl: string | null;
            documentType: string;
            totalValue: import("@prisma/client/runtime/library").Decimal | null;
            supplierName: string | null;
            protocol: string | null;
            serieNumber: string | null;
            emissionDate: Date;
            productExchangeId: string | null;
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        origin: string;
        status: string;
        saleId: string | null;
        documentNumber: string;
        accessKey: string | null;
        xmlContent: string | null;
        pdfUrl: string | null;
        qrCodeUrl: string | null;
        documentType: string;
        totalValue: import("@prisma/client/runtime/library").Decimal | null;
        supplierName: string | null;
        protocol: string | null;
        serieNumber: string | null;
        emissionDate: Date;
        productExchangeId: string | null;
    }>;
    getFiscalDocumentStatus(id: string, companyId?: string): Promise<{
        id: string;
        accessKey: string;
        documentType: string;
        currentStatus: string;
        sefazStatus: string;
        error: string;
    }>;
    cancelFiscalDocument(id: string, reason: string, companyId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        origin: string;
        status: string;
        saleId: string | null;
        documentNumber: string;
        accessKey: string | null;
        xmlContent: string | null;
        pdfUrl: string | null;
        qrCodeUrl: string | null;
        documentType: string;
        totalValue: import("@prisma/client/runtime/library").Decimal | null;
        supplierName: string | null;
        protocol: string | null;
        serieNumber: string | null;
        emissionDate: Date;
        productExchangeId: string | null;
    }>;
    downloadFiscalDocument(id: string, format: 'xml' | 'pdf', companyId?: string, skipGeneration?: boolean): Promise<{
        content: Buffer<any>;
        filename: any;
        mimetype: any;
        contentType: any;
        size: number;
        downloadUrl: string;
    } | {
        content: string;
        filename: string;
        mimetype: string;
        contentType: string;
        size: number;
        downloadUrl: string;
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        origin: string;
        status: string;
        saleId: string | null;
        documentNumber: string;
        accessKey: string | null;
        xmlContent: string | null;
        pdfUrl: string | null;
        qrCodeUrl: string | null;
        documentType: string;
        totalValue: import("@prisma/client/runtime/library").Decimal | null;
        supplierName: string | null;
        protocol: string | null;
        serieNumber: string | null;
        emissionDate: Date;
        productExchangeId: string | null;
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
        inboundFileUrl: any;
    }>;
    private extractDocumentInfo;
    private uploadInboundAttachment;
    createInboundInvoice(companyId: string, data: {
        accessKey?: string;
        supplierName: string;
        totalValue: number;
        documentNumber?: string;
        pdfUrl?: string;
    }, file?: Express.Multer.File): Promise<{
        id: string;
        documentNumber: string;
        documentType: string;
        accessKey: string;
        status: string;
        totalValue: import("@prisma/client/runtime/library").Decimal;
        supplierName: string;
        emissionDate: Date;
        pdfUrl: string;
        inboundFileUrl: any;
        message: string;
    }>;
    updateInboundInvoice(id: string, companyId: string, data: {
        accessKey?: string | null;
        supplierName?: string;
        totalValue?: number;
        documentNumber?: string;
        pdfUrl?: string | null;
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
