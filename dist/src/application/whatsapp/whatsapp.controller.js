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
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
let WhatsappController = class WhatsappController {
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
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
exports.WhatsappController = WhatsappController = __decorate([
    (0, swagger_1.ApiTags)('whatsapp'),
    (0, common_1.Controller)('whatsapp'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappService])
], WhatsappController);
//# sourceMappingURL=whatsapp.controller.js.map