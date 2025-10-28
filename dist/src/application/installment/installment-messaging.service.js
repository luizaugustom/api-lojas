"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InstallmentMessagingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallmentMessagingService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let InstallmentMessagingService = InstallmentMessagingService_1 = class InstallmentMessagingService {
    constructor(prisma, whatsappService) {
        this.prisma = prisma;
        this.whatsappService = whatsappService;
        this.logger = new common_1.Logger(InstallmentMessagingService_1.name);
    }
    async checkInstallmentsAndSendMessages() {
        this.logger.log('Iniciando verificação de parcelas para envio de mensagens automáticas...');
        try {
            const companies = await this.prisma.company.findMany({
                where: {
                    autoMessageEnabled: true,
                    isActive: true,
                },
                select: {
                    id: true,
                    name: true,
                },
            });
            this.logger.log(`Encontradas ${companies.length} empresas com envio automático ativado`);
            for (const company of companies) {
                await this.processCompanyInstallments(company.id, company.name);
            }
            this.logger.log('Verificação de parcelas concluída com sucesso');
        }
        catch (error) {
            this.logger.error('Erro ao verificar parcelas:', error);
        }
    }
    async processCompanyInstallments(companyId, companyName) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const installments = await this.prisma.installment.findMany({
                where: {
                    companyId,
                    isPaid: false,
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                },
            });
            this.logger.log(`Empresa ${companyName}: ${installments.length} parcelas não pagas encontradas`);
            for (const installment of installments) {
                if (await this.shouldSendMessage(installment, today)) {
                    await this.sendPaymentMessage(installment, companyName);
                }
            }
        }
        catch (error) {
            this.logger.error(`Erro ao processar parcelas da empresa ${companyId}:`, error);
        }
    }
    async shouldSendMessage(installment, today) {
        const dueDate = new Date(installment.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate.getTime() === today.getTime()) {
            if (!installment.lastMessageSentAt) {
                return true;
            }
            const lastSent = new Date(installment.lastMessageSentAt);
            lastSent.setHours(0, 0, 0, 0);
            return lastSent.getTime() !== today.getTime();
        }
        if (dueDate < today) {
            if (!installment.lastMessageSentAt) {
                return true;
            }
            const lastSent = new Date(installment.lastMessageSentAt);
            lastSent.setHours(0, 0, 0, 0);
            const diffTime = today.getTime() - lastSent.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 3;
        }
        return false;
    }
    async sendPaymentMessage(installment, companyName) {
        try {
            if (!installment.customer.phone) {
                this.logger.warn(`Cliente ${installment.customer.name} não possui telefone cadastrado. Parcela ID: ${installment.id}`);
                return;
            }
            const isValid = await this.whatsappService.validatePhoneNumber(installment.customer.phone);
            if (!isValid) {
                this.logger.warn(`Telefone inválido para cliente ${installment.customer.name}: ${installment.customer.phone}`);
                return;
            }
            const formattedPhone = await this.whatsappService.formatPhoneNumber(installment.customer.phone);
            const dueDate = new Date(installment.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let message;
            if (dueDate.getTime() === today.getTime()) {
                message = this.buildDueTodayMessage(companyName, installment);
            }
            else {
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                message = this.buildOverdueMessage(companyName, installment, daysOverdue);
            }
            const success = await this.whatsappService.sendMessage({
                to: formattedPhone,
                message,
                type: 'text',
            });
            if (success) {
                await this.prisma.installment.update({
                    where: { id: installment.id },
                    data: {
                        lastMessageSentAt: new Date(),
                        messageCount: installment.messageCount + 1,
                    },
                });
                this.logger.log(`Mensagem enviada com sucesso para ${installment.customer.name} (${formattedPhone}). Parcela ID: ${installment.id}`);
            }
            else {
                this.logger.error(`Falha ao enviar mensagem para ${installment.customer.name} (${formattedPhone}). Parcela ID: ${installment.id}`);
            }
        }
        catch (error) {
            this.logger.error(`Erro ao enviar mensagem de cobrança. Parcela ID: ${installment.id}`, error);
        }
    }
    buildDueTodayMessage(companyName, installment) {
        const amount = installment.remainingAmount.toNumber();
        const formattedAmount = amount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
        return `
🔔 *LEMBRETE DE PAGAMENTO*

Olá, ${installment.customer.name}!

📅 *HOJE É O VENCIMENTO* da sua parcela ${installment.installmentNumber}/${installment.totalInstallments} na loja *${companyName}*.

💰 *Valor:* ${formattedAmount}

Por favor, dirija-se à loja para efetuar o pagamento e manter seu crédito em dia.

Agradecemos a sua preferência! 🙏
    `.trim();
    }
    buildOverdueMessage(companyName, installment, daysOverdue) {
        const amount = installment.remainingAmount.toNumber();
        const formattedAmount = amount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
        const dueDate = new Date(installment.dueDate);
        const formattedDueDate = dueDate.toLocaleDateString('pt-BR');
        return `
⚠️ *PAGAMENTO EM ATRASO*

Olá, ${installment.customer.name}!

Sua parcela ${installment.installmentNumber}/${installment.totalInstallments} na loja *${companyName}* está *${daysOverdue} dia(s) atrasada*.

📅 *Vencimento:* ${formattedDueDate}
💰 *Valor:* ${formattedAmount}

Por favor, dirija-se à loja o quanto antes para regularizar sua situação e evitar transtornos.

Contamos com você! 🙏
    `.trim();
    }
    async testMessageForInstallment(installmentId) {
        try {
            const installment = await this.prisma.installment.findUnique({
                where: { id: installmentId },
                include: {
                    customer: {
                        select: {
                            name: true,
                            phone: true,
                        },
                    },
                    company: {
                        select: {
                            name: true,
                        },
                    },
                },
            });
            if (!installment) {
                return { success: false, message: 'Parcela não encontrada' };
            }
            if (installment.isPaid) {
                return { success: false, message: 'Parcela já está paga' };
            }
            await this.sendPaymentMessage(installment, installment.company.name);
            return {
                success: true,
                message: 'Mensagem de teste enviada com sucesso',
                phone: installment.customer.phone,
                customerName: installment.customer.name,
            };
        }
        catch (error) {
            this.logger.error('Erro ao enviar mensagem de teste:', error);
            return { success: false, message: 'Erro ao enviar mensagem', error: error.message };
        }
    }
};
exports.InstallmentMessagingService = InstallmentMessagingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstallmentMessagingService.prototype, "checkInstallmentsAndSendMessages", null);
exports.InstallmentMessagingService = InstallmentMessagingService = InstallmentMessagingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsappService])
], InstallmentMessagingService);
//# sourceMappingURL=installment-messaging.service.js.map