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
exports.BillToPayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bill_to_pay_service_1 = require("./bill-to-pay.service");
const create_bill_to_pay_dto_1 = require("./dto/create-bill-to-pay.dto");
const update_bill_to_pay_dto_1 = require("./dto/update-bill-to-pay.dto");
const mark_as_paid_dto_1 = require("./dto/mark-as-paid.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const uuid_validation_pipe_1 = require("../../shared/pipes/uuid-validation.pipe");
let BillToPayController = class BillToPayController {
    constructor(billToPayService) {
        this.billToPayService = billToPayService;
    }
    create(user, createBillToPayDto) {
        return this.billToPayService.create(user.companyId, createBillToPayDto);
    }
    findAll(user, page = 1, limit = 10, isPaid, startDate, endDate) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.billToPayService.findAll(undefined, page, limit, isPaid, startDate, endDate);
        }
        return this.billToPayService.findAll(user.companyId, page, limit, isPaid, startDate, endDate);
    }
    getStats(user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.billToPayService.getBillStats();
        }
        return this.billToPayService.getBillStats(user.companyId);
    }
    getOverdue(user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.billToPayService.getOverdueBills();
        }
        return this.billToPayService.getOverdueBills(user.companyId);
    }
    getUpcoming(user, days = 7) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.billToPayService.getUpcomingBills(undefined, days);
        }
        return this.billToPayService.getUpcomingBills(user.companyId, days);
    }
    findOne(id, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.billToPayService.findOne(id);
        }
        return this.billToPayService.findOne(id, user.companyId);
    }
    update(id, updateBillToPayDto, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.billToPayService.update(id, updateBillToPayDto);
        }
        return this.billToPayService.update(id, updateBillToPayDto, user.companyId);
    }
    markAsPaid(id, markAsPaidDto, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.billToPayService.markAsPaid(id, markAsPaidDto);
        }
        return this.billToPayService.markAsPaid(id, markAsPaidDto, user.companyId);
    }
    remove(id, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.billToPayService.remove(id);
        }
        return this.billToPayService.remove(id, user.companyId);
    }
};
exports.BillToPayController = BillToPayController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Criar nova conta a pagar' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Conta a pagar criada com sucesso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_bill_to_pay_dto_1.CreateBillToPayDto]),
    __metadata("design:returntype", void 0)
], BillToPayController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Listar contas a pagar' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'isPaid', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de contas a pagar' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('isPaid', new common_1.ParseBoolPipe({ optional: true }))),
    __param(4, (0, common_1.Query)('startDate')),
    __param(5, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Boolean, String, String]),
    __metadata("design:returntype", void 0)
], BillToPayController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas das contas a pagar' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas das contas a pagar' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillToPayController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('overdue'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Listar contas em atraso' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de contas em atraso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillToPayController.prototype, "getOverdue", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Listar contas próximas do vencimento' }),
    (0, swagger_1.ApiQuery)({ name: 'days', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de contas próximas do vencimento' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], BillToPayController.prototype, "getUpcoming", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar conta a pagar por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conta a pagar encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Conta a pagar não encontrada' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BillToPayController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar conta a pagar' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conta a pagar atualizada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Conta a pagar não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Não é possível editar conta já paga' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_bill_to_pay_dto_1.UpdateBillToPayDto, Object]),
    __metadata("design:returntype", void 0)
], BillToPayController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/mark-paid'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar conta como paga' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conta marcada como paga com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Conta a pagar não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Conta já está marcada como paga' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, mark_as_paid_dto_1.MarkAsPaidDto, Object]),
    __metadata("design:returntype", void 0)
], BillToPayController.prototype, "markAsPaid", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Remover conta a pagar' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conta a pagar removida com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Conta a pagar não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Não é possível excluir conta já paga' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BillToPayController.prototype, "remove", null);
exports.BillToPayController = BillToPayController = __decorate([
    (0, swagger_1.ApiTags)('bill'),
    (0, common_1.Controller)('bill-to-pay'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [bill_to_pay_service_1.BillToPayService])
], BillToPayController);
//# sourceMappingURL=bill-to-pay.controller.js.map