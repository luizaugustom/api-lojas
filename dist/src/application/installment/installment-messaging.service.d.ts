import { PrismaService } from '../../infrastructure/database/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
export declare class InstallmentMessagingService {
    private readonly prisma;
    private readonly whatsappService;
    private readonly logger;
    constructor(prisma: PrismaService, whatsappService: WhatsappService);
    checkInstallmentsAndSendMessages(): Promise<void>;
    private processCompanyInstallments;
    private shouldSendMessage;
    private sendPaymentMessage;
    private buildDueTodayMessage;
    private buildOverdueMessage;
    testMessageForInstallment(installmentId: string): Promise<any>;
}
