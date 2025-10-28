import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
export interface FiscalApiConfig {
    provider: 'nfe.io' | 'tecnospeed' | 'focusnfe' | 'enotas' | 'mock';
    baseUrl: string;
    apiKey: string;
    environment: 'sandbox' | 'production';
    certificatePath?: string;
    certificatePassword?: string;
}
export interface NFCeRequest {
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
        ncm?: string;
        cfop?: string;
    }>;
    totalValue: number;
    paymentMethod: string[];
    saleId: string;
    sellerName: string;
}
export interface NFCeResponse {
    success: boolean;
    documentNumber: string;
    accessKey: string;
    status: string;
    xmlContent?: string;
    pdfUrl?: string;
    qrCodeUrl?: string;
    error?: string;
    errors?: string[];
}
export interface NFeRecipientAddress {
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    state?: string;
}
export interface NFeRecipient {
    document: string;
    name: string;
    email?: string;
    phone?: string;
    address?: NFeRecipientAddress;
}
export interface NFeItem {
    description: string;
    quantity: number;
    unitPrice: number;
    ncm?: string;
    cfop: string;
    unitOfMeasure: string;
}
export interface NFeRequest {
    companyId: string;
    recipient: NFeRecipient;
    items: NFeItem[];
    paymentMethod: string;
    additionalInfo?: string;
    referenceId?: string;
}
export interface NFeResponse {
    success: boolean;
    documentNumber: string;
    accessKey: string;
    status: string;
    xmlContent?: string;
    pdfUrl?: string;
    error?: string;
    errors?: string[];
}
export declare class FiscalApiService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly httpClient;
    private readonly config;
    constructor(configService: ConfigService, prisma: PrismaService);
    private getFocusNfeApiKey;
    private getFocusNfeEnvironment;
    private loadFiscalConfig;
    private createHttpClient;
    generateNFCe(request: NFCeRequest): Promise<NFCeResponse>;
    private generateNFCeNfeIo;
    private generateNFCeTecnoSpeed;
    private generateNFCeFocusNFe;
    private generateNFCeEnotas;
    private generateNFCeMock;
    generateNFe(request: NFeRequest): Promise<NFeResponse>;
    private generateNFeFocusNFe;
    private mapPaymentMethodCodeSefaz;
    private mapPaymentMethods;
    uploadCertificate(certificatePath: string, password: string): Promise<boolean>;
    getFiscalStatus(): Promise<{
        provider: string;
        status: string;
        environment: string;
    }>;
}
