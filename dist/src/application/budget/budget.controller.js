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
exports.BudgetController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const budget_service_1 = require("./budget.service");
const create_budget_dto_1 = require("./dto/create-budget.dto");
const update_budget_dto_1 = require("./dto/update-budget.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const client_time_util_1 = require("../../shared/utils/client-time.util");
const data_period_util_1 = require("../../shared/utils/data-period.util");
let BudgetController = class BudgetController {
    constructor(budgetService) {
        this.budgetService = budgetService;
    }
    async create(user, createBudgetDto) {
        console.log('[BudgetController] User:', { id: user.id, role: user.role, companyId: user.companyId });
        console.log('[BudgetController] DTO:', JSON.stringify(createBudgetDto, null, 2));
        const companyId = user.role === roles_decorator_1.UserRole.COMPANY ? user.id : user.companyId;
        const sellerId = user.role === roles_decorator_1.UserRole.SELLER ? user.id : createBudgetDto.sellerId;
        if (!companyId) {
            throw new Error('Company ID não encontrado no usuário');
        }
        console.log('[BudgetController] Creating budget for company:', companyId, 'seller:', sellerId);
        return this.budgetService.create(companyId, sellerId, createBudgetDto);
    }
    async findAll(user, status, sellerId, startDate, endDate) {
        const companyId = user.role === roles_decorator_1.UserRole.COMPANY ? user.id : user.companyId;
        const filterSellerId = user.role === roles_decorator_1.UserRole.SELLER ? user.id : sellerId;
        let effectiveStartDate = startDate;
        let effectiveEndDate = endDate;
        if (!startDate && !endDate) {
            const range = (0, data_period_util_1.resolveDataPeriodRangeAsISOString)(user.dataPeriod);
            effectiveStartDate = range.startDate;
            effectiveEndDate = range.endDate;
        }
        return this.budgetService.findAll(companyId, filterSellerId, status, effectiveStartDate, effectiveEndDate);
    }
    async findOne(user, id) {
        const companyId = user.role === roles_decorator_1.UserRole.COMPANY ? user.id : user.companyId;
        return this.budgetService.findOne(id, companyId);
    }
    async update(user, id, updateBudgetDto) {
        const companyId = user.role === roles_decorator_1.UserRole.COMPANY ? user.id : user.companyId;
        return this.budgetService.update(id, companyId, updateBudgetDto);
    }
    async remove(user, id) {
        const companyId = user.role === roles_decorator_1.UserRole.COMPANY ? user.id : user.companyId;
        return this.budgetService.remove(id, companyId);
    }
    async print(user, id, req) {
        const companyId = user.role === roles_decorator_1.UserRole.COMPANY ? user.id : user.companyId;
        const computerId = req.headers['x-computer-id'] || null;
        const clientTimeInfo = (0, client_time_util_1.extractClientTimeInfo)(req);
        return this.budgetService.printBudget(id, companyId, computerId, clientTimeInfo);
    }
    async generatePdf(user, id, req, res) {
        const companyId = user.role === roles_decorator_1.UserRole.COMPANY ? user.id : user.companyId;
        const budget = await this.budgetService.findOne(id, companyId);
        const clientTimeInfo = (0, client_time_util_1.extractClientTimeInfo)(req);
        const pdfBuffer = await this.budgetService.generatePdf(id, companyId, clientTimeInfo);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="orcamento-${budget.budgetNumber}.pdf"`);
        return res.status(common_1.HttpStatus.OK).send(pdfBuffer);
    }
    async convertToSale(user, id) {
        const companyId = user.role === roles_decorator_1.UserRole.COMPANY ? user.id : user.companyId;
        const sellerId = user.role === roles_decorator_1.UserRole.SELLER ? user.id : undefined;
        return this.budgetService.convertToSale(id, companyId, sellerId);
    }
};
exports.BudgetController = BudgetController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Criar novo orçamento' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Orçamento criado com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Dados inválidos',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_budget_dto_1.CreateBudgetDto]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos os orçamentos' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de orçamentos retornada com sucesso',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('sellerId')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar orçamento por ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Orçamento encontrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Orçamento não encontrado',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar orçamento' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Orçamento atualizado com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Orçamento não encontrado',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_budget_dto_1.UpdateBudgetDto]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir orçamento' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Orçamento excluído com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Orçamento não encontrado',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/print'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Imprimir orçamento' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Orçamento enviado para impressão',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Orçamento não encontrado',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "print", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Gerar PDF do orçamento' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'PDF gerado com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Orçamento não encontrado',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "generatePdf", null);
__decorate([
    (0, common_1.Post)(':id/convert-to-sale'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Converter orçamento em venda' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Orçamento aprovado para conversão em venda',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Orçamento não pode ser convertido',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Orçamento não encontrado',
    }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BudgetController.prototype, "convertToSale", null);
exports.BudgetController = BudgetController = __decorate([
    (0, swagger_1.ApiTags)('budgets'),
    (0, common_1.Controller)('budget'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [budget_service_1.BudgetService])
], BudgetController);
//# sourceMappingURL=budget.controller.js.map