import { WhatsappService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendTemplateDto } from './dto/send-template.dto';
import { SendInstallmentBillingDto, SendCustomerBillingDto } from './dto/send-billing.dto';
import { PrismaService } from '../../infrastructure/database/prisma.service';
export declare class WhatsappController {
    private readonly whatsappService;
    private readonly prisma;
    constructor(whatsappService: WhatsappService, prisma: PrismaService);
    sendMessage(sendMessageDto: SendMessageDto): Promise<{
        success: boolean;
        message: string;
    }>;
    sendTemplate(sendTemplateDto: SendTemplateDto): Promise<{
        success: boolean;
        message: string;
    }>;
    validatePhone(phone: string): Promise<{
        isValid: boolean;
        message: string;
    }>;
    formatPhone(phone: string): Promise<{
        success: boolean;
        formattedPhone: string;
        message: string;
    } | {
        success: boolean;
        message: any;
        formattedPhone?: undefined;
    }>;
    sendInstallmentBilling(sendBillingDto: SendInstallmentBillingDto, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    sendCustomerBilling(sendBillingDto: SendCustomerBillingDto, user: any): Promise<{
        success: boolean;
        message: string;
        installmentsCount: any;
    }>;
}
