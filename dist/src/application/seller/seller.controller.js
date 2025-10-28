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
exports.SellerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const seller_service_1 = require("./seller.service");
const create_seller_dto_1 = require("./dto/create-seller.dto");
const update_seller_dto_1 = require("./dto/update-seller.dto");
const update_seller_profile_dto_1 = require("./dto/update-seller-profile.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const uuid_validation_pipe_1 = require("../../shared/pipes/uuid-validation.pipe");
let SellerController = class SellerController {
    constructor(sellerService) {
        this.sellerService = sellerService;
    }
    create(user, createSellerDto) {
        return this.sellerService.create(user.companyId, createSellerDto);
    }
    findAll(user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.sellerService.findAll();
        }
        return this.sellerService.findAll(user.companyId);
    }
    findMyProfile(user) {
        return this.sellerService.findOne(user.id);
    }
    getMyStats(user) {
        return this.sellerService.getSellerStats(user.id);
    }
    getMySales(user, page = 1, limit = 10) {
        return this.sellerService.getSellerSales(user.id, user.companyId, page, limit);
    }
    findOne(id, user) {
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.sellerService.findOne(id, user.companyId);
        }
        return this.sellerService.findOne(id);
    }
    getStats(id, user) {
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.sellerService.getSellerStats(id, user.companyId);
        }
        return this.sellerService.getSellerStats(id);
    }
    getSales(id, user, page = 1, limit = 10) {
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.sellerService.getSellerSales(id, user.companyId, page, limit);
        }
        return this.sellerService.getSellerSales(id, undefined, page, limit);
    }
    updateMyProfile(user, updateSellerProfileDto) {
        return this.sellerService.update(user.userId, updateSellerProfileDto);
    }
    update(id, updateSellerDto, user) {
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.sellerService.update(id, updateSellerDto, user.companyId);
        }
        return this.sellerService.update(id, updateSellerDto);
    }
    remove(id, user) {
        if (user.role === roles_decorator_1.UserRole.COMPANY) {
            return this.sellerService.remove(id, user.companyId);
        }
        return this.sellerService.remove(id);
    }
};
exports.SellerController = SellerController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Criar novo vendedor' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Vendedor criado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Login já está em uso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_seller_dto_1.CreateSellerDto]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Listar vendedores' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de vendedores' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my-profile'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter perfil do vendedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Perfil do vendedor' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "findMyProfile", null);
__decorate([
    (0, common_1.Get)('my-stats'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas do vendedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas do vendedor' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.Get)('my-sales'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter vendas do vendedor' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vendas do vendedor' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "getMySales", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar vendedor por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vendedor encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vendedor não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas do vendedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas do vendedor' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id/sales'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter vendas do vendedor' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vendas do vendedor' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "getSales", null);
__decorate([
    (0, common_1.Patch)('my-profile'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar perfil do vendedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Perfil atualizado com sucesso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_seller_profile_dto_1.UpdateSellerProfileDto]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "updateMyProfile", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar vendedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vendedor atualizado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vendedor não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Login já está em uso' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_seller_dto_1.UpdateSellerDto, Object]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Remover vendedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vendedor removido com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Vendedor não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SellerController.prototype, "remove", null);
exports.SellerController = SellerController = __decorate([
    (0, swagger_1.ApiTags)('seller'),
    (0, common_1.Controller)('seller'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [seller_service_1.SellerService])
], SellerController);
//# sourceMappingURL=seller.controller.js.map