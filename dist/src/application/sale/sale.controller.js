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
exports.SaleController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sale_service_1 = require("./sale.service");
const create_sale_dto_1 = require("./dto/create-sale.dto");
const update_sale_dto_1 = require("./dto/update-sale.dto");
const process_exchange_dto_1 = require("./dto/process-exchange.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
let SaleController = class SaleController {
    constructor(saleService) {
        this.saleService = saleService;
    }
    create(user, createSaleDto) {
        const sellerId = user.role === roles_decorator_1.UserRole.SELLER ? user.id : createSaleDto.sellerId;
        if (!sellerId) {
            throw new common_1.BadRequestException('Vendedor é obrigatório');
        }
        return this.saleService.create(user.companyId, sellerId, createSaleDto);
    }
    findAll(user, page = 1, limit = 10, sellerId, startDate, endDate) {
        const companyId = user.role === roles_decorator_1.UserRole.ADMIN ? undefined : user.companyId;
        const sellerFilter = user.role === roles_decorator_1.UserRole.SELLER ? user.id : sellerId;
        return this.saleService.findAll(companyId, page, limit, sellerFilter, startDate, endDate);
    }
    getStats(user, sellerId, startDate, endDate) {
        const companyId = user.role === roles_decorator_1.UserRole.ADMIN ? undefined : user.companyId;
        return this.saleService.getSalesStats(companyId, sellerId, startDate, endDate);
    }
    getMySales(user, page = 1, limit = 10, startDate, endDate) {
        return this.saleService.findAll(user.companyId, page, limit, user.id, startDate, endDate);
    }
    getMyStats(user, startDate, endDate) {
        return this.saleService.getSalesStats(user.companyId, user.id, startDate, endDate);
    }
    findOne(id, user) {
        const companyId = user.role === roles_decorator_1.UserRole.ADMIN ? undefined : user.companyId;
        return this.saleService.findOne(id, companyId);
    }
    processExchange(user, processExchangeDto) {
        return this.saleService.processExchange(user.companyId, processExchangeDto);
    }
    reprintReceipt(id, user) {
        const companyId = user.role === roles_decorator_1.UserRole.ADMIN ? undefined : user.companyId;
        return this.saleService.reprintReceipt(id, companyId);
    }
    update(id, updateSaleDto, user) {
        const companyId = user.role === roles_decorator_1.UserRole.ADMIN ? undefined : user.companyId;
        return this.saleService.update(id, updateSaleDto, companyId);
    }
    remove(id, user) {
        const companyId = user.role === roles_decorator_1.UserRole.ADMIN ? undefined : user.companyId;
        return this.saleService.remove(id, companyId);
    }
};
exports.SaleController = SaleController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Criar nova venda' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Venda criada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos ou estoque insuficiente' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_sale_dto_1.CreateSaleDto]),
    __metadata("design:returntype", void 0)
], SaleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar vendas' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'sellerId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de vendas' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('sellerId')),
    __param(4, (0, common_1.Query)('startDate')),
    __param(5, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String, String]),
    __metadata("design:returntype", void 0)
], SaleController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas de vendas' }),
    (0, swagger_1.ApiQuery)({ name: 'sellerId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas de vendas' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('sellerId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], SaleController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('my-sales'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter vendas do vendedor logado' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vendas do vendedor' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String]),
    __metadata("design:returntype", void 0)
], SaleController.prototype, "getMySales", null);
__decorate([
    (0, common_1.Get)('my-stats'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas do vendedor logado' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas do vendedor' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SaleController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar venda por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Venda encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Venda não encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SaleController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('exchange'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Processar troca de produto' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Troca processada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, process_exchange_dto_1.ProcessExchangeDto]),
    __metadata("design:returntype", void 0)
], SaleController.prototype, "processExchange", null);
__decorate([
    (0, common_1.Post)(':id/reprint'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Reimprimir cupom da venda' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cupom reimpresso com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Erro ao reimprimir cupom' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SaleController.prototype, "reprintReceipt", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar venda' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Venda atualizada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Venda não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Não é possível editar vendas antigas' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_sale_dto_1.UpdateSaleDto, Object]),
    __metadata("design:returntype", void 0)
], SaleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Remover venda' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Venda removida com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Venda não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Não é possível excluir vendas antigas' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SaleController.prototype, "remove", null);
exports.SaleController = SaleController = __decorate([
    (0, swagger_1.ApiTags)('sale'),
    (0, common_1.Controller)('sale'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [sale_service_1.SaleService])
], SaleController);
//# sourceMappingURL=sale.controller.js.map