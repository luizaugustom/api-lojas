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
exports.BroadcastNotificationDto = exports.BroadcastTarget = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var BroadcastTarget;
(function (BroadcastTarget) {
    BroadcastTarget["ALL"] = "all";
    BroadcastTarget["COMPANIES"] = "companies";
    BroadcastTarget["SELLERS"] = "sellers";
})(BroadcastTarget || (exports.BroadcastTarget = BroadcastTarget = {}));
class BroadcastNotificationDto {
}
exports.BroadcastNotificationDto = BroadcastNotificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Título da notificação' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BroadcastNotificationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mensagem da notificação' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BroadcastNotificationDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Público-alvo', enum: BroadcastTarget }),
    (0, class_validator_1.IsEnum)(BroadcastTarget),
    __metadata("design:type", String)
], BroadcastNotificationDto.prototype, "target", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL de ação (opcional)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BroadcastNotificationDto.prototype, "actionUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Label do botão de ação (opcional)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BroadcastNotificationDto.prototype, "actionLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de expiração (opcional)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BroadcastNotificationDto.prototype, "expiresAt", void 0);
//# sourceMappingURL=broadcast-notification.dto.js.map