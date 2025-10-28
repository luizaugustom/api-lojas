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
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notification_service_1 = require("./notification.service");
const create_notification_dto_1 = require("./dto/create-notification.dto");
const update_notification_preferences_dto_1 = require("./dto/update-notification-preferences.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
let NotificationController = class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async create(createNotificationDto) {
        return this.notificationService.create(createNotificationDto);
    }
    async getPreferences(req) {
        const user = req.user;
        return this.notificationService.getPreferences(user.id, user.role);
    }
    async updatePreferences(req, updateDto) {
        const user = req.user;
        return this.notificationService.updatePreferences(user.id, user.role, updateDto);
    }
    async getUnreadCount(req) {
        const user = req.user;
        return this.notificationService.getUnreadCount(user.id, user.role);
    }
    async markAllAsRead(req) {
        const user = req.user;
        return this.notificationService.markAllAsRead(user.id, user.role);
    }
    async findAll(req, onlyUnread) {
        const user = req.user;
        return this.notificationService.findAllByUser(user.id, user.role, onlyUnread === true);
    }
    async findOne(id) {
        return this.notificationService.findOne(id);
    }
    async markAsRead(id, req) {
        const user = req.user;
        return this.notificationService.markAsRead(id, user.id, user.role);
    }
    async remove(id, req) {
        const user = req.user;
        return this.notificationService.delete(id, user.id, user.role);
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar notificação (uso interno ou admin)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notificação criada com sucesso' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_notification_dto_1.CreateNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('preferences/me'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter preferências de notificação do usuário' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Preferências de notificação' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Put)('preferences'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar preferências de notificação' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Preferências atualizadas' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_notification_preferences_dto_1.UpdateNotificationPreferencesDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter contagem de notificações não lidas' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Contagem de não lidas' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Put)('read-all'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar todas as notificações como lidas' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Todas as notificações marcadas como lidas' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar notificações do usuário autenticado' }),
    (0, swagger_1.ApiQuery)({ name: 'onlyUnread', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de notificações' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('onlyUnread')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Boolean]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter notificação por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notificação encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Notificação não encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/read'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar notificação como lida' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notificação marcada como lida' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Deletar notificação' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notificação deletada' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "remove", null);
exports.NotificationController = NotificationController = __decorate([
    (0, swagger_1.ApiTags)('notifications'),
    (0, common_1.Controller)('notification'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map