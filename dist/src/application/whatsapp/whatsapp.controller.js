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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const whatsapp_service_1 = require("./whatsapp.service");
const send_message_dto_1 = require("./dto/send-message.dto");
const send_template_dto_1 = require("./dto/send-template.dto");
const send_billing_dto_1 = require("./dto/send-billing.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const prisma_service_1 = require("../../infrastructure/database/prisma.service");
let WhatsappController = class WhatsappController {
    constructor(whatsappService, prisma) {
        this.whatsappService = whatsappService;
        this.prisma = prisma;
    }
    async sendMessage(sendMessageDto) {
        const message = {
            to: sendMessageDto.to,
            message: sendMessageDto.message,
            type: sendMessageDto.type || 'text',
            mediaUrl: sendMessageDto.mediaUrl,
            filename: sendMessageDto.filename,
        };
        const success = await this.whatsappService.sendMessage(message);
        return {
            success,
            message: success ? 'Mensagem enviada com sucesso' : 'Erro ao enviar mensagem',
        };
    }
    async sendTemplate(sendTemplateDto) {
        const template = {
            name: sendTemplateDto.templateName,
            language: sendTemplateDto.language,
            parameters: sendTemplateDto.parameters,
        };
        const success = await this.whatsappService.sendTemplateMessage(template, sendTemplateDto.to);
        return {
            success,
            message: success ? 'Template enviado com sucesso' : 'Erro ao enviar template',
        };
    }
    async validatePhone(phone) {
        const isValid = await this.whatsappService.validatePhoneNumber(phone);
        return {
            isValid,
            message: isValid ? 'Número válido' : 'Número inválido',
        };
    }
    async formatPhone(phone) {
        try {
            const formattedPhone = await this.whatsappService.formatPhoneNumber(phone);
            return {
                success: true,
                formattedPhone,
                message: 'Número formatado com sucesso',
            };
        }
        catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }
    async sendInstallmentBilling(sendBillingDto, user) {
        const companyId = user.companyId || user.id;
        const installment = await this.prisma.installment.findFirst({
            where: {
                id: sendBillingDto.installmentId,
                companyId,
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                sale: {
                    select: {
                        id: true,
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
            throw new common_1.NotFoundException('Parcela não encontrada');
        }
        if (!installment.customer.phone) {
            throw new common_1.BadRequestException('Cliente não possui número de telefone cadastrado');
        }
        if (installment.isPaid) {
            throw new common_1.BadRequestException('Parcela já foi paga completamente');
        }
        const billingData = {
            customerName: installment.customer.name,
            installmentNumber: installment.installmentNumber,
            totalInstallments: installment.totalInstallments,
            amount: installment.amount.toNumber(),
            remainingAmount: installment.remainingAmount.toNumber(),
            dueDate: installment.dueDate,
            description: installment.description,
            saleId: installment.sale.id,
            companyName: installment.company.name,
        };
        const success = await this.whatsappService.sendInstallmentBilling(billingData, installment.customer.phone);
        if (success) {
            await this.prisma.installment.update({
                where: { id: installment.id },
                data: {
                    lastMessageSentAt: new Date(),
                    messageCount: {
                        increment: 1,
                    },
                },
            });
        }
        return {
            success,
            message: success
                ? 'Mensagem de cobrança enviada com sucesso'
                : 'Erro ao enviar mensagem de cobrança',
        };
    }
    async sendCustomerBilling(sendBillingDto, user) {
        const companyId = user.companyId || user.id;
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: sendBillingDto.customerId,
                companyId,
            },
            include: {
                company: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        if (!customer.phone) {
            throw new common_1.BadRequestException('Cliente não possui número de telefone cadastrado');
        }
        let installments;
        if (sendBillingDto.sendAll) {
            installments = await this.prisma.installment.findMany({
                where: {
                    customerId: customer.id,
                    companyId,
                    isPaid: false,
                },
                include: {
                    sale: {
                        select: {
                            id: true,
                            total: true,
                            saleDate: true,
                        },
                    },
                },
                orderBy: {
                    dueDate: 'asc',
                },
            });
        }
        else if (sendBillingDto.installmentIds && sendBillingDto.installmentIds.length > 0) {
            installments = await this.prisma.installment.findMany({
                where: {
                    id: { in: sendBillingDto.installmentIds },
                    customerId: customer.id,
                    companyId,
                    isPaid: false,
                },
                orderBy: {
                    dueDate: 'asc',
                },
            });
        }
        else {
            throw new common_1.BadRequestException('Selecione parcelas para cobrança ou envie todas');
        }
        if (!installments || installments.length === 0) {
            throw new common_1.NotFoundException('Nenhuma parcela pendente encontrada');
        }
        const installmentsData = installments.map(inst => ({
            installmentNumber: inst.installmentNumber,
            totalInstallments: inst.totalInstallments,
            amount: inst.amount.toNumber(),
            remainingAmount: inst.remainingAmount.toNumber(),
            dueDate: inst.dueDate,
            description: inst.description,
        }));
        const success = await this.whatsappService.sendMultipleInstallmentsBilling(customer.name, customer.phone, installmentsData, customer.company.name);
        if (success) {
            await this.prisma.installment.updateMany({
                where: {
                    id: { in: installments.map(inst => inst.id) },
                },
                data: {
                    lastMessageSentAt: new Date(),
                    messageCount: {
                        increment: 1,
                    },
                },
            });
        }
        return {
            success,
            message: success
                ? `Mensagem de cobrança enviada com sucesso para ${installments.length} parcela(s)`
                : 'Erro ao enviar mensagem de cobrança',
            installmentsCount: installments.length,
        };
    }
};
exports.WhatsappController = WhatsappController;
__decorate([
    (0, common_1.Post)('send-message'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar mensagem via WhatsApp' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mensagem enviada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('send-template'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar mensagem de template via WhatsApp' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Template enviado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_template_dto_1.SendTemplateDto]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "sendTemplate", null);
__decorate([
    (0, common_1.Post)('validate-phone'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Validar número de telefone' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resultado da validação' }),
    __param(0, (0, common_1.Body)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "validatePhone", null);
__decorate([
    (0, common_1.Post)('format-phone'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Formatar número de telefone' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Número formatado' }),
    __param(0, (0, common_1.Body)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "formatPhone", null);
__decorate([
    (0, common_1.Post)('send-installment-billing'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar mensagem de cobrança de uma parcela específica' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mensagem de cobrança enviada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Parcela não encontrada' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_billing_dto_1.SendInstallmentBillingDto, Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "sendInstallmentBilling", null);
__decorate([
    (0, common_1.Post)('send-customer-billing'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar mensagem de cobrança para um cliente (todas ou parcelas específicas)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Mensagem de cobrança enviada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_billing_dto_1.SendCustomerBillingDto, Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "sendCustomerBilling", null);
exports.WhatsappController = WhatsappController = __decorate([
    (0, swagger_1.ApiTags)('whatsapp'),
    (0, common_1.Controller)('whatsapp'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappService,
        prisma_service_1.PrismaService])
], WhatsappController);
//# sourceMappingURL=whatsapp.controller.js.map