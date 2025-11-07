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
exports.CashClosureController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cash_closure_service_1 = require("./cash-closure.service");
const create_cash_closure_dto_1 = require("./dto/create-cash-closure.dto");
const close_cash_closure_dto_1 = require("./dto/close-cash-closure.dto");
const reprint_cash_closure_dto_1 = require("./dto/reprint-cash-closure.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const uuid_validation_pipe_1 = require("../../shared/pipes/uuid-validation.pipe");
let CashClosureController = class CashClosureController {
    constructor(cashClosureService) {
        this.cashClosureService = cashClosureService;
    }
    create(user, createCashClosureDto) {
        const sellerId = user.role === roles_decorator_1.UserRole.SELLER ? user.userId : undefined;
        return this.cashClosureService.create(user.companyId, createCashClosureDto, sellerId);
    }
    findAll(user, page = 1, limit = 10, isClosed) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.cashClosureService.findAll(undefined, page, limit, isClosed);
        }
        return this.cashClosureService.findAll(user.companyId, page, limit, isClosed);
    }
    getCurrent(user) {
        const sellerId = user.role === roles_decorator_1.UserRole.SELLER ? user.userId : undefined;
        return this.cashClosureService.getCurrentClosure(user.companyId, sellerId);
    }
    getStats(user) {
        const sellerId = user.role === roles_decorator_1.UserRole.SELLER ? user.userId : undefined;
        return this.cashClosureService.getCashClosureStats(user.companyId, sellerId);
    }
    getHistory(user, page = 1, limit = 10) {
        return this.cashClosureService.getClosureHistory(user.companyId, page, limit);
    }
    findOne(id, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.cashClosureService.findOne(id);
        }
        return this.cashClosureService.findOne(id, user.companyId);
    }
    close(user, closeCashClosureDto, req) {
        const sellerId = user.role === roles_decorator_1.UserRole.SELLER ? user.userId : undefined;
        const computerId = req.headers['x-computer-id'] || null;
        return this.cashClosureService.close(user.companyId, closeCashClosureDto, sellerId, computerId);
    }
    reprintReport(id, user, req, reprintDto) {
        const computerId = req.headers['x-computer-id'] || null;
        const includeSaleDetails = reprintDto?.includeSaleDetails ?? false;
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.cashClosureService.reprintReport(id, undefined, computerId, includeSaleDetails);
        }
        return this.cashClosureService.reprintReport(id, user.companyId, computerId, includeSaleDetails);
    }
    getPrintContent(id, user, includeSaleDetails) {
        const includeDetails = includeSaleDetails ?? false;
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.cashClosureService.getReportContent(id, undefined, includeDetails);
        }
        return this.cashClosureService.getReportContent(id, user.companyId, includeDetails);
    }
};
exports.CashClosureController = CashClosureController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Abrir novo fechamento de caixa' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Fechamento de caixa criado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Já existe um fechamento de caixa aberto' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_cash_closure_dto_1.CreateCashClosureDto]),
    __metadata("design:returntype", void 0)
], CashClosureController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Listar fechamentos de caixa' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'isClosed', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de fechamentos de caixa' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('isClosed', new common_1.ParseBoolPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Boolean]),
    __metadata("design:returntype", void 0)
], CashClosureController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter fechamento de caixa atual' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fechamento de caixa atual' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Não há fechamento de caixa aberto' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CashClosureController.prototype, "getCurrent", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas do fechamento de caixa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas do fechamento de caixa' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CashClosureController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter histórico de fechamentos de caixa' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Histórico de fechamentos de caixa' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], CashClosureController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar fechamento de caixa por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fechamento de caixa encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Fechamento de caixa não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CashClosureController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('close'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Fechar fechamento de caixa atual' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fechamento de caixa fechado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Não há fechamento de caixa aberto' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, close_cash_closure_dto_1.CloseCashClosureDto, Object]),
    __metadata("design:returntype", void 0)
], CashClosureController.prototype, "close", null);
__decorate([
    (0, common_1.Post)(':id/reprint'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Reimprimir relatório de fechamento de caixa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Relatório reimpresso com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Erro ao reimprimir relatório' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, reprint_cash_closure_dto_1.ReprintCashClosureDto]),
    __metadata("design:returntype", void 0)
], CashClosureController.prototype, "reprintReport", null);
__decorate([
    (0, common_1.Get)(':id/print-content'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter conteúdo do relatório de fechamento para impressão' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conteúdo pronto para impressão' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('includeSaleDetails', new common_1.ParseBoolPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Boolean]),
    __metadata("design:returntype", void 0)
], CashClosureController.prototype, "getPrintContent", null);
exports.CashClosureController = CashClosureController = __decorate([
    (0, swagger_1.ApiTags)('cash'),
    (0, common_1.Controller)('cash-closure'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [cash_closure_service_1.CashClosureService])
], CashClosureController);
//# sourceMappingURL=cash-closure.controller.js.map