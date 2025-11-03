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
exports.CompanyController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const company_service_1 = require("./company.service");
const create_company_dto_1 = require("./dto/create-company.dto");
const update_company_dto_1 = require("./dto/update-company.dto");
const update_fiscal_config_dto_1 = require("./dto/update-fiscal-config.dto");
const update_catalog_page_dto_1 = require("./dto/update-catalog-page.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const uuid_validation_pipe_1 = require("../../shared/pipes/uuid-validation.pipe");
const plan_limits_service_1 = require("../../shared/services/plan-limits.service");
let CompanyController = class CompanyController {
    constructor(companyService, planLimitsService) {
        this.companyService = companyService;
        this.planLimitsService = planLimitsService;
    }
    create(user, createCompanyDto) {
        return this.companyService.create(user.id, createCompanyDto);
    }
    findAll(user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.companyService.findAll();
        }
        return this.companyService.findAll(user.companyId);
    }
    findMyCompany(user) {
        return this.companyService.findOne(user.companyId);
    }
    getStats(user) {
        return this.companyService.getCompanyStats(user.companyId);
    }
    getPlanUsage(user) {
        return this.planLimitsService.getCompanyUsageStats(user.companyId);
    }
    getPlanWarnings(user) {
        return this.planLimitsService.checkNearLimits(user.companyId);
    }
    findOne(id) {
        return this.companyService.findOne(id);
    }
    updateMyCompany(user, updateCompanyDto) {
        return this.companyService.update(user.companyId, updateCompanyDto);
    }
    activate(id) {
        return this.companyService.activate(id);
    }
    deactivate(id) {
        return this.companyService.deactivate(id);
    }
    update(id, updateCompanyDto) {
        return this.companyService.update(id, updateCompanyDto);
    }
    remove(id) {
        return this.companyService.remove(id);
    }
    updateFiscalConfig(user, updateFiscalConfigDto) {
        return this.companyService.updateFiscalConfig(user.companyId, updateFiscalConfigDto);
    }
    getFiscalConfig(user) {
        return this.companyService.getFiscalConfig(user.companyId);
    }
    async hasValidFiscalConfig(user) {
        const isValid = await this.companyService.hasValidFiscalConfig(user.companyId);
        return { hasValidConfig: isValid };
    }
    uploadCertificate(user, file) {
        return this.companyService.uploadCertificateToFocusNfe(user.companyId, file);
    }
    uploadLogo(user, file) {
        return this.companyService.uploadLogo(user.companyId, file);
    }
    removeLogo(user) {
        return this.companyService.removeLogo(user.companyId);
    }
    enableAutoMessages(user) {
        return this.companyService.toggleAutoMessages(user.companyId, true);
    }
    disableAutoMessages(user) {
        return this.companyService.toggleAutoMessages(user.companyId, false);
    }
    getAutoMessageStatus(user) {
        return this.companyService.getAutoMessageStatus(user.companyId);
    }
    updateCatalogPage(user, updateCatalogPageDto) {
        return this.companyService.updateCatalogPage(user.companyId, updateCatalogPageDto);
    }
    getCatalogPageConfig(user) {
        return this.companyService.getCatalogPageConfig(user.companyId);
    }
};
exports.CompanyController = CompanyController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Criar nova empresa' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Empresa criada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Dados já estão em uso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_company_dto_1.CreateCompanyDto]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Listar empresas' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de empresas' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my-company'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter dados da própria empresa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dados da empresa' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "findMyCompany", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas da empresa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas da empresa' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('plan-usage'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas de uso do plano' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas de uso do plano da empresa' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "getPlanUsage", null);
__decorate([
    (0, common_1.Get)('plan-warnings'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar alertas de limites próximos' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alertas sobre limites próximos de serem atingidos' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "getPlanWarnings", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar empresa por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Empresa encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'ID inválido' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('my-company'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar dados da própria empresa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Empresa atualizada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Dados já estão em uso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_company_dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "updateMyCompany", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Ativar empresa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Empresa ativada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'ID inválido' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "activate", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Desativar empresa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Empresa desativada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'ID inválido' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar empresa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Empresa atualizada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Dados já estão em uso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'ID inválido' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_company_dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Remover empresa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Empresa removida com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'ID inválido' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)('my-company/fiscal-config'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar configurações fiscais (Focus NFe)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configurações fiscais atualizadas com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_fiscal_config_dto_1.UpdateFiscalConfigDto]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "updateFiscalConfig", null);
__decorate([
    (0, common_1.Get)('my-company/fiscal-config'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter configurações fiscais (dados sensíveis mascarados)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configurações fiscais' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "getFiscalConfig", null);
__decorate([
    (0, common_1.Get)('my-company/fiscal-config/valid'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar se a empresa tem configuração fiscal válida para emissão de NFCe' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status da configuração fiscal' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "hasValidFiscalConfig", null);
__decorate([
    (0, common_1.Post)('my-company/upload-certificate'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('certificate')),
    (0, swagger_1.ApiOperation)({ summary: 'Upload do certificado digital para Focus NFe' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificado enviado com sucesso ao Focus NFe' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Erro no upload ou certificado inválido' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "uploadCertificate", null);
__decorate([
    (0, common_1.Post)('my-company/upload-logo'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo')),
    (0, swagger_1.ApiOperation)({ summary: 'Upload do logo da empresa' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        description: 'Logo da empresa',
        schema: {
            type: 'object',
            properties: {
                logo: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logo enviado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Erro no upload ou arquivo inválido' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Delete)('my-company/logo'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Remover logo da empresa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logo removido com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "removeLogo", null);
__decorate([
    (0, common_1.Patch)('my-company/auto-message/enable'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Ativar envio automático de mensagens de cobrança' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Envio automático de mensagens ativado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "enableAutoMessages", null);
__decorate([
    (0, common_1.Patch)('my-company/auto-message/disable'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Desativar envio automático de mensagens de cobrança' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Envio automático de mensagens desativado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "disableAutoMessages", null);
__decorate([
    (0, common_1.Get)('my-company/auto-message/status'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar status do envio automático de mensagens' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status do envio automático de mensagens' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "getAutoMessageStatus", null);
__decorate([
    (0, common_1.Patch)('my-company/catalog-page'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Configurar página de catálogo pública' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configurações da página de catálogo atualizadas' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'URL já está em uso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_catalog_page_dto_1.UpdateCatalogPageDto]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "updateCatalogPage", null);
__decorate([
    (0, common_1.Get)('my-company/catalog-page'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter configurações da página de catálogo' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configurações da página de catálogo' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "getCatalogPageConfig", null);
exports.CompanyController = CompanyController = __decorate([
    (0, swagger_1.ApiTags)('company'),
    (0, common_1.Controller)('company'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [company_service_1.CompanyService,
        plan_limits_service_1.PlanLimitsService])
], CompanyController);
//# sourceMappingURL=company.controller.js.map