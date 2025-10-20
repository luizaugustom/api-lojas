import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { FiscalApiService } from '../../shared/services/fiscal-api.service';
export interface NFeData {
    companyId: string;
    clientCpfCnpj?: string;
    clientName?: string;
    items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    totalValue: number;
    paymentMethod: string[];
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
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, fiscalApiService: FiscalApiService);
    generateNFe(nfeData: NFeData): Promise<any>;
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
            documentType: string;
            totalValue: import("@prisma/client/runtime/library").Decimal | null;
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
        documentType: string;
        totalValue: import("@prisma/client/runtime/library").Decimal | null;
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
        documentType: string;
        totalValue: import("@prisma/client/runtime/library").Decimal | null;
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
        documentType: string;
        totalValue: import("@prisma/client/runtime/library").Decimal | null;
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
}
