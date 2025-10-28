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
exports.CustomerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const customer_service_1 = require("./customer.service");
const create_customer_dto_1 = require("./dto/create-customer.dto");
const update_customer_dto_1 = require("./dto/update-customer.dto");
const send_email_dto_1 = require("./dto/send-email.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const uuid_validation_pipe_1 = require("../../shared/pipes/uuid-validation.pipe");
let CustomerController = class CustomerController {
    constructor(customerService) {
        this.customerService = customerService;
    }
    create(user, createCustomerDto) {
        return this.customerService.create(user.companyId, createCustomerDto);
    }
    findAll(user, page = 1, limit = 10, search) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.customerService.findAll(undefined, page, limit, search);
        }
        return this.customerService.findAll(user.companyId, page, limit, search);
    }
    getStats(user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.customerService.getCustomerStats();
        }
        return this.customerService.getCustomerStats(user.companyId);
    }
    findByCpfCnpj(cpfCnpj, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.customerService.findByCpfCnpj(cpfCnpj);
        }
        return this.customerService.findByCpfCnpj(cpfCnpj, user.companyId);
    }
    findOne(id, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.customerService.findOne(id);
        }
        return this.customerService.findOne(id, user.companyId);
    }
    getInstallments(id, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.customerService.getCustomerInstallments(id);
        }
        return this.customerService.getCustomerInstallments(id, user.companyId);
    }
    update(id, updateCustomerDto, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.customerService.update(id, updateCustomerDto);
        }
        return this.customerService.update(id, updateCustomerDto, user.companyId);
    }
    sendPromotionalEmail(id, promotionalEmailDto, user) {
        return this.customerService.sendPromotionalEmail(id, promotionalEmailDto);
    }
    sendSaleConfirmationEmail(id, saleId, user) {
        return this.customerService.sendSaleConfirmationEmail(id, saleId);
    }
    sendBulkPromotionalEmail(bulkPromotionalEmailDto, user) {
        return this.customerService.sendBulkPromotionalEmail(user.companyId, bulkPromotionalEmailDto);
    }
    remove(id, user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.customerService.remove(id);
        }
        return this.customerService.remove(id, user.companyId);
    }
};
exports.CustomerController = CustomerController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Criar novo cliente' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Cliente criado com sucesso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_customer_dto_1.CreateCustomerDto]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Listar clientes' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de clientes' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(2, (0, common_1.Query)('limit', new common_1.ParseIntPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas dos clientes' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estatísticas dos clientes' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('cpf-cnpj/:cpfCnpj'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar cliente por CPF/CNPJ' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado' }),
    __param(0, (0, common_1.Param)('cpfCnpj')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "findByCpfCnpj", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar cliente por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/installments'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY, roles_decorator_1.UserRole.SELLER),
    (0, swagger_1.ApiOperation)({ summary: 'Obter vendas a prazo do cliente' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Vendas a prazo do cliente' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "getInstallments", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar cliente' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente atualizado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_customer_dto_1.UpdateCustomerDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/send-promotional-email'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar email promocional para cliente específico' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email promocional enviado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_email_dto_1.SendPromotionalEmailDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "sendPromotionalEmail", null);
__decorate([
    (0, common_1.Post)(':id/send-sale-confirmation/:saleId'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar confirmação de venda por email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email de confirmação enviado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente ou venda não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Param)('saleId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "sendSaleConfirmationEmail", null);
__decorate([
    (0, common_1.Post)('send-bulk-promotional-email'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar email promocional para todos os clientes da empresa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Emails promocionais enviados' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_email_dto_1.SendBulkPromotionalEmailDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "sendBulkPromotionalEmail", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Remover cliente' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cliente removido com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cliente não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerController.prototype, "remove", null);
exports.CustomerController = CustomerController = __decorate([
    (0, swagger_1.ApiTags)('customer'),
    (0, common_1.Controller)('customer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [customer_service_1.CustomerService])
], CustomerController);
//# sourceMappingURL=customer.controller.js.map