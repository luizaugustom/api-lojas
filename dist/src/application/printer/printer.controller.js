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
exports.PrinterController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const printer_service_1 = require("./printer.service");
const update_custom_footer_dto_1 = require("./dto/update-custom-footer.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
let PrinterController = class PrinterController {
    constructor(printerService) {
        this.printerService = printerService;
    }
    async discoverPrinters() {
        return this.printerService.discoverPrinters();
    }
    async addPrinter(user, printerConfig) {
        return this.printerService.addPrinter(user.companyId, printerConfig);
    }
    async getPrinters(user) {
        if (user.role === roles_decorator_1.UserRole.ADMIN) {
            return this.printerService.getPrinters();
        }
        return this.printerService.getPrinters(user.companyId);
    }
    async getPrinterStatus(id) {
        return this.printerService.getPrinterStatus(id);
    }
    async testPrinter(id) {
        const success = await this.printerService.testPrinter(id);
        return { success, message: success ? 'Teste realizado com sucesso' : 'Falha no teste da impressora' };
    }
    async updateCustomFooter(user, updateCustomFooterDto) {
        await this.printerService.updateCustomFooter(user.companyId, updateCustomFooterDto.customFooter || '');
        return { message: 'Footer personalizado atualizado com sucesso' };
    }
    async getCustomFooter(user) {
        const customFooter = await this.printerService.getCustomFooter(user.companyId);
        return { customFooter };
    }
};
exports.PrinterController = PrinterController;
__decorate([
    (0, common_1.Post)('discover'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Descobrir impressoras disponíveis' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de impressoras descobertas' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "discoverPrinters", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Adicionar nova impressora' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Impressora adicionada com sucesso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "addPrinter", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Listar impressoras' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de impressoras' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "getPrinters", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter status da impressora' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status da impressora' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "getPrinterStatus", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Testar impressora' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teste realizado com sucesso' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "testPrinter", null);
__decorate([
    (0, common_1.Post)('custom-footer'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar footer personalizado para NFCe' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Footer personalizado atualizado com sucesso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_custom_footer_dto_1.UpdateCustomFooterDto]),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "updateCustomFooter", null);
__decorate([
    (0, common_1.Get)('custom-footer'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter footer personalizado atual' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Footer personalizado atual' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "getCustomFooter", null);
exports.PrinterController = PrinterController = __decorate([
    (0, swagger_1.ApiTags)('printer'),
    (0, common_1.Controller)('printer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [printer_service_1.PrinterService])
], PrinterController);
//# sourceMappingURL=printer.controller.js.map