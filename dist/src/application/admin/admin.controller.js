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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const create_admin_dto_1 = require("./dto/create-admin.dto");
const update_admin_dto_1 = require("./dto/update-admin.dto");
const update_focus_nfe_config_dto_1 = require("./dto/update-focus-nfe-config.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const roles_guard_1 = require("../../shared/guards/roles.guard");
const roles_decorator_1 = require("../../shared/decorators/roles.decorator");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const uuid_validation_pipe_1 = require("../../shared/pipes/uuid-validation.pipe");
const notification_service_1 = require("../notification/notification.service");
const broadcast_notification_dto_1 = require("../notification/dto/broadcast-notification.dto");
let AdminController = class AdminController {
    constructor(adminService, notificationService) {
        this.adminService = adminService;
        this.notificationService = notificationService;
    }
    create(createAdminDto) {
        return this.adminService.create(createAdminDto);
    }
    findAll(page, limit) {
        return this.adminService.findAll();
    }
    updateFocusNfeConfig(user, updateFocusNfeConfigDto) {
        return this.adminService.updateFocusNfeConfig(user.id, updateFocusNfeConfigDto);
    }
    getFocusNfeConfig(user) {
        return this.adminService.getFocusNfeConfig(user.id);
    }
    async broadcastNotification(broadcastDto) {
        return this.notificationService.broadcastNotification(broadcastDto.title, broadcastDto.message, broadcastDto.target, broadcastDto.actionUrl, broadcastDto.actionLabel, broadcastDto.expiresAt);
    }
    findOne(id) {
        return this.adminService.findOne(id);
    }
    update(id, updateAdminDto) {
        return this.adminService.update(id, updateAdminDto);
    }
    remove(id) {
        return this.adminService.remove(id);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Criar novo admin' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Admin criado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Login já está em uso' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_dto_1.CreateAdminDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos os admins' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de admins' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)('focus-nfe-config'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar configurações globais do Focus NFe' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configurações atualizadas com sucesso' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_focus_nfe_config_dto_1.UpdateFocusNfeConfigDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateFocusNfeConfig", null);
__decorate([
    (0, common_1.Get)('focus-nfe-config'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Obter configurações globais do Focus NFe' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configurações do Focus NFe' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getFocusNfeConfig", null);
__decorate([
    (0, common_1.Post)('broadcast-notification'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Enviar notificação em massa para usuários' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notificação enviada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [broadcast_notification_dto_1.BroadcastNotificationDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "broadcastNotification", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar admin por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar admin' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin atualizado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Login já está em uso' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_admin_dto_1.UpdateAdminDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Remover admin' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin removido com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Admin não encontrado' }),
    __param(0, (0, common_1.Param)('id', uuid_validation_pipe_1.UuidValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "remove", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        notification_service_1.NotificationService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map