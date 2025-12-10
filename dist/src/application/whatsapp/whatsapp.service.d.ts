import { ConfigService } from '@nestjs/config';
import { ZApiProvider } from './providers/z-api.provider';
export interface WhatsAppMessage {
    to: string;
    message: string;
    type?: 'text' | 'image' | 'document';
    mediaUrl?: string;
    filename?: string;
}
export interface WhatsAppTemplate {
    name: string;
    language: string;
    parameters: string[];
}
export interface InstallmentBillingData {
    customerName: string;
    installmentNumber: number;
    totalInstallments: number;
    amount: number;
    remainingAmount: number;
    dueDate: Date;
    description?: string;
    saleId?: string;
    companyName?: string;
}
export declare class WhatsappService {
    private readonly configService;
    private readonly zApiProvider;
    private readonly logger;
    private readonly provider;
    private readonly providerName;
    constructor(configService: ConfigService, zApiProvider: ZApiProvider);
    checkInstanceStatus(): Promise<{
        connected: boolean;
        status?: string;
    }>;
    sendMessage(message: WhatsAppMessage, retries?: number): Promise<boolean>;
    sendSaleNotification(phone: string, saleData: any): Promise<boolean>;
    sendLowStockAlert(phone: string, productData: any): Promise<boolean>;
    sendPaymentReminder(phone: string, billData: any): Promise<boolean>;
    sendInstallmentBilling(billingData: InstallmentBillingData, phone: string): Promise<boolean>;
    sendMultipleInstallmentsBilling(customerName: string, phone: string, installments: Array<{
        installmentNumber: number;
        totalInstallments: number;
        amount: number;
        remainingAmount: number;
        dueDate: Date;
        description?: string;
    }>, companyName?: string): Promise<boolean>;
    sendCashClosureReport(phone: string, closureData: any): Promise<boolean>;
    sendTemplateMessage(template: WhatsAppTemplate, to: string): Promise<boolean>;
    sendMediaMessage(to: string, mediaUrl: string, filename?: string): Promise<boolean>;
    sendDocumentMessage(to: string, mediaUrl: string, filename: string): Promise<boolean>;
    getMessageStatus(messageId: string): Promise<{
        status: string;
        timestamp: Date;
    }>;
    private getPaymentMethodName;
    validatePhoneNumber(phone: string): Promise<boolean>;
    formatPhoneNumber(phone: string): Promise<string>;
}
