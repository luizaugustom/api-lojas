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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNotificationPreferencesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateNotificationPreferencesDto {
}
exports.UpdateNotificationPreferencesDto = UpdateNotificationPreferencesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Alertas de estoque baixo',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "stockAlerts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Lembretes de contas a vencer',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "billReminders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Relatórios semanais',
        example: false,
        required: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "weeklyReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Alertas de vendas',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "salesAlerts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Atualizações do sistema',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "systemUpdates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Receber notificações por email',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "emailEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Receber notificações in-app',
        example: true,
        required: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "inAppEnabled", void 0);
//# sourceMappingURL=update-notification-preferences.dto.js.map