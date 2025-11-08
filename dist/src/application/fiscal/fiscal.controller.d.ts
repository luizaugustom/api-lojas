import { Response } from 'express';
import { FiscalService } from './fiscal.service';
import { GenerateNFeDto } from './dto/generate-nfe.dto';
import { GenerateNFSeDto } from './dto/generate-nfse.dto';
import { GenerateNFCeDto } from './dto/generate-nfce.dto';
import { CancelFiscalDocumentDto } from './dto/cancel-fiscal-document.dto';
import { CreateInboundInvoiceDto } from './dto/create-inbound-invoice.dto';
import { UpdateInboundInvoiceDto } from './dto/update-inbound-invoice.dto';
export declare class FiscalController {
    private readonly fiscalService;
    constructor(fiscalService: FiscalService);
    generateNFe(user: any, generateNFeDto: GenerateNFeDto): Promise<any>;
    generateNFSe(user: any, generateNFSeDto: GenerateNFSeDto): Promise<any>;
    generateNFCe(user: any, generateNFCeDto: GenerateNFCeDto): Promise<any>;
    getFiscalDocuments(user: any, page?: number, limit?: number, documentType?: string): Promise<{
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
            saleId: string | null;
            documentNumber: string;
            accessKey: string | null;
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
            productExchangeId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getFiscalApiStatus(user: any): Promise<any>;
    uploadCertificate(user: any, body: {
        certificatePath: string;
        password: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    validateCompanyFiscalData(user: any): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    uploadXmlFiscal(file: Express.Multer.File, user: any): Promise<{
        id: string;
        documentNumber: string;
        documentType: string;
        accessKey: string;
        emissionDate: Date;
        status: string;
        totalValue: import("@prisma/client/runtime/library").Decimal;
        message: string;
    }>;
    createInboundInvoice(createInboundInvoiceDto: CreateInboundInvoiceDto, user: any): Promise<{
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
    updateInboundInvoice(id: string, updateInboundInvoiceDto: UpdateInboundInvoiceDto, user: any): Promise<{
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
    getFiscalDocumentByAccessKey(accessKey: string, user: any): Promise<{
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
        saleId: string | null;
        documentNumber: string;
        accessKey: string | null;
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
        productExchangeId: string | null;
    }>;
    getFiscalDocument(id: string, user: any): Promise<{
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
        saleId: string | null;
        documentNumber: string;
        accessKey: string | null;
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
        productExchangeId: string | null;
    }>;
    downloadFiscalDocument(id: string, format: 'xml' | 'pdf', user: any, res: Response): Promise<void | Response<any, Record<string, any>>>;
    getDownloadInfo(id: string, user: any): Promise<{
        documentId: string;
        documentNumber: string;
        documentType: string;
        accessKey: string;
        emissionDate: Date;
        status: string;
        availableFormats: any[];
    }>;
    cancelFiscalDocument(id: string, cancelDto: CancelFiscalDocumentDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        origin: string;
        saleId: string | null;
        documentNumber: string;
        accessKey: string | null;
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
        productExchangeId: string | null;
    }>;
    deleteInboundInvoice(id: string, user: any): Promise<{
        message: string;
        deletedId: string;
        documentNumber: string;
        accessKey: string;
    }>;
}
