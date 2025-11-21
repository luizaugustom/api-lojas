import { PrismaService } from '../../infrastructure/database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
export declare class InstallmentMessagingService {
    private readonly prisma;
    private readonly whatsappService;
    private readonly logger;
    private readonly maxMessagesPerCompanyPerHour;
    private readonly companyMessageCounts;
    constructor(prisma: PrismaService, whatsappService: WhatsappService);
    checkInstallmentsAndSendMessages(): Promise<void>;
    private processCompanyInstallments;
    private canSendMessageForCompany;
    private incrementCompanyMessageCount;
    private shouldSendMessage;
    private sendPaymentMessage;
    private buildDueTodayMessage;
    private buildOverdueMessage;
    testMessageForInstallment(installmentId: string): Promise<any>;
}
