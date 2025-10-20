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
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const n8n_service_1 = require("./n8n.service");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
let N8nController = class N8nController {
    constructor(n8nService) {
        this.n8nService = n8nService;
    }
    async testWebhook() {
        const success = await this.n8nService.testWebhook();
        return {
            success,
            message: success ? 'Webhook testado com sucesso' : 'Erro ao testar webhook',
        };
    }
    async getStatus() {
        const status = await this.n8nService.getWebhookStatus();
        return status;
    }
    async getWebhookUrl() {
        const url = this.n8nService.getWebhookUrl();
        return {
            webhookUrl: url,
            message: 'URL do webhook N8N',
        };
    }
};
exports.N8nController = N8nController;
__decorate([
    (0, common_1.Post)('test'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Testar webhook do N8N' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook testado com sucesso' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], N8nController.prototype, "testWebhook", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter status da integração N8N' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status da integração' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], N8nController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('webhook-url'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter URL do webhook N8N' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'URL do webhook' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], N8nController.prototype, "getWebhookUrl", null);
exports.N8nController = N8nController = __decorate([
    (0, swagger_1.ApiTags)('n8n'),
    (0, common_1.Controller)('n8n'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [n8n_service_1.N8nService])
], N8nController);
//# sourceMappingURL=n8n.controller.js.map