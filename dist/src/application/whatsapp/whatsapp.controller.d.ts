import { WhatsappService } from './whatsapp.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendTemplateDto } from './dto/send-template.dto';
export declare class WhatsappController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsappService);
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
}
