import { ConfigService } from '@nestjs/config';
export interface N8nWebhookData {
    event: string;
    data: any;
    timestamp: Date;
    source: string;
}
export declare class N8nService {
    private readonly configService;
    private readonly logger;
    private readonly n8nWebhookUrl;
    constructor(configService: ConfigService);
    sendWebhook(webhookData: N8nWebhookData): Promise<boolean>;
    notifySaleCreated(saleData: any): Promise<boolean>;
    notifyProductLowStock(productData: any): Promise<boolean>;
    notifyBillDueSoon(billData: any): Promise<boolean>;
    notifyCashClosureClosed(closureData: any): Promise<boolean>;
    notifyFiscalDocumentGenerated(documentData: any): Promise<boolean>;
    notifyCustomerCreated(customerData: any): Promise<boolean>;
    notifySellerCreated(sellerData: any): Promise<boolean>;
    notifyCompanyCreated(companyData: any): Promise<boolean>;
    testWebhook(): Promise<boolean>;
    getWebhookUrl(): string;
    getWebhookStatus(): Promise<{
        status: string;
        url: string;
        lastTest?: Date;
    }>;
}
