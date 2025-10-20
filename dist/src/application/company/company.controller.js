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
const swagger_1 = require("@nestjs/swagger");
const company_service_1 = require("./company.service");
const create_company_dto_1 = require("./dto/create-company.dto");
const update_company_dto_1 = require("./dto/update-company.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
let CompanyController = class CompanyController {
    constructor(companyService) {
        this.companyService = companyService;
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
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar empresa por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Empresa encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Empresa não encontrada' }),
    __param(0, (0, common_1.Param)('id')),
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
    __param(0, (0, common_1.Param)('id')),
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
    __param(0, (0, common_1.Param)('id')),
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
    __param(0, (0, common_1.Param)('id')),
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
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompanyController.prototype, "remove", null);
exports.CompanyController = CompanyController = __decorate([
    (0, swagger_1.ApiTags)('company'),
    (0, common_1.Controller)('company'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [company_service_1.CompanyService])
], CompanyController);
//# sourceMappingURL=company.controller.js.map