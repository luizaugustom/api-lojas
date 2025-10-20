import { ConfigService } from '@nestjs/config';
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
export declare class WhatsappService {
    private readonly configService;
    private readonly logger;
    private readonly whatsappApiUrl;
    private readonly whatsappToken;
    constructor(configService: ConfigService);
    sendMessage(message: WhatsAppMessage): Promise<boolean>;
    sendSaleNotification(phone: string, saleData: any): Promise<boolean>;
    sendLowStockAlert(phone: string, productData: any): Promise<boolean>;
    sendPaymentReminder(phone: string, billData: any): Promise<boolean>;
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
