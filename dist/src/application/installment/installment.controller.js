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
exports.InstallmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const installment_service_1 = require("./installment.service");
const create_installment_dto_1 = require("./dto/create-installment.dto");
const update_installment_dto_1 = require("./dto/update-installment.dto");
const pay_installment_dto_1 = require("./dto/pay-installment.dto");
const bulk_pay_installments_dto_1 = require("./dto/bulk-pay-installments.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const uuid_validation_pipe_1 = require("../../shared/pipes/uuid-validation.pipe");
let InstallmentController = class InstallmentController {
    constructor(installmentService) {
        this.installmentService = installmentService;
    }
    create(user, createInstallmentDto) {
        return this.installmentService.create(user.companyId, createInstallmentDto);
    }
    findAll(user, customerId, isPaid) {
        const isPaidBool = isPaid === 'true' ? true : isPaid === 'false' ? false : undefined;
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.installmentService.findAll(undefined, customerId, isPaidBool);
        }
        return this.installmentService.findAll(user.companyId, customerId, isPaidBool);
    }
    findOverdue(user, customerId) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.installmentService.findOverdue(undefined, customerId);
        }
        return this.installmentService.findOverdue(user.companyId, customerId);
    }
    getStats(user) {
        return this.installmentService.getCompanyStats(user.companyId);
    }
    getCustomerDebtSummary(customerId, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.installmentService.getCustomerDebtSummary(customerId);
        }
        return this.installmentService.getCustomerDebtSummary(customerId, user.companyId);
    }
    findOne(id, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.installmentService.findOne(id);
        }
        return this.installmentService.findOne(id, user.companyId);
    }
    update(id, updateInstallmentDto, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.installmentService.update(id, updateInstallmentDto);
        }
        return this.installmentService.update(id, updateInstallmentDto, user.companyId);
    }
    pay(id, payInstallmentDto, user) {
        return this.installmentService.payInstallment(id, payInstallmentDto, user.companyId);
    }
    bulkPay(customerId, bulkPayInstallmentsDto, user) {
        return this.installmentService.payCustomerInstallments(customerId, bulkPayInstallmentsDto, user.companyId);
    }
    remove(id, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.installmentService.remove(id);
        }
        return this.installmentService.remove(id, user.companyId);
    }
};
exports.InstallmentController = InstallmentController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Criar nova parcela' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Parcela criada com sucesso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_installment_dto_1.CreateInstallmentDto]),
    __metadata("design:returntype", void 0)
], InstallmentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar parcelas' }),
    (0, swagger_1.ApiQuery)({ name: 'customerId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'isPaid', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de parcelas' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('customerId')),
    __param(2, (0, common_1.Query)('isPaid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], InstallmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('overdue'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar parcelas vencidas' }),
    (0, swagger_1.ApiQuery)({ name: 'customerId', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de parcelas vencidas' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], InstallmentController.prototype, "findOverdue", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas de parcelas da empresa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas de parcelas' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InstallmentController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('customer/:customerId/summary'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter resumo de dívidas de um cliente' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resumo de dívidas do cliente' }),
    __param(0, (0, common_1.Param)('customerId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InstallmentController.prototype, "getCustomerDebtSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar parcela por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Parcela encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Parcela não encontrada' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InstallmentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar parcela' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Parcela atualizada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Parcela não encontrada' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_installment_dto_1.UpdateInstallmentDto, Object]),
    __metadata("design:returntype", void 0)
], InstallmentController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/pay'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Pagar parcela (total ou parcial)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pagamento registrado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Parcela não encontrada' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pay_installment_dto_1.PayInstallmentDto, Object]),
    __metadata("design:returntype", void 0)
], InstallmentController.prototype, "pay", null);
__decorate([
    (0, common_1.Post)('customer/:customerId/pay/bulk'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Pagar múltiplas parcelas de um cliente' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pagamentos registrados com sucesso' }),
    __param(0, (0, common_1.Param)('customerId', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, bulk_pay_installments_dto_1.BulkPayInstallmentsDto, Object]),
    __metadata("design:returntype", void 0)
], InstallmentController.prototype, "bulkPay", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Remover parcela' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Parcela removida com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Parcela não encontrada' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InstallmentController.prototype, "remove", null);
exports.InstallmentController = InstallmentController = __decorate([
    (0, swagger_1.ApiTags)('installment'),
    (0, common_1.Controller)('installment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [installment_service_1.InstallmentService])
], InstallmentController);
//# sourceMappingURL=installment.controller.js.map