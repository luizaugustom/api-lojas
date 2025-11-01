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
const add_printer_dto_1 = require("./dto/add-printer.dto");
const update_custom_footer_dto_1 = require("./dto/update-custom-footer.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const uuid_validation_pipe_1 = require("../../shared/pipes/uuid-validation.pipe");
let PrinterController = class PrinterController {
    constructor(printerService) {
        this.printerService = printerService;
    }
    async discoverPrinters() {
        return this.printerService.discoverPrinters();
    }
    async addPrinter(user, printerConfig) {
        if (!user.companyId) {
            throw new common_1.BadRequestException('Usuário não possui empresa associada');
        }
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
    async getAvailablePrinters() {
        return await this.printerService.getAvailablePrinters();
    }
    async checkDrivers() {
        return await this.printerService.checkDrivers();
    }
    async installDrivers() {
        return await this.printerService.installDrivers();
    }
    async checkAndInstallDrivers() {
        return await this.printerService.checkAndInstallDrivers();
    }
    async openCashDrawer(id) {
        const success = await this.printerService.openCashDrawer(id);
        return { success, message: success ? 'Gaveta aberta com sucesso' : 'Falha ao abrir gaveta' };
    }
    async getPrintQueue(id) {
        return await this.printerService.getPrintQueue(id);
    }
    async getPrinterLogs(id) {
        const logs = await this.printerService.getPrinterLogs(id);
        return { logs };
    }
    async deletePrinter(user, id) {
        if (!id)
            throw new common_1.BadRequestException('ID inválido');
        const result = await this.printerService.deletePrinter(user, id);
        return { success: true, deletedId: result.id };
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
    __metadata("design:paramtypes", [Object, add_printer_dto_1.AddPrinterDto]),
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
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "getPrinterStatus", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Testar impressora' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teste realizado com sucesso' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
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
__decorate([
    (0, common_1.Get)('available'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Listar impressoras disponíveis no sistema' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de impressoras do sistema' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "getAvailablePrinters", null);
__decorate([
    (0, common_1.Get)('check-drivers'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar drivers de impressora instalados' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status dos drivers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "checkDrivers", null);
__decorate([
    (0, common_1.Post)('install-drivers'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Instalar drivers de impressora' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Resultado da instalação' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "installDrivers", null);
__decorate([
    (0, common_1.Post)('check-drivers'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar e instalar drivers de impressora (DEPRECATED)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status dos drivers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "checkAndInstallDrivers", null);
__decorate([
    (0, common_1.Post)(':id/open-drawer'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Abrir gaveta de dinheiro' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Gaveta aberta com sucesso' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "openCashDrawer", null);
__decorate([
    (0, common_1.Get)(':id/queue'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter fila de impressão' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fila de impressão' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "getPrintQueue", null);
__decorate([
    (0, common_1.Get)(':id/logs'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Obter logs recentes da impressora' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logs de impressora' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "getPrinterLogs", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN, roles_decorator_1.UserRole.COMPANY),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir impressora' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Impressora excluída com sucesso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PrinterController.prototype, "deletePrinter", null);
exports.PrinterController = PrinterController = __decorate([
    (0, swagger_1.ApiTags)('printer'),
    (0, common_1.Controller)('printer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [printer_service_1.PrinterService])
], PrinterController);
//# sourceMappingURL=printer.controller.js.map