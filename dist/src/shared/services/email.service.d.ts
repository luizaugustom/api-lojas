import { ConfigService } from '@nestjs/config';
export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
}
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private transporter;
    constructor(configService: ConfigService);
    private initializeTransporter;
    sendEmail(options: EmailOptions): Promise<boolean>;
    sendWelcomeEmail(customerEmail: string, customerName: string, companyName: string): Promise<boolean>;
    sendSaleConfirmationEmail(customerEmail: string, customerName: string, saleData: any, companyName: string): Promise<boolean>;
    sendPromotionalEmail(customerEmail: string, customerName: string, promotionData: any, companyName: string): Promise<boolean>;
    private getWelcomeTemplate;
    private getSaleConfirmationTemplate;
    private getPromotionalTemplate;
}
